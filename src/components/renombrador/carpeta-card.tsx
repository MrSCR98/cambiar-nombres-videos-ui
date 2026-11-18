'use client'

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { FolderOpen, Loader2, RefreshCw, TriangleAlert, X } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  titulo: string
  descripcion: string
  icono: ReactNode
  placeholder: string
  ruta: string
  onRuta: (v: string) => void
  /** Ruta que está realmente cargada (null si no hay ninguna). */
  rutaCargada: string | null
  onCargar: () => void
  onExaminar: () => void
  /** Si se pasa, aparece el botón de quitar la carpeta (carpeta opcional). */
  onQuitar?: () => void
  cargando: boolean
  error: string | null
  deshabilitado: boolean
  /** Resalta la tarjeta mientras se arrastra una carpeta encima. */
  resaltada?: boolean
  /** Aviso en ámbar bajo la ruta (p. ej. «esta carpeta no se usa ahora»). */
  nota?: string
  /** Insignias con el resumen (nº de archivos, etc.). */
  children?: ReactNode
}

/** Un selector de carpeta: texto editable + examinar + cargar. Se usa para la principal y la extra. */
export function SelectorCarpeta({
  titulo,
  descripcion,
  icono,
  placeholder,
  ruta,
  onRuta,
  rutaCargada,
  onCargar,
  onExaminar,
  onQuitar,
  cargando,
  error,
  deshabilitado,
  resaltada,
  nota,
  children,
}: Props) {
  const pendiente = ruta.trim() !== '' && ruta.trim() !== rutaCargada

  return (
    <Card size="sm" className={cn('transition-shadow', resaltada && 'ring-2! ring-amber-400!')}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {icono} {titulo}
        </CardTitle>
        <CardDescription className="text-xs">{descripcion}</CardDescription>
        <CardAction>{onQuitar && (ruta !== '' || rutaCargada) && (
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={onQuitar}
              disabled={deshabilitado}
              title="Quitar esta carpeta"
              className="text-muted-foreground hover:text-red-600"
            >
              <X />
            </Button>
          )}</CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">

        <Input
          value={ruta}
          onChange={(e) => onRuta(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCargar()
          }}
          spellCheck={false}
          placeholder={placeholder}
          className="font-mono text-[13px]"
          aria-invalid={error ? true : undefined}
          disabled={deshabilitado}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onExaminar} disabled={deshabilitado}>
            <FolderOpen /> Examinar…
          </Button>
          <Button
            size="sm"
            onClick={onCargar}
            disabled={deshabilitado || cargando || ruta.trim() === ''}
            className={
              pendiente
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }
          >
            {cargando ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            {pendiente ? 'Cargar' : 'Recargar'}
          </Button>
          {pendiente && <span className="text-xs text-amber-700">Pulsa «Cargar» (o Enter) para leerla.</span>}
        </div>

        {nota && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{nota}</p>}

        {error && (
          <p className="flex items-center gap-2 text-sm text-red-600">
            <TriangleAlert className="size-4 shrink-0" />
            {error}
          </p>
        )}
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </CardContent>
    </Card>
  )
}
