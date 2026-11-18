'use client'

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { ResultadoRenombrado } from '@/lib/tauri'
import { cn } from '@/lib/utils'
import { ArrowRight, CircleCheck, FolderInput, TriangleAlert } from 'lucide-react'

export interface FilaPrevia {
  /** Clave única (el mismo nombre puede estar en la carpeta principal y en la extra). */
  key: string
  orig: string
  /** true = viene de la carpeta extra y se moverá a la principal. */
  extra: boolean
  /** Nombre nuevo con el que quedaría (null si está omitido). */
  nuevo: string | null
  duplicado: boolean
  incluido: boolean
}

interface Props {
  filas: FilaPrevia[]
  sinCambios: number
  problemas: string[]
  resultado: ResultadoRenombrado | null
  onAlternar: (key: string) => void
  onTodos: (incluir: boolean) => void
}

/** Resalta el prefijo «0000 00 » del nombre nuevo. */
function NombreNuevo({ nombre }: { nombre: string }) {
  const m = nombre.match(/^(\d{4} \d{2} )([\s\S]*)$/)
  if (!m) return <>{nombre}</>
  return (
    <>
      <span className="rounded bg-amber-100 px-0.5 font-semibold text-amber-800">{m[1]}</span>
      {m[2]}
    </>
  )
}

export function VistaPrevia({ filas, sinCambios, problemas, resultado, onAlternar, onTodos }: Props) {
  const incluidos = filas.filter((f) => f.incluido).length

  return (
    <>
      {resultado && (
        <Card size="sm" className={resultado.fallidos.length ? 'bg-red-50! ring-red-300!' : 'bg-emerald-50! ring-emerald-300!'}>
          <CardContent className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              {resultado.fallidos.length ? (
                <TriangleAlert className="size-4 shrink-0 text-red-600" />
              ) : (
                <CircleCheck className="size-4 shrink-0 text-emerald-600" />
              )}
              {resultado.correctos} archivo(s) procesados correctamente
              {resultado.fallidos.length > 0 && ` · ${resultado.fallidos.length} fallaron`}
            </p>
            {resultado.fallidos.length > 0 && (
              <ul className="space-y-0.5 text-xs text-red-700">
                {resultado.fallidos.map((f) => (
                  <li key={f.archivo} className="break-all">
                    <b>{f.archivo}</b> — {f.error}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {problemas.length > 0 && (
        <Card size="sm" className="bg-red-50! ring-red-300!">
          <CardContent className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
              <TriangleAlert className="size-4 shrink-0" /> Antes de aplicar hay que arreglar:
            </p>
            <ul className="list-disc space-y-0.5 pl-6 text-sm text-red-700">
              {problemas.map((p) => (
                <li key={p} className="whitespace-pre-line">{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">Vista previa de cambios</CardTitle>
          <CardDescription className="text-xs">
            Desmarca los archivos que NO quieras tocar (equivale a la «selección individual»).
          </CardDescription>
          <CardAction><div className="flex shrink-0 items-center gap-2">
              <Badge variant="secondary" className="bg-amber-100! text-amber-800!">{incluidos} a renombrar</Badge>
              {sinCambios > 0 && <Badge variant="outline">{sinCambios} sin cambios</Badge>}
            </div></CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">

          {filas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">✅ No hay cambios pendientes con esta configuración.</p>
          ) : (
            <>
              <div className="flex gap-2">
                <Button size="xs" variant="outline" onClick={() => onTodos(true)}>
                  Marcar todos
                </Button>
                <Button size="xs" variant="outline" onClick={() => onTodos(false)}>
                  Desmarcar todos
                </Button>
              </div>

              <div className="flex max-h-[30rem] flex-col overflow-y-auto rounded-xl border">
                {filas.map((f) => (
                  <label
                    key={f.key}
                    className={cn(
                      'grid cursor-pointer grid-cols-[auto_1fr_auto_1fr] items-start gap-2 border-b px-3 py-2 text-xs last:border-b-0 hover:bg-muted/50',
                      !f.incluido && 'opacity-45',
                      f.incluido && f.duplicado && 'bg-red-50'
                    )}
                  >
                    <Checkbox checked={f.incluido} onCheckedChange={() => onAlternar(f.key)}
                      className="mt-0.5 data-[state=checked]:border-amber-500! data-[state=checked]:bg-amber-500! data-[state=checked]:text-white!"
                    />
                    <span className="font-mono break-all text-muted-foreground">
                      {f.extra && (
                        <Badge variant="secondary" className="bg-amber-100! text-amber-800! mr-1.5 px-1.5 py-0 align-middle text-[10px]">
                          <FolderInput /> extra
                        </Badge>
                      )}
                      {f.orig}
                    </span>
                    <ArrowRight className="mt-0.5 size-3.5 text-amber-500" />
                    <span className={cn('font-mono break-all', f.duplicado && f.incluido && 'text-red-700')}>
                      {f.incluido && f.nuevo !== null ? (
                        <NombreNuevo nombre={f.nuevo} />
                      ) : (
                        <i className="text-muted-foreground">omitido</i>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}
