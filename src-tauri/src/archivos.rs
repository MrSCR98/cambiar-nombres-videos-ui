// ─────────────────────────────────────────────────────────────────────────────
// Operaciones de disco: listar carpetas, renombrar en lote y mover desde la carpeta extra.
// Equivale a `listarArchivos`, `renombrarSeguro` y `renombrarFisicamente` de los
// scripts de Deno. No guarda nada en el ordenador: solo toca los archivos del
// usuario cuando éste pulsa "Aplicar".
// ─────────────────────────────────────────────────────────────────────────────

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::thread::sleep;
use std::time::Duration;

#[derive(Debug, Deserialize)]
pub struct Cambio {
    pub original: String,
    pub nuevo: String,
    /// true = el archivo está en la carpeta extra y se moverá a la principal.
    #[serde(default)]
    pub desde_extra: bool,
}

#[derive(Debug, Serialize)]
pub struct Fallo {
    pub archivo: String,
    pub error: String,
}

#[derive(Debug, Serialize)]
pub struct ResultadoRenombrado {
    pub correctos: usize,
    pub fallidos: Vec<Fallo>,
}

// ─────────────────────────────────────────────────────────────────────────────
// Listar
// ─────────────────────────────────────────────────────────────────────────────

/// En Windows ignoramos los archivos ocultos (desktop.ini, Thumbs.db…) para que
/// no cuenten como si fueran vídeos.
#[cfg(windows)]
fn es_oculto(meta: &fs::Metadata) -> bool {
    use std::os::windows::fs::MetadataExt;
    const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;
    meta.file_attributes() & FILE_ATTRIBUTE_HIDDEN != 0
}

#[cfg(not(windows))]
fn es_oculto(_meta: &fs::Metadata) -> bool {
    false
}

fn listar(ruta: &str) -> Result<Vec<String>, String> {
    let dir = Path::new(ruta);
    if !dir.is_dir() {
        return Err(format!("La carpeta no existe o no se puede leer: {}", ruta));
    }

    let entradas = fs::read_dir(dir).map_err(|e| format!("No se pudo leer la carpeta: {}", e))?;

    let mut nombres: Vec<String> = Vec::new();
    for entrada in entradas {
        let entrada = match entrada {
            Ok(e) => e,
            Err(_) => continue,
        };
        let meta = match entrada.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        // Solo archivos (como `entry.isFile` de Deno): se ignoran las subcarpetas.
        if !meta.is_file() || es_oculto(&meta) {
            continue;
        }
        if let Some(nombre) = entrada.file_name().to_str() {
            nombres.push(nombre.to_string());
        }
    }

    // Orden estable (alfabético sin distinguir mayúsculas) para que la lista de
    // títulos que se copia y la que se pega correspondan siempre al mismo orden.
    nombres.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()).then(a.cmp(b)));
    Ok(nombres)
}

#[tauri::command]
pub async fn listar_archivos(ruta: String) -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || listar(&ruta))
        .await
        .map_err(|e| e.to_string())?
}

// ─────────────────────────────────────────────────────────────────────────────
// Renombrar / mover
// ─────────────────────────────────────────────────────────────────────────────

fn nombre_valido(nombre: &str) -> Result<(), String> {
    let t = nombre.trim();
    if t.is_empty() || t == "." || t == ".." {
        return Err("hay un nombre vacío o no válido".to_string());
    }
    let prohibido = |c: char| matches!(c, '\\' | '/' | ':' | '*' | '?' | '"' | '<' | '>' | '|') || c.is_control();
    if nombre.chars().any(prohibido) {
        return Err(format!("el nombre \"{}\" contiene caracteres no permitidos", nombre));
    }
    Ok(())
}

/// ¿Son la misma carpeta? (compara rutas reales; si falla, compara el texto)
fn misma_carpeta(a: &Path, b: &Path) -> bool {
    match (fs::canonicalize(a), fs::canonicalize(b)) {
        (Ok(x), Ok(y)) => x == y,
        _ => a.to_string_lossy().to_lowercase() == b.to_string_lossy().to_lowercase(),
    }
}

/// Renombra (o mueve) un archivo.
/// - Dentro de la misma carpeta: hasta 3 intentos con 300 ms de espera (antivirus, etc.).
/// - Entre carpetas: un intento de renombrado y, si falla (p. ej. otro disco), copia y borra
///   el original. Nunca deja el archivo duplicado: si no se puede borrar el original,
///   se elimina la copia y se informa del error.
fn mover(origen: &Path, destino: &Path, entre_carpetas: bool) -> Result<(), String> {
    let intentos = if entre_carpetas { 1 } else { 3 };
    let mut ultimo_error = String::new();
    for intento in 0..intentos {
        match fs::rename(origen, destino) {
            Ok(()) => return Ok(()),
            Err(e) => {
                ultimo_error = e.to_string();
                if intento + 1 < intentos {
                    sleep(Duration::from_millis(300));
                }
            }
        }
    }

    if !entre_carpetas || destino.exists() {
        return Err(ultimo_error);
    }

    match fs::copy(origen, destino) {
        Ok(_) => match fs::remove_file(origen) {
            Ok(()) => Ok(()),
            Err(e) => {
                let _ = fs::remove_file(destino);
                Err(format!("No se pudo borrar el original tras copiarlo: {}", e))
            }
        },
        Err(e) => {
            let _ = fs::remove_file(destino);
            Err(format!("{} / {}", ultimo_error, e))
        }
    }
}

struct Pendiente {
    /// Carpeta en la que está ahora el archivo.
    dir: PathBuf,
    /// Nombre actual en disco (puede ser temporal si se rompió un ciclo).
    actual: String,
    /// Nombre con el que lo ve el usuario (para informar de fallos).
    visible: String,
    nuevo: String,
    temporal: bool,
    extra: bool,
}

