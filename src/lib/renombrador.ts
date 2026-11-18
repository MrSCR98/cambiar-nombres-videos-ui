// ─────────────────────────────────────────────────────────────────────────────
// Lógica pura del renombrador (sin disco, sin Tauri, sin React).
// Es la migración de los scripts .ts de Deno: todo lo que "piensa" vive aquí
// y lo que "toca el disco" vive en Rust (src-tauri/src/archivos.rs).
// ─────────────────────────────────────────────────────────────────────────────

export const FRASE_IA =
  'Corrige las frases en español de España y pon todas las letras en mayúsculas. Si te paso un array devuelve un array en una sola línea.'

export const LIMITE_CARACTERES = 100

export const TODAS_LAS_HORAS: number[] = Array.from({ length: 24 }, (_, i) => i)

const rango = (a: number, b: number) =>
  Array.from({ length: b - a + 1 }, (_, i) => a + i)

export interface PresetHoras {
  id: string
  etiqueta: string
  horas: number[]
}

/** Atajos para marcar horas rápidamente (equivalen a los 4 scripts originales + extras). */
export const PRESETS_HORAS: PresetHoras[] = [
  { id: 'noche', etiqueta: '00 + 15–23', horas: [0, ...rango(15, 23)] },
  { id: 'dia', etiqueta: '01–14', horas: rango(1, 14) },
  { id: 'todas', etiqueta: 'Todas', horas: TODAS_LAS_HORAS },
  { id: 'pares', etiqueta: 'Pares', horas: TODAS_LAS_HORAS.filter((h) => h % 2 === 0) },
  { id: 'impares', etiqueta: 'Impares', horas: TODAS_LAS_HORAS.filter((h) => h % 2 === 1) },
  { id: 'ninguna', etiqueta: 'Ninguna', horas: [] },
]

export const mismasHoras = (a: number[], b: number[]) =>
  a.length === b.length && a.every((h, i) => h === b[i])

// ─────────────────────────────────────────────────────────────────────────────
// Nombres
// ─────────────────────────────────────────────────────────────────────────────

/** Prefijo de numeración: "0000 00 " (contador de 4 cifras + hora de 2 cifras). */
const RE_NUMERACION = /^(\d{4})\s(\d{2})\s+/

export const pad4 = (n: number) => n.toString().padStart(4, '0')
export const pad2 = (n: number) => n.toString().padStart(2, '0')

export function leerNumeracion(nombre: string): { contador: number; hora: number } | null {
  const m = nombre.match(RE_NUMERACION)
  if (!m) return null
  return { contador: parseInt(m[1]!, 10), hora: parseInt(m[2]!, 10) }
}

export const tieneNumeracion = (nombre: string) => RE_NUMERACION.test(nombre)

export const quitarNumeracion = (nombre: string) => nombre.replace(RE_NUMERACION, '')

/** Extensión con el punto (".mp4"). Vacío si no tiene. */
export function extension(nombre: string): string {
  const idx = nombre.lastIndexOf('.')
  return idx > 0 ? nombre.slice(idx) : ''
}

export function sinExtension(nombre: string): string {
  const idx = nombre.lastIndexOf('.')
  return idx > 0 ? nombre.slice(0, idx) : nombre
}

