// Ajustes guardados con localStorage. En Tauri/Windows viven en la carpeta de datos de
// WebView2 (%LOCALAPPDATA%\com.scr98.cambiar-nombres-videos-ui), no junto al .exe.
// Si se cambia el "identifier" de tauri.conf.json, se pierden (empiezan de cero).

import type { ModoNumeracion } from './renombrador'

/** Qué hacer con la carpeta extra: moverla a la principal o renombrar sus vídeos donde están. */
export type ModoExtra = 'mover' | 'en-sitio'

const CLAVE = 'renombrador:ajustes:v1'

export interface Ajustes {
  ruta: string
  rutaExtra: string
  usarExtra: boolean
  modoExtra: ModoExtra
  modo: ModoNumeracion
  horas: number[]
  horaInicio: number | 'auto'
  aleatorio: boolean
  cambiarTitulos: boolean
  mayusculas: boolean
  fraseIA: string
}

const MODOS: ModoNumeracion[] = ['anadir', 'quitar', 'renumerar', 'mantener']

/** Lee los ajustes guardados; cualquier campo ausente o raro se ignora. */
export function leerAjustes(): Partial<Ajustes> {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (!raw) return {}
    const o: Record<string, unknown> = JSON.parse(raw)
    const r: Partial<Ajustes> = {}
    if (typeof o.ruta === 'string') r.ruta = o.ruta
    if (typeof o.rutaExtra === 'string') r.rutaExtra = o.rutaExtra
    if (typeof o.usarExtra === 'boolean') r.usarExtra = o.usarExtra
    if (o.modoExtra === 'mover' || o.modoExtra === 'en-sitio') r.modoExtra = o.modoExtra
    if (MODOS.includes(o.modo as ModoNumeracion)) r.modo = o.modo as ModoNumeracion
    if (Array.isArray(o.horas) && o.horas.every((h) => Number.isInteger(h) && h >= 0 && h <= 23)) {
      r.horas = [...new Set(o.horas as number[])].sort((a, b) => a - b)
    }
    if (o.horaInicio === 'auto' || (Number.isInteger(o.horaInicio) && (o.horaInicio as number) >= 0 && (o.horaInicio as number) <= 23)) {
      r.horaInicio = o.horaInicio as number | 'auto'
    }
    if (typeof o.aleatorio === 'boolean') r.aleatorio = o.aleatorio
    if (typeof o.cambiarTitulos === 'boolean') r.cambiarTitulos = o.cambiarTitulos
    if (typeof o.mayusculas === 'boolean') r.mayusculas = o.mayusculas
    if (typeof o.fraseIA === 'string' && o.fraseIA.trim() !== '') r.fraseIA = o.fraseIA
    return r
  } catch {
    return {}
  }
}

export function guardarAjustes(a: Ajustes): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(a))
  } catch {
    // Sin almacenamiento disponible: la app sigue funcionando, solo que sin recordar.
  }
}

export function borrarAjustes(): void {
  try {
    localStorage.removeItem(CLAVE)
  } catch {
    // nada
  }
}