fn renombrar(
    ruta: &str,
    ruta_extra: Option<String>,
    cambios: Vec<Cambio>,
) -> Result<ResultadoRenombrado, String> {
    let dir = PathBuf::from(ruta);
    if !dir.is_dir() {
        return Err(format!("La carpeta no existe o no se puede leer: {}", ruta));
    }

    let dir_extra: Option<PathBuf> = match ruta_extra.as_deref().map(str::trim) {
        Some(r) if !r.is_empty() => {
            let d = PathBuf::from(r);
            if !d.is_dir() {
                return Err(format!("La carpeta extra no existe o no se puede leer: {}", r));
            }
            if misma_carpeta(&dir, &d) {
                return Err("La carpeta extra no puede ser la misma que la principal.".to_string());
            }
            Some(d)
        }
        _ => None,
    };

    // 1) Validación completa ANTES de tocar nada: o se puede todo o no se hace nada.
    let mut pendientes: Vec<Pendiente> = Vec::new();
    for c in cambios {
        nombre_valido(&c.original)?;
        nombre_valido(&c.nuevo)?;
        if !c.desde_extra && c.original == c.nuevo {
            continue;
        }
        let dir_origen = if c.desde_extra {
            match &dir_extra {
                Some(d) => d.clone(),
                None => return Err("Falta la carpeta extra para mover los archivos.".to_string()),
            }
        } else {
            dir.clone()
        };
        pendientes.push(Pendiente {
            dir: dir_origen,
            actual: c.original.clone(),
            visible: c.original,
            nuevo: c.nuevo,
            temporal: false,
            extra: c.desde_extra,
        });
    }

    if pendientes.is_empty() {
        return Ok(ResultadoRenombrado {
            correctos: 0,
            fallidos: Vec::new(),
        });
    }

    // Nombres de la carpeta principal que van a quedar libres porque ese archivo también cambia.
    let liberados: HashSet<String> = pendientes
        .iter()
        .filter(|p| !p.extra)
        .map(|p| p.actual.to_lowercase())
        .collect();
    let mut destinos: HashSet<String> = HashSet::new();
    for p in &pendientes {
        if !p.dir.join(&p.actual).is_file() {
            return Err(format!(
                "El archivo \"{}\" ya no existe. Recarga las carpetas.",
                p.actual
            ));
        }
        if !destinos.insert(p.nuevo.to_lowercase()) {
            return Err(format!(
                "Dos archivos acabarían llamándose \"{}\". No se ha cambiado nada.",
                p.nuevo
            ));
        }
        let solo_cambia_mayusculas = !p.extra && p.actual.to_lowercase() == p.nuevo.to_lowercase();
        if !solo_cambia_mayusculas
            && dir.join(&p.nuevo).exists()
            && !liberados.contains(&p.nuevo.to_lowercase())
        {
            return Err(format!(
                "Ya existe un archivo llamado \"{}\" en la carpeta principal. No se ha cambiado nada.",
                p.nuevo
            ));
        }
    }

    // 2) Ejecución. Si un destino todavía lo ocupa otro archivo que también se va a
    //    renombrar, se espera a que se libere; si hay un ciclo (A→B y B→A) se rompe
    //    moviendo uno a un nombre temporal. Así nunca se pisa un archivo.
    let mut correctos: usize = 0;
    let mut fallidos: Vec<Fallo> = Vec::new();
    let mut cola = pendientes;
    let mut contador_temporal: u32 = 0;

    while !cola.is_empty() {
        let mut bloqueados: Vec<Pendiente> = Vec::new();
        let mut hubo_progreso = false;

        for p in cola {
            let destino = dir.join(&p.nuevo);
            let solo_cambia_mayusculas = !p.extra && p.actual.to_lowercase() == p.nuevo.to_lowercase();

            if solo_cambia_mayusculas || !destino.exists() {
                match mover(&p.dir.join(&p.actual), &destino, p.extra) {
                    Ok(()) => correctos += 1,
                    Err(error) => fallidos.push(Fallo {
                        archivo: p.visible.clone(),
                        error,
                    }),
                }
                hubo_progreso = true;
            } else {
                bloqueados.push(p);
            }
        }

        if bloqueados.is_empty() {
            break;
        }

        if !hubo_progreso {
            // Solo se pueden "aparcar" archivos de la carpeta principal.
            match bloqueados.iter().position(|p| !p.temporal && !p.extra) {
                Some(pos) => {
                    let mut p = bloqueados.remove(pos);
                    contador_temporal += 1;
                    let temporal = format!("__renombrando_{}_{}.tmp", std::process::id(), contador_temporal);
                    match fs::rename(p.dir.join(&p.actual), dir.join(&temporal)) {
                        Ok(()) => {
                            p.actual = temporal;
                            p.temporal = true;
                            bloqueados.push(p);
                        }
                        Err(e) => fallidos.push(Fallo {
                            archivo: p.visible,
                            error: e.to_string(),
                        }),
                    }
                }
                None => {
                    for p in bloqueados {
                        fallidos.push(Fallo {
                            archivo: p.visible,
                            error: "El nombre de destino está ocupado".to_string(),
                        });
                    }
                    break;
                }
            }
        }

        cola = bloqueados;
    }

    Ok(ResultadoRenombrado { correctos, fallidos })
}

#[tauri::command]
pub async fn renombrar_lote(
    ruta: String,
    ruta_extra: Option<String>,
    cambios: Vec<Cambio>,
) -> Result<ResultadoRenombrado, String> {
    tauri::async_runtime::spawn_blocking(move || renombrar(&ruta, ruta_extra, cambios))
        .await
        .map_err(|e| e.to_string())?
}
