'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  mismasHoras,
  modoDisponible,
  pad2,
  pad4,
  PRESETS_HORAS,
  TODAS_LAS_HORAS,
  type EstadoCarpeta,
  type ModoNumeracion,
} from '@/lib/renombrador'
import { cn } from '@/lib/utils'
import { Equal, Eraser, Hash, ListOrdered, Shuffle } from 'lucide-react'

const MODOS: {
  id: ModoNumeracion
  titulo: string
  desc: string
  icono: typeof Hash
}[] = [
  { id: 'anadir', titulo: 'Añadir', desc: 'A los que no tienen', icono: Hash },
  {
    id: 'quitar',
    titulo: 'Quitar',
    desc: 'A los que la tienen',
    icono: Eraser,
  },
  {
    id: 'renumerar',
    titulo: 'Renumerar',
    desc: 'Quitar y numerar todo',
    icono: ListOrdered,
  },
  {
    id: 'mantener',
    titulo: 'No tocar',
    desc: 'Solo cambiar títulos',
    icono: Equal,
  },
]

interface Props {
  modo: ModoNumeracion
  onModo: (m: ModoNumeracion) => void
  estado: EstadoCarpeta
  horas: number[]
  onHoras: (h: number[]) => void
  horaInicio: number | 'auto'
  onHoraInicio: (h: number | 'auto') => void
  aleatorio: boolean
  onAleatorio: (v: boolean) => void
  onMezclar: () => void
  deshabilitado: boolean
}

export function NumeracionCard({
  modo,
  onModo,
  estado,
  horas,
  onHoras,
  horaInicio,
  onHoraInicio,
  aleatorio,
  onAleatorio,
  onMezclar,
  deshabilitado,
}: Props) {
  const numera = modo === 'anadir' || modo === 'renumerar'

  const alternar = (h: number) =>
    onHoras(
      horas.includes(h)
        ? horas.filter((x) => x !== h)
        : [...horas, h].sort((a, b) => a - b)
    )

  let pista = ''
  if (modo === 'anadir') {
    pista =
      estado.numerados > 0
        ? `Ya hay ${estado.numerados} con numeración: se continúa desde ${pad4(estado.ultimoContador + 1)}, en la hora siguiente a la ${pad2(estado.ultimaHora)}.`
        : 'No hay numeración previa: empieza en 0000 y tú eliges la hora inicial.'
  } else if (modo === 'renumerar') {
    pista =
      'Se quita la numeración actual y se vuelve a numerar todo desde 0000.'
  } else if (modo === 'quitar') {
    pista = 'Solo se quita el prefijo «0000 00 » de los archivos que lo tengan.'
  } else {
    pista = 'No se añade ni se quita numeración. Solo se cambian los títulos.'
  }

  if (estado.extras > 0) {
    pista += ` Se incluyen ${estado.extras} de la carpeta extra y se moverán a la principal.`
  }

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Hash className="size-4 text-amber-500" /> Numeración
        </CardTitle>
        <CardDescription className="text-xs">
          Prefijo «0000 00 » = contador + hora.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          {MODOS.map((m) => {
            const activo = modo === m.id
            const libre = modoDisponible(m.id, estado) && !deshabilitado
            const Icono = m.icono
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={activo}
                disabled={!libre}
                onClick={() => onModo(m.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40',
                  activo
                    ? 'border-amber-400 bg-amber-50 text-amber-900'
                    : 'hover:bg-muted'
                )}
              >
                <Icono
                  className={cn(
                    'size-4 shrink-0',
                    activo ? 'text-amber-600' : 'text-muted-foreground'
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-sm leading-tight font-semibold">
                    {m.titulo}
                  </span>
                  <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                    {m.desc}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground">{pista}</p>

        <fieldset
          disabled={!numera || deshabilitado}
          className="flex flex-col gap-3 transition-opacity disabled:opacity-45"
        >
          <div className="flex items-center justify-between">
            <Label className="text-xs tracking-wide text-muted-foreground uppercase">
              Horas a usar ({horas.length}/24)
            </Label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS_HORAS.map((p) => {
              const activo = mismasHoras(horas, p.horas)
              return (
                <Button
                  key={p.id}
                  type="button"
                  size="xs"
                  variant={activo ? 'default' : 'outline'}
                  onClick={() => onHoras(p.horas)}
                  className={
                    activo ? 'bg-amber-500 text-white hover:bg-amber-500' : ''
                  }
                >
                  {p.etiqueta}
                </Button>
              )
            })}
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {TODAS_LAS_HORAS.map((h) => {
              const activa = horas.includes(h)
              return (
                <label
                  key={h}
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1.5 font-mono text-sm tabular-nums transition-colors select-none',
                    activa
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : 'hover:bg-muted'
                  )}
                >
                  <Checkbox
                    checked={activa}
                    onCheckedChange={() => alternar(h)}
                    className="data-[state=checked]:border-amber-500! data-[state=checked]:bg-amber-500! data-[state=checked]:text-white!"
                  />
                  {pad2(h)}
                </label>
              )
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="hora-inicial"
              className="text-xs tracking-wide text-muted-foreground uppercase"
            >
              Hora inicial
            </Label>

            <Select
              value={String(horaInicio)}
              onValueChange={(value) =>
                onHoraInicio(value === 'auto' ? 'auto' : Number(value))
              }
            >
              <SelectTrigger
                id="hora-inicial"
                className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
              >
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    value="auto"
                    className="data-highlighted:bg-amber-500"
                  >
                    {modo === 'anadir' && estado.ultimaHora >= 0
                      ? `Automática (continúa tras la ${pad2(estado.ultimaHora)})`
                      : 'Automática (la primera hora marcada)'}
                  </SelectItem>

                  {horas.map((h) => (
                    <SelectItem
                      key={h}
                      value={String(h)}
                      className="data-highlighted:bg-amber-500"
                    >
                      Empezar en la {pad2(h)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="aleatorio" className="cursor-pointer">
              Orden aleatorio
            </Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={onMezclar}
                disabled={!aleatorio}
                title="Volver a mezclar el orden"
              >
                <Shuffle /> Mezclar
              </Button>
              <Switch
                id="aleatorio"
                checked={aleatorio}
                onCheckedChange={onAleatorio}
                className="data-[state=checked]:border-amber-500! data-[state=checked]:bg-amber-500!"
              />
            </div>
          </div>
        </fieldset>
      </CardContent>
    </Card>
  )
}
