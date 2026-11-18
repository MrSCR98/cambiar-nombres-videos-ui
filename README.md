# <img src="app-icon.png" alt="Logo" height="24"> Cambiar Nombres Videos UI SCR98

Una aplicación sencilla para renombrar y numerar tus vídeos en lote, sin scripts ni comandos.

Eliges la carpeta, marcas las horas, pegas los títulos que te devuelve la IA y la app te enseña una vista previa antes de tocar nada.

---

## ⬇️ Descargar

👉 [cambiar-nombres-videos-ui.exe](https://github.com/MrSCR98/cambiar-nombres-videos-ui/releases/download/Ejecutable/cambiar-nombres-videos-ui.exe)

---

## 🚀 ¿Qué hace esta aplicación?

- Pone una numeración delante del nombre: `0000 00 NOMBRE.mp4` (contador + hora)
- Añade la numeración a los vídeos que no la tienen, la quita o vuelve a numerar todo
- Continúa por el último número aunque hayas borrado los primeros
- Te deja marcar las horas que quieres usar, con atajos rápidos (pares, impares, `00 + 15–23`, `01–14`, todas…)
- Cambia los títulos de los vídeos con los que te devuelva la IA, en MAYÚSCULAS si quieres
- Cuenta los títulos y te avisa si faltan o sobran
- Marca en rojo los títulos de más de 100 caracteres para que los edites
- Permite usar una segunda carpeta (opcional) para mover vídeos nuevos a la principal
- Muestra una vista previa y te pide confirmación antes de cambiar nada

---

## 🧑‍💻 Uso para cualquier persona (paso a paso)

### 📁 1. Preparar la aplicación

1. Descarga el `.exe`
2. Guárdalo donde quieras (no necesita instalación)
3. Ejecútalo

💡 Prueba la primera vez con una **carpeta de copias** de tus vídeos: la app no tiene botón de deshacer.

---

### 🎮 2. Usar la aplicación (en orden)

---

### 1️⃣ Elegir la carpeta principal

Es la carpeta donde están (y donde acabarán) tus vídeos. Hay tres formas de elegirla:

- ✍️ Escribe o pega la ruta y pulsa **Enter** o **"Cargar"**
- 📂 Pulsa **"Examinar…"** y elígela en el buscador de Windows
- 🖱️ **Arrástrala** desde el Explorador hasta la ventana (suéltala en la mitad **izquierda**)

Al cargarla verás cuántos archivos hay, cuántos están numerados y cuál fue el último número usado.

💡 Solo se leen archivos: las subcarpetas y los archivos ocultos de Windows se ignoran.

---

### 2️⃣ Carpeta extra (opcional)

Sirve para trabajar con vídeos nuevos que están en otra carpeta. Se elige igual que la principal (si la arrastras, suéltala en la mitad **derecha**).

Tiene dos modos:

- **Mover a la principal**: los vídeos se titulan, se numeran a continuación de la carpeta principal y se mueven a ella
- **Solo renombrar aquí**: la carpeta extra se trata como una carpeta normal, con su propia numeración, sin mover nada y sin tocar la principal

Y dos controles:

- **"Usar la carpeta extra"** (interruptor): la desactiva sin perder la ruta
- **"Quitar carpeta extra"**: borra la ruta y vuelve a usar solo la principal

💡 Los vídeos de la carpeta extra se tratan siempre como nuevos: si traían un prefijo `0000 00 `, se descarta.

---

### 3️⃣ Elegir qué hacer con la numeración

Hay cuatro modos:

| Modo | Qué hace |
|---|---|
| **Añadir** | Numera solo los que no tienen numeración |
| **Quitar** | Quita el prefijo a los que lo tienen |
| **Renumerar** | Quita la numeración y vuelve a numerar todo desde `0000` |
| **No tocar** | No toca la numeración, solo cambia títulos |

Si un modo no tiene sentido con lo que hay en la carpeta, aparece deshabilitado.

---

### 4️⃣ Marcar las horas

Cada vídeo recibe un contador (`0000`, `0001`, `0002`…) y una hora. El contador sube de uno en uno. La hora recorre solo las horas que marques, de menor a mayor, y al llegar a la última vuelve a la primera.

Atajos:

- **00 + 15–23** (viene marcado por defecto)
- **01–14**
- **Todas**
- **Pares**
- **Impares**
- **Ninguna**

También puedes marcar o desmarcar cada hora una a una.

---

### 5️⃣ Hora inicial

- **Automática** (por defecto):
  - Si ya hay numeración, continúa desde el contador más alto + 1, con la hora siguiente a la del último
  - Si no hay ninguna, empieza en `0000` con la hora marcada más baja
- **Empezar en la XX**: fuerzas tú la hora del primer vídeo

Ejemplos con las horas `00 + 15–23` marcadas:

| Situación | Resultado |
|---|---|
| 3 vídeos sin numerar, Automática | `0000 00`, `0001 15`, `0002 16` |
| 3 vídeos sin numerar, Empezar en la 18 | `0000 18`, `0001 19`, `0002 20` |
| Está `0006 18 X` y 2 vídeos nuevos | `0007 19`, `0008 20` |
| Borraste los primeros, quedan `0005 17` y `0006 18` | el nuevo es `0007 19` (sigue desde el más alto) |
| Está `0010 23 X` | el nuevo es `0011 00` (da la vuelta) |

---

### 6️⃣ Orden aleatorio

Viene activado: los vídeos se barajan antes de numerarlos. Pulsa **"Mezclar"** para volver a barajar. Si lo desactivas, se numeran en orden alfabético.

---

### 7️⃣ Cambiar los títulos (opcional)

Interruptor **"Cambiar los títulos"** y, dentro, **"Todo en MAYÚSCULAS"** (viene marcado). Se abre la pestaña **Títulos**:

**Paso 1 · Pásaselo a la IA**

1. Pulsa **"Copiar frase + títulos"** (copia la frase y, debajo, el array con los nombres actuales)
2. Pégalo en tu IA

La frase por defecto es:

> Corrige las frases en español de España y pon todas las letras en mayúsculas. Si te paso un array devuelve un array en una sola línea.

Puedes editarla. También puedes copiar solo la frase o solo los títulos.

**Paso 2 · Pega la respuesta**

1. Copia la respuesta de la IA
2. Pulsa **"Pegar del portapapeles"** (o pégala en el cuadro)

Vale un array JSON (también dentro de un bloque ```json) o un título por línea.

La app te dice si coincide el número de títulos:

- Etiqueta verde `✓ 37 de 37` → todo correcto
- Etiqueta roja `Faltan 3 (34/37)` → no coincide (`Falta 1`, `Faltan 2`, `Sobra 1`, `Sobran 2`)

Y justo debajo del cuadro aparece un recuadro rojo con el mensaje listo para pasárselo a la IA (y un botón **"Copiar"**):

```
Necesito exactamente 37 nombres.
Faltan 3 (34/37).
```

Con la concordancia correcta: `Falta 1`, `Faltan 2`, `Sobra 1`, `Sobran 2`. Cuando coincide, el recuadro desaparece.

**Editar títulos**

Cada título se puede editar o quitar de la lista. Los que pasan de **100 caracteres** salen en rojo con su contador (`87/100`) y el botón **"Solo largas"** muestra solo esos.

💡 Se quitan los caracteres que Windows no permite (`\ / : * ? " < > |`) y la extensión del archivo no se toca.

💡 Los títulos se aplican a los vídeos sin numerar (y a los de la carpeta extra). En el modo **Renumerar**, a todos.

---

### 8️⃣ Revisar la vista previa

En la pestaña **Vista previa** ves `original → nuevo` de cada archivo:

- El prefijo numérico sale resaltado
- Los de la carpeta extra llevan la etiqueta **extra**
- Desmarca los archivos que **no** quieras tocar (no se renombran ni gastan número)
- **"Marcar todos"** / **"Desmarcar todos"**

Si algo está mal, aparece un recuadro rojo con lo que hay que arreglar y el botón de aplicar queda desactivado.

---

### ✅ 9️⃣ Aplicar cambios

Pulsa:

👉 **"Aplicar cambios"** y confirma

Esto:

- Valida todo antes de tocar nada
- Renombra (y mueve, si usas la carpeta extra)
- Te avisa de cuántos salieron bien y de los que fallaron

⚠️ No hay botón de deshacer.

---

## 🛡️ Protecciones y casos especiales

- **Nombres repetidos**: si dos archivos acabarían con el mismo nombre (por ejemplo, dos títulos iguales sin numeración), no te deja aplicar. Con numeración no hay problema porque el prefijo es único.
- **El nombre ya existe**: si el destino ya existe en la carpeta, no se cambia nada y se te avisa. Nunca se pisa un archivo.
- **Solo cambia mayúsculas** (`a.mp4` → `A.MP4`): funciona.
- **Archivo bloqueado**: se reintenta 3 veces antes de dar error.
- **Fallos parciales**: si algún archivo falla, los demás siguen y se lista cada fallo con su motivo.
- **Carpeta en otro disco**: al mover desde la carpeta extra, copia y borra el original. Si no puede borrarlo, elimina la copia para no dejarte duplicados.
- **Carpeta extra igual a la principal**: no te deja aplicar.

---

## 🔔 Avisos

La app te avisa (arriba, en la ventana) cuando:

- Cargas una carpeta, y también si falla
- Copias o pegas títulos, y si el número no coincide
- Aplicas los cambios: mientras trabaja, al terminar y si algo sale mal

---

## 💾 Ajustes guardados

La app recuerda tus rutas, el modo, las horas, la hora inicial, el orden aleatorio, los interruptores de títulos y la frase de la IA.

Se guardan en la carpeta de datos de Windows de la aplicación:

```
%LOCALAPPDATA%\com.scr98.cambiar-nombres-videos-ui
```

No se guardan los títulos pegados ni los archivos desmarcados.

Pulsa **"Restablecer ajustes"** para borrarlos y volver a empezar.

---

## ⚙️ Parte técnica (para desarrolladores)

La app está hecha con:

- Next.js + shadcn/ui (frontend)
- Tauri (backend en Rust)

Reparto del trabajo:

- `src/lib/renombrador.ts` → toda la lógica de nombres, horas y títulos (sin acceso a disco)
- `src/lib/ajustes.ts` → ajustes recordados
- `src-tauri/src/archivos.rs` → listar carpetas y renombrar/mover en disco
- `src/components/renombrador/` → la interfaz

Plugins oficiales de Tauri que usa:

- `tauri-plugin-dialog` → el botón "Examinar…"
- `tauri-plugin-clipboard-manager` → copiar y pegar

Los componentes de `src/components/ui` son los oficiales de shadcn y no se modifican: los colores de la app están escritos en cada sitio donde se usan.

---

## 📦 Requisitos

Antes de empezar necesitas tener instalados:

- 🟢 Node.js → https://nodejs.org/es
- 🦀 Rust → https://rust-lang.org/es

---

## 📥 Instalar dependencias

```bash
npm install
```

---

## 🧪 Ejecutar en desarrollo

```bash
npm run tauri dev
```

---

## 🏗️ Build de producción

```bash
npm run tauri build
```

Para generar solo el `.exe` portable (sin instaladores):

```bash
npm run tauri build -- --no-bundle
```

Sale en `src-tauri/target/release/cambiar-nombres-videos-ui.exe`.
