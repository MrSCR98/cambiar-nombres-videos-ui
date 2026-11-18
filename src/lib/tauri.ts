import { invoke } from '@tauri-apps/api/core'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'
import { open } from '@tauri-apps/plugin-dialog'

export interface Fallo {
  archivo: string
  error: string
}

export interface ResultadoRenombrado {
  correctos: number
  fallidos: Fallo[]
}

/** Nombres de los archivos (no carpetas) de la ruta, ordenados. */
export const listarArchivos = (ruta: string) =>
  invoke<string[]>('listar_archivos', { ruta })

/** Aplica los renombrados (y los movimientos desde la carpeta extra). Valida todo antes de tocar nada. */
export const renombrarLote = (
  ruta: string,
  rutaExtra: string | null,
  cambios: { original: string; nuevo: string; desde_extra: boolean }[]
) => invoke<ResultadoRenombrado>('renombrar_lote', { ruta, rutaExtra, cambios })

/** Abre el selector de carpetas de Windows. Devuelve null si se cancela. */
export async function elegirCarpeta(inicial?: string, titulo?: string): Promise<string | null> {
  const r = await open({
    directory: true,
    multiple: false,
    defaultPath: inicial || undefined,
    title: titulo ?? 'Elige la carpeta con los vídeos',
  })
  return typeof r === 'string' ? r : null
}

export async function copiarTexto(texto: string): Promise<void> {
  try {
    await writeText(texto)
  } catch {
    await navigator.clipboard.writeText(texto)
  }
}

export async function leerPortapapeles(): Promise<string> {
  try {
    return await readText()
  } catch {
    return await navigator.clipboard.readText()
  }
}
