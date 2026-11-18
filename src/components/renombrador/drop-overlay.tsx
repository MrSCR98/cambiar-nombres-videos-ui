'use client'

import { cn } from '@/lib/utils'
import { FolderDown } from 'lucide-react'

export type ZonaDrop = 'principal' | 'extra'

/** Capa que aparece al arrastrar una carpeta desde Windows: izquierda = principal, derecha = extra. */
export function DropOverlay({ zona }: { zona: ZonaDrop | null }) {
  if (zona === null) return null

  const caja = (id: ZonaDrop, titulo: string, texto: string) => (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-3xl border-4 border-dashed p-6 text-center transition-all',
        zona === id
          ? 'scale-[1.02] border-amber-500 bg-amber-50 text-amber-900 shadow-2xl'
          : 'border-white/70 bg-white/30 text-white'
      )}
    >
      <FolderDown className="size-12" />
      <p className="text-xl font-bold">{titulo}</p>
      <p className="text-sm opacity-80">{texto}</p>
    </div>
  )

  return (
    <div className="pointer-events-none fixed inset-0 z-50 grid grid-cols-2 gap-4 bg-black/55 p-6 pt-16 pb-16">
      {caja('principal', 'Carpeta principal', 'Donde se guardan los vídeos')}
      {caja('extra', 'Carpeta extra', 'Vídeos nuevos que se moverán a la principal')}
    </div>
  )
}
