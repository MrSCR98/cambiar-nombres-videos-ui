'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  LIMITE_CARACTERES,
  longitud,
  mensajeConteo,
  parsearTitulos,
  tituloFinal,
  type TitulosParseados,
} from '@/lib/renombrador'
import { copiarTexto, leerPortapapeles } from '@/lib/tauri'
import { cn } from '@/lib/utils'
import {
  CircleAlert,
  ClipboardPaste,
  Copy,
  Eraser,
  Funnel,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  /** Nombres actuales (sin numeración ni extensión) de los archivos a titular. */
  base: string[]
  fraseIA: string
  onFraseIA: (v: string) => void
  texto: string
  onTexto: (v: string) => void
  parseo: TitulosParseados
  mayusculas: boolean
  onEditar: (indice: number, valor: string) => void
  onEliminar: (indice: number) => void
}

export function TitulosPanel({
  base,
  fraseIA,
  onFraseIA,
  texto,
  onTexto,
  parseo,
  mayusculas,
  onEditar,
  onEliminar,
}: Props) {
  const [soloLargas, setSoloLargas] = useState(false)

  const json = JSON.stringify(base)
  const total = base.length
  const n = parseo.titulos.length
  const dif = n - total

  const copiar = async (contenido: string, mensaje: string) => {
    try {
      await copiarTexto(contenido)
      toast.success(mensaje)
    } catch (e) {
      toast.error(`No se pudo copiar: ${e}`)
    }
  }

  const pegar = async () => {
    try {
      const t = await leerPortapapeles()
      if (t.trim() === '') {
        toast.warning('El portapapeles está vacío.')
        return
      }
      onTexto(t)
      const r = parsearTitulos(t)
      const m = mensajeConteo(r.titulos.length, total)
      if (r.error) toast.error(r.error)
      else if (!m)
        toast.success(
          `${r.titulos.length} títulos pegados: coinciden con los ${total} vídeos`
        )
      else {
        toast.warning(
          `Pegados ${r.titulos.length} títulos pero hay ${total} vídeos: ${m.verbo.toLowerCase()} ${m.diferencia}`
        )
      }
    } catch (e) {
      toast.error(`No se pudo leer el portapapeles: ${e}`)
    }
  }

  const filas = parseo.titulos
    .map((t, i) => {
      const final = tituloFinal(t, mayusculas)
      return { t, i, len: longitud(final), vacio: final === '' }
    })
    .filter((f) => !soloLargas || f.len > LIMITE_CARACTERES)
  const largas = parseo.titulos.filter(
    (t) => longitud(tituloFinal(t, mayusculas)) > LIMITE_CARACTERES
  ).length

  const conteo = mensajeConteo(n, total)

  let estado: React.ReactNode
  if (parseo.error) estado = <Badge variant="destructive">JSON no válido</Badge>
  else if (parseo.formato === 'vacio')
    estado = <Badge variant="outline">Sin pegar · 0/{total}</Badge>
  else if (dif === 0)
    estado = (
      <Badge variant="secondary" className="bg-emerald-100! text-emerald-800!">
        ✓ {n} de {total}
      </Badge>
    )
  else estado = <Badge variant="destructive">{conteo!.corto}</Badge>

  if (total === 0) {
    return (
      <Card size="sm">
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Con este modo no hay archivos a los que cambiar el título (todos ya
            están numerados). Elige «Renumerar» para titular todos, o «Quitar»
            si solo querías quitar la numeración.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* ── Paso 1: lo que se le pasa a la IA ───────────────────────────── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="size-4 text-amber-500" /> 1 · Pásaselo a la IA
          </CardTitle>
          <CardDescription className="text-xs">
            Copia la frase y los títulos actuales, pégalos en tu IA y trae la
            respuesta abajo.
          </CardDescription>
          <CardAction>
            <Badge
              variant="secondary"
              className="bg-amber-100! text-amber-800!"
            >
              {total} título(s)
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs tracking-wide text-muted-foreground uppercase">
              Frase para la IA
            </span>
            <Textarea
              value={fraseIA}
              onChange={(e) => onFraseIA(e.target.value)}
              rows={2}
              className="min-h-0 resize-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs tracking-wide text-muted-foreground uppercase">
              Títulos actuales (array en una línea)
            </span>
            <Textarea
              value={json}
              readOnly
              rows={3}
              onFocus={(e) => e.currentTarget.select()}
              className="max-h-32 resize-none bg-muted/50 font-mono text-xs"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() =>
                copiar(`${fraseIA}\n\n${json}`, 'Frase + títulos copiados')
              }
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              <Copy /> Copiar frase + títulos
            </Button>
            <Button
              variant="outline"
              onClick={() => copiar(fraseIA, 'Frase copiada')}
            >
              <Copy /> Solo la frase
            </Button>
            <Button
              variant="outline"
              onClick={() => copiar(json, 'Títulos copiados')}
            >
              <Copy /> Solo los títulos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Paso 2: la respuesta ────────────────────────────────────────── */}
      <Card size="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardPaste className="size-4 text-amber-500" /> 2 · Pega la
            respuesta
          </CardTitle>
          <CardDescription className="text-xs">
            Vale un array JSON (también dentro de ```json) o un título por
            línea.
          </CardDescription>
          <CardAction>{estado}</CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Textarea
            value={texto}
            onChange={(e) => onTexto(e.target.value)}
            rows={4}
            spellCheck={false}
            placeholder='["TÍTULO 1", "TÍTULO 2", …]'
            className="max-h-40 resize-none font-mono text-xs"
            aria-invalid={
              parseo.formato !== 'vacio' && (!!parseo.error || dif !== 0)
                ? true
                : undefined
            }
          />
          {parseo.error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
            >
              <CircleAlert className="size-4 shrink-0" />
              <p className="text-sm whitespace-pre-line">{parseo.error}</p>
            </div>
          )}

          {!parseo.error && parseo.formato !== 'vacio' && conteo && (
            <div
              role="alert"
              className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-700"
            >
              <div className="text-sm">
                <p className="font-semibold">{conteo.titulo}</p>
                <p>{conteo.detalle}</p>
              </div>
              <Button
                size="xs"
                variant="outline"
                onClick={() =>
                  copiar(conteo.texto, 'Mensaje copiado: pégaselo a la IA')
                }
                className="border-red-300 bg-white text-red-700 hover:bg-red-100"
                title="Copia este mensaje para pasárselo a la IA"
              >
                <Copy /> Copiar
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={pegar}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              <ClipboardPaste /> Pegar del portapapeles
            </Button>
            <Button
              variant="outline"
              onClick={() => onTexto('')}
              disabled={texto === ''}
            >
              <Eraser /> Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Edición título a título ─────────────────────────────────────── */}
      {parseo.titulos.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              Editar títulos
            </CardTitle>
            <CardDescription className="text-xs">
              En rojo, los que pasan de {LIMITE_CARACTERES} caracteres. Cuentan
              tal y como quedarán el archivo.
            </CardDescription>
            <CardAction>
              <Button
                size="sm"
                variant={soloLargas ? 'default' : 'outline'}
                onClick={() => setSoloLargas((v) => !v)}
                className={
                  soloLargas ? 'bg-red-500 text-white hover:bg-red-600' : ''
                }
              >
                <Funnel /> Solo largas
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs tabular-nums',
                    largas > 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {largas}
                </span>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto pr-1">
              {filas.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  🎉 Ningún título pasa de {LIMITE_CARACTERES} caracteres.
                </p>
              )}
              {filas.map(({ t, i, len, vacio }) => {
                const larga = len > LIMITE_CARACTERES
                const sobra = i >= total
                return (
                  <div key={i} className="flex items-end gap-2">
                    <span className="w-8 pb-2 text-right font-mono text-xs text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          'truncate text-[11px] leading-tight',
                          sobra
                            ? 'font-medium text-red-600'
                            : 'text-muted-foreground'
                        )}
                        title={base[i]}
                      >
                        {sobra
                          ? '— sobra: no hay archivo para este título —'
                          : base[i]}
                      </div>
                      <Input
                        value={t}
                        onChange={(e) => onEditar(i, e.target.value)}
                        aria-invalid={
                          larga || vacio || sobra ? true : undefined
                        }
                        className={cn(
                          'mt-0.5',
                          (larga || vacio) &&
                            'border-red-400! bg-red-50! text-red-700!'
                        )}
                      />
                    </div>
                    <span
                      className={cn(
                        'w-14 pb-2 text-right text-xs tabular-nums',
                        larga
                          ? 'font-bold text-red-600'
                          : 'text-muted-foreground'
                      )}
                    >
                      {len}/{LIMITE_CARACTERES}
                    </span>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => onEliminar(i)}
                      title="Quitar este título de la lista"
                      className="mb-0.5 text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