/** Quita los caracteres que Windows no permite en un nombre de archivo. */
export const limpiarNombre = (nombre: string) =>
  nombre.replace(/[\\/:*?"<>|]/g, '').replace(/[\u0000-\u001f]/g, '').trim()

/** Título tal y como quedará (limpio y, si se pide, en mayúsculas). */
export const tituloFinal = (titulo: string, mayusculas: boolean) => {
  const limpio = limpiarNombre(titulo)
  return mayusculas ? limpio.toUpperCase() : limpio
}

/** Longitud en caracteres visibles (un emoji cuenta como 1, no como 2). */
export const longitud = (texto: string) => [...texto].length

// ─────────────────────────────────────────────────────────────────────────────
// Estado de la carpeta
// ─────────────────────────────────────────────────────────────────────────────

export interface EstadoCarpeta {
  total: number
  numerados: number
  sinNumerar: number
  /** Vídeos de la carpeta extra (se tratan siempre como nuevos y se mueven a la principal). */
  extras: number
  /** Mayor contador de 4 cifras encontrado en la carpeta principal (-1 si no hay ninguno). */
  ultimoContador: number
  /** Hora (00-23) del archivo con el contador más alto (-1 si no hay). */
  ultimaHora: number
}

export function analizarCarpeta(archivos: string[], extras = 0): EstadoCarpeta {
  let numerados = 0
  let ultimoContador = -1
  let ultimaHora = -1
  for (const f of archivos) {
    const n = leerNumeracion(f)
    if (!n) continue
    numerados++
    if (n.contador > ultimoContador) {
      ultimoContador = n.contador
      ultimaHora = n.hora
    }
  }
  return {
    total: archivos.length,
    numerados,
    sinNumerar: archivos.length - numerados,
    extras,
    ultimoContador,
    ultimaHora,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Modos de numeración
// ─────────────────────────────────────────────────────────────────────────────

export type ModoNumeracion = 'anadir' | 'quitar' | 'renumerar' | 'mantener'

export function modoDisponible(modo: ModoNumeracion, e: EstadoCarpeta): boolean {
  switch (modo) {
    case 'anadir':
    case 'mantener':
      return e.sinNumerar + e.extras > 0
    case 'quitar':
      return e.numerados > 0
    case 'renumerar':
      return e.total + e.extras > 0
  }
}

export function modoPorDefecto(e: EstadoCarpeta): ModoNumeracion {
  if (e.sinNumerar + e.extras > 0) return 'anadir'
  if (e.numerados > 0) return 'quitar'
  return 'anadir'
}

/** Si el modo pedido no tiene sentido con lo que hay en las carpetas, usa el de por defecto. */
export const resolverModo = (pedido: ModoNumeracion, e: EstadoCarpeta) =>
  modoDisponible(pedido, e) ? pedido : modoPorDefecto(e)

/** Un archivo a procesar: de la carpeta principal o de la extra. */
interface Item {
  orig: string
  extra: boolean
  /** Solo los de la principal pueden "estar numerados"; los extra siempre son nuevos. */
  numerado: boolean
  /** Identificador único (el mismo nombre puede existir en ambas carpetas). */
  key: string
}

/** Clave única de un archivo (la que usa la lista de excluidos). */
export const claveArchivo = (nombre: string, extra: boolean) => (extra ? `extra/${nombre}` : nombre)

function construirItems(archivos: string[], extras: string[]): Item[] {
  return [
    ...archivos.map((orig) => ({ orig, extra: false, numerado: tieneNumeracion(orig), key: claveArchivo(orig, false) })),
    ...extras.map((orig) => ({ orig, extra: true, numerado: false, key: claveArchivo(orig, true) })),
  ]
}

function indicesDeTitulos(items: Item[], modo: ModoNumeracion): number[] {
  const todos = items.map((_, i) => i)
  return modo === 'renumerar' ? todos : todos.filter((i) => !items[i]!.numerado)
}

/**
 * Los archivos a los que se les cambia el título:
 *  - renumerar → todos (se parte de cero)
 *  - resto     → los que NO tienen numeración + todos los de la carpeta extra
 */
export const basesTitulos = (archivos: string[], extras: string[], modo: ModoNumeracion): string[] => {
  const items = construirItems(archivos, extras)
  return indicesDeTitulos(items, modo).map((i) => sinExtension(quitarNumeracion(items[i]!.orig)))
}

// ─────────────────────────────────────────────────────────────────────────────
// Lectura de los títulos pegados
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mensaje para pasárselo a la IA cuando el número de títulos no coincide:
 *   «Necesito exactamente 1276 nombres.»
 *   «Falta 1 (1275/1276).»  /  «Faltan 2 (1274/1276).»  /  «Sobra 1 (1277/1276).»
 */
export function mensajeConteo(
  actual: number,
  total: number
): {
  titulo: string
  detalle: string
  /** «Faltan 2 (1274/1276)» sin punto final (para la etiqueta). */
  corto: string
  /** Solo el verbo concordado: Falta / Faltan / Sobra / Sobran. */
  verbo: string
  texto: string
  falta: boolean
  diferencia: number
} | null {
  if (actual === total) return null
  const falta = actual < total
  const diferencia = Math.abs(actual - total)
  const uno = diferencia === 1
  const verbo = falta ? (uno ? 'Falta' : 'Faltan') : uno ? 'Sobra' : 'Sobran'
  const titulo = `Necesito exactamente ${total} nombres.`
  const corto = `${verbo} ${diferencia} (${actual}/${total})`
  const detalle = `${corto}.`
  return { titulo, detalle, corto, verbo, texto: `${titulo}\n${detalle}`, falta, diferencia }
}

export interface TitulosParseados {
  titulos: string[]
  formato: 'vacio' | 'json' | 'lineas'
  error?: string
}

/**
 * Acepta un array JSON de strings (también si viene dentro de ```json … ``` o con
 * texto alrededor) o, si no es JSON, un título por línea.
 */
export function parsearTitulos(texto: string): TitulosParseados {
  let t = texto.trim()
  if (t === '') return { titulos: [], formato: 'vacio' }

  // La IA suele envolver la respuesta en un bloque de código.
  t = t.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '').trim()

  let candidato: string | null = null
  if (t.startsWith('[')) candidato = t
  else {
    const m = t.match(/(?:^|\n)\s*(\[[\s\S]*\])\s*$/)
    if (m) candidato = m[1]!
  }

  if (candidato !== null) {
    try {
      const parsed: unknown = JSON.parse(candidato)
      if (!Array.isArray(parsed)) throw new Error('no array')
      if (!parsed.every((x) => typeof x === 'string')) {
        return {
          titulos: [],
          formato: 'json',
          error: 'Todos los elementos deben ser strings de texto.',
        }
      }
      return { titulos: parsed as string[], formato: 'json' }
    } catch {
      // Parece un array JSON roto (empieza por [" ) → avisamos en vez de tratarlo como líneas.
      if (/^\[\s*"/.test(t)) {
        return {
          titulos: [],
          formato: 'json',
          error: 'JSON inválido. Usa comillas dobles y corchetes. Ej: ["Nombre 1", "Nombre 2"]',
        }
      }
      // Si había texto antes y no era JSON, caemos a "una línea = un título".
    }
  }

  const lineas = t
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '')
  return { titulos: lineas, formato: 'lineas' }
}

// ─────────────────────────────────────────────────────────────────────────────
// Plan de cambios
// ─────────────────────────────────────────────────────────────────────────────

export interface EntradaPlan {
  /** Archivos de la carpeta principal (destino). */
  archivos: string[]
  /** Archivos de la carpeta extra: se titulan, numeran y se mueven a la principal. */
  extras: string[]
  modo: ModoNumeracion
  /** Horas marcadas (se usan en el orden ascendente en el que están). */
  horas: number[]
  horaInicio: number | 'auto'
  aleatorio: boolean
  semilla: number
  /** null = no se cambian los títulos. */
  titulos: string[] | null
  mayusculas: boolean
  /** Claves (ver claveArchivo) de los archivos que el usuario ha desmarcado. */
  excluidos: ReadonlySet<string>
}

export interface CambioPlan {
  orig: string
  nuevo: string
  /** true = el archivo está en la carpeta extra y se moverá a la principal. */
  extra: boolean
  key: string
  /** Contador de 4 cifras (para ordenar). -1 si no tiene. */
  id: number
  duplicado: boolean
}

export interface Plan {
  cambios: CambioPlan[]
  /** Errores que impiden aplicar. */
  errores: string[]
  /** Índices (dentro de la lista de títulos) que quedan vacíos tras limpiar. */
  titulosVacios: number[]
}

// PRNG determinista: así la vista previa es estable mientras no pulses "Mezclar".
function mulberry32(semilla: number) {
  let a = semilla >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher-Yates con semilla. */
export function mezclar<T>(lista: T[], semilla: number): T[] {
  const r = [...lista]
  const rnd = mulberry32(semilla)
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[r[i], r[j]] = [r[j]!, r[i]!]
  }
  return r
}

/** Posición (dentro de `horas`) por la que empieza a numerar. */
function posicionInicial(horas: number[], horaInicio: number | 'auto', ultimaHora: number): number {
  if (typeof horaInicio === 'number') {
    const idx = horas.indexOf(horaInicio)
    if (idx !== -1) return idx
  }
  if (ultimaHora >= 0) {
    // Continúa por la siguiente hora marcada y da la vuelta si se acaban.
    const idx = horas.findIndex((h) => h > ultimaHora)
    return idx === -1 ? 0 : idx
  }
  return 0
}

export function calcularPlan(e: EntradaPlan): Plan {
  const { archivos, extras, modo, horas, horaInicio, aleatorio, semilla, titulos, mayusculas, excluidos } = e
  const errores: string[] = []
  const titulosVacios: number[] = []

  const items = construirItems(archivos, extras)
  // Los de la carpeta extra siempre empiezan sin prefijo antiguo.
  const nuevo = items.map((it) => (it.extra ? quitarNumeracion(it.orig) : it.orig))
  const fuera = (it: Item) => excluidos.has(it.key)

  const quita = modo === 'quitar' || modo === 'renumerar'
  const numera = modo === 'anadir' || modo === 'renumerar'

  // 1) Quitar numeración existente (solo carpeta principal).
  if (quita) {
    items.forEach((it, i) => {
      if (!fuera(it) && it.numerado) nuevo[i] = quitarNumeracion(it.orig)
    })
  }

  // 2) Títulos nuevos (conservan la extensión original).
  if (titulos) {
    const idxT = indicesDeTitulos(items, modo)
    if (titulos.length !== idxT.length) {
      const m = mensajeConteo(titulos.length, idxT.length)!
      errores.push(
        `${m.verbo} ${m.diferencia} título${m.diferencia === 1 ? '' : 's'}: hay ${titulos.length} y se necesitan ${idxT.length}.`
      )
    } else {
      idxT.forEach((i, k) => {
        const it = items[i]!
        if (fuera(it)) return
        const final = tituloFinal(titulos[k]!, mayusculas)
        if (final === '') {
          titulosVacios.push(k)
          return
        }
        nuevo[i] = final + extension(it.orig)
      })
      if (titulosVacios.length > 0) {
        errores.push(
          'Estos nombres quedaron vacíos tras eliminar caracteres inválidos:\n' +
            titulosVacios.map((k) => `[${k}] "${titulos[k]}"`).join('\n')
        )
      }
    }
  }

  // 3) Numeración "0000 00 ". Continúa siempre desde lo que ya hay en la carpeta principal.
  if (numera) {
    const candidatos = items
      .map((_, i) => i)
      .filter((i) => (modo === 'renumerar' || !items[i]!.numerado) && !fuera(items[i]!))

    if (candidatos.length > 0) {
      if (horas.length === 0) {
        errores.push('Marca al menos una hora para poder numerar.')
      } else {
        const estado = analizarCarpeta(archivos)
        const base = modo === 'anadir' ? estado.ultimoContador : -1
        const ultimaHora = modo === 'anadir' ? estado.ultimaHora : -1
        const orden = aleatorio ? mezclar(candidatos, semilla) : candidatos
        let pos = posicionInicial(horas, horaInicio, ultimaHora)
        let contador = base + 1
        for (const i of orden) {
          nuevo[i] = `${pad4(contador)} ${pad2(horas[pos % horas.length]!)} ${nuevo[i]}`
          pos++
          contador++
        }
      }
    }
  }

  // 4) Nombres que quedarán en la carpeta principal (los extra excluidos no se mueven).
  const veces = new Map<string, number>()
  items.forEach((it, i) => {
    if (it.extra && fuera(it)) return
    const k = nuevo[i]!.toLowerCase()
    veces.set(k, (veces.get(k) ?? 0) + 1)
  })

  const cambios: CambioPlan[] = []
  items.forEach((it, i) => {
    const n = nuevo[i]!
    if (fuera(it)) return
    if (!it.extra && n === it.orig) return // sin cambio (los extra siempre se mueven)
    cambios.push({
      orig: it.orig,
      nuevo: n,
      extra: it.extra,
      key: it.key,
      id: leerNumeracion(n)?.contador ?? (it.extra ? -1 : (leerNumeracion(it.orig)?.contador ?? -1)),
      duplicado: (veces.get(n.toLowerCase()) ?? 0) > 1,
    })
  })
  cambios.sort((a, b) => a.id - b.id || a.orig.localeCompare(b.orig))

  const repetidos = cambios.filter((c) => c.duplicado)
  if (repetidos.length > 0) {
    errores.push(
      `Hay ${repetidos.length} nombre(s) repetido(s) (dos archivos acabarían llamándose igual). Edita los títulos.`
    )
  }

  return { cambios, errores, titulosVacios }
}
