'use client'

import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { borrarAjustes, guardarAjustes, leerAjustes, type ModoExtra } from '@/lib/ajustes'
import {
  analizarCarpeta,
  basesTitulos,
  calcularPlan,
  FRASE_IA,
  parsearTitulos,
  PRESETS_HORAS,
  resolverModo,
  type ModoNumeracion,
} from '@/lib/renombrador'
import {
  elegirCarpeta,
  listarArchivos,
  renombrarLote,
  type ResultadoRenombrado,
} from '@/lib/tauri'
import { getCurrentWebview } from '@tauri-apps/api/webview'
import {
  Check,
  FolderInput,
  FolderOpen,
  Loader2,
  Pencil,
  RotateCcw,
  TriangleAlert,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SelectorCarpeta } from './carpeta-card'
import { DropOverlay, type ZonaDrop } from './drop-overlay'
import { NumeracionCard } from './numeracion-card'
import { TitulosOpciones } from './titulos-opciones'
import { TitulosPanel } from './titulos-panel'
import { VistaPrevia, type FilaPrevia } from './vista-previa'

/** Quita espacios y las comillas que añade Windows con «Copiar como ruta de acceso». */
const limpiarRuta = (r: string) => r.trim().replace(/^"(.*)"$/, '$1')

/** Para comparar dos rutas de Windows: sin mayúsculas, sin barra final, con la misma barra. */
const normalizarRuta = (r: string) =>
  limpiarRuta(r).replace(/\//g, '\\').replace(/\\+$/, '').toLowerCase()

export default function Renombrador() {
  // ── Carpetas ───────────────────────────────────────────────────────────────
  const [ruta, setRuta] = useState('')
  const [rutaCargada, setRutaCargada] = useState<string | null>(null)
  const [archivos, setArchivos] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)
  const [errorCarpeta, setErrorCarpeta] = useState<string | null>(null)

  const [rutaExtra, setRutaExtra] = useState('')
  const [rutaExtraCargada, setRutaExtraCargada] = useState<string | null>(null)
  const [extras, setExtras] = useState<string[]>([])
  const [cargandoExtra, setCargandoExtra] = useState(false)
  const [usarExtra, setUsarExtra] = useState(true)
  const [modoExtra, setModoExtra] = useState<ModoExtra>('mover')
  const [errorExtra, setErrorExtra] = useState<string | null>(null)

  // ── Numeración ─────────────────────────────────────────────────────────────
  const [modoPedido, setModoPedido] = useState<ModoNumeracion>('anadir')
  const [horas, setHoras] = useState<number[]>(PRESETS_HORAS[0]!.horas)
  const [horaInicio, setHoraInicio] = useState<number | 'auto'>('auto')
  const [aleatorio, setAleatorio] = useState(true)
  const [semilla, setSemilla] = useState(1)

  // ── Títulos ────────────────────────────────────────────────────────────────
  const [cambiarTitulos, setCambiarTitulos] = useState(true)
  const [mayusculas, setMayusculas] = useState(true)
  const [fraseIA, setFraseIA] = useState(FRASE_IA)
  const [textoNuevos, setTextoNuevos] = useState('')

  // ── Vista previa / aplicar ─────────────────────────────────────────────────
  const [excluidos, setExcluidos] = useState<Set<string>>(new Set())
  const [tab, setTab] = useState('titulos')
  const [aplicando, setAplicando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoRenombrado | null>(null)

  // ── Ajustes guardados / arrastrar y soltar ────────────────────────────────
  const [ajustesListos, setAjustesListos] = useState(false)
  const [zonaDrag, setZonaDrag] = useState<ZonaDrop | null>(null)

  // ── Carga de carpetas ──────────────────────────────────────────────────────
  function cargarPrincipal(r: string, avisar = true) {
    const destino = limpiarRuta(r)
    setRuta(destino)
    setCargando(true)
    return listarArchivos(destino)
      .then((lista) => {
        setArchivos(lista)
        setRutaCargada(destino)
        setErrorCarpeta(null)
        setExcluidos(new Set())
        setSemilla(Math.floor(Math.random() * 2 ** 31))
        if (avisar) toast.success(`Carpeta principal cargada: ${lista.length} archivo(s)`)
      })
      .catch((e) => {
        setArchivos([])
        setRutaCargada(null)
        setErrorCarpeta(String(e))
        toast.error(`Carpeta principal: ${e}`)
      })
      .finally(() => setCargando(false))
  }

  function cargarExtra(r: string, avisar = true) {
    const destino = limpiarRuta(r)
    setRutaExtra(destino)
    if (destino === '') {
      setExtras([])
      setRutaExtraCargada(null)
      setErrorExtra(null)
      return Promise.resolve()
    }
    setCargandoExtra(true)
    return listarArchivos(destino)
      .then((lista) => {
        setExtras(lista)
        setRutaExtraCargada(destino)
        setErrorExtra(null)
        setExcluidos(new Set())
        setSemilla(Math.floor(Math.random() * 2 ** 31))
        if (avisar) toast.success(`Carpeta extra cargada: ${lista.length} vídeo(s)`)
      })
      .catch((e) => {
        setExtras([])
        setRutaExtraCargada(null)
        setErrorExtra(String(e))
        toast.error(`Carpeta extra: ${e}`)
      })
      .finally(() => setCargandoExtra(false))
  }

  function quitarExtra() {
    setResultado(null)
    setExcluidos(new Set())
    void cargarExtra('', false)
    toast.info('Carpeta extra quitada: ahora solo se usa la carpeta principal')
  }

  function alternarUsarExtra(v: boolean) {
    setUsarExtra(v)
    setExcluidos(new Set())
    toast.info(v ? 'Carpeta extra activada' : 'Carpeta extra desactivada: se usa solo la principal')
  }

  // Al abrir: recupera los ajustes guardados y lee las carpetas.
  useEffect(() => {
    void Promise.resolve().then(async () => {
      const a = leerAjustes()
      if (a.modo) setModoPedido(a.modo)
      if (a.horas) setHoras(a.horas)
      if (a.horaInicio !== undefined) setHoraInicio(a.horaInicio)
      if (a.aleatorio !== undefined) setAleatorio(a.aleatorio)
      if (a.cambiarTitulos !== undefined) {
        setCambiarTitulos(a.cambiarTitulos)
        if (!a.cambiarTitulos) setTab('previa')
      }
      if (a.mayusculas !== undefined) setMayusculas(a.mayusculas)
      if (a.usarExtra !== undefined) setUsarExtra(a.usarExtra)
      if (a.modoExtra) setModoExtra(a.modoExtra)
      if (a.fraseIA) setFraseIA(a.fraseIA)
      setAjustesListos(true)
      await Promise.all([
        a.ruta ? cargarPrincipal(a.ruta, false) : Promise.resolve(),
        a.rutaExtra ? cargarExtra(a.rutaExtra, false) : Promise.resolve(),
      ])
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Guarda los ajustes cada vez que cambian (solo después de haber leído los anteriores).
  useEffect(() => {
    if (!ajustesListos) return
    guardarAjustes({
      ruta: rutaCargada ?? ruta,
      rutaExtra: rutaExtraCargada ?? rutaExtra,
      usarExtra,
      modoExtra,
      modo: modoPedido,
      horas,
      horaInicio,
      aleatorio,
      cambiarTitulos,
      mayusculas,
      fraseIA,
    })
  }, [
    ajustesListos,
    ruta,
    rutaCargada,
    rutaExtra,
    rutaExtraCargada,
    usarExtra,
    modoExtra,
    modoPedido,
    horas,
    horaInicio,
    aleatorio,
    cambiarTitulos,
    mayusculas,
    fraseIA,
  ])

  // Arrastrar una carpeta desde el Explorador de Windows: mitad izquierda = principal, derecha = extra.
  useEffect(() => {
    let cancelado = false
    let quitar: (() => void) | undefined

    const zonaDe = (x: number) => (x / window.devicePixelRatio < window.innerWidth / 2 ? 'principal' : 'extra')

    void Promise.resolve()
      .then(() =>
        getCurrentWebview().onDragDropEvent((ev) => {
          const p = ev.payload
          if (p.type === 'leave') {
            setZonaDrag(null)
          } else if (p.type === 'drop') {
            setZonaDrag(null)
            const soltada = p.paths[0]
            if (!soltada) return
            setResultado(null)
            if (zonaDe(p.position.x) === 'principal') void cargarPrincipal(soltada)
            else void cargarExtra(soltada)
          } else {
            setZonaDrag(zonaDe(p.position.x))
          }
        })
      )
      .then((u) => {
        if (cancelado) u()
        else quitar = u
      })
      .catch(() => {
        // Fuera de Tauri (navegador) no hay arrastrar y soltar nativo.
      })

    return () => {
      cancelado = true
      quitar?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const examinar = async (extra: boolean) => {
    try {
      const inicial = extra ? (rutaExtraCargada ?? limpiarRuta(rutaExtra)) : (rutaCargada ?? limpiarRuta(ruta))
      const elegida = await elegirCarpeta(
        inicial,
        extra ? 'Elige la carpeta extra (vídeos nuevos)' : 'Elige la carpeta principal'
      )
      if (!elegida) return
      setResultado(null)
      await (extra ? cargarExtra(elegida) : cargarPrincipal(elegida))
    } catch (e) {
      toast.error(`No se pudo abrir el selector: ${e}`)
    }
  }

  const restablecer = () => {
    borrarAjustes()
    setModoPedido('anadir')
    setHoras(PRESETS_HORAS[0]!.horas)
    setHoraInicio('auto')
    setAleatorio(true)
    setCambiarTitulos(true)
    setMayusculas(true)
    setFraseIA(FRASE_IA)
    setTextoNuevos('')
    setTab('titulos')
    setResultado(null)
    setUsarExtra(true)
    setModoExtra('mover')
    void cargarExtra('', false)
    setRuta('')
    setRutaCargada(null)
    setArchivos([])
    setErrorCarpeta(null)
    toast.success('Ajustes restablecidos')
  }

  // ── Datos derivados ────────────────────────────────────────────────────────
  const mismaCarpeta =
    rutaCargada !== null && rutaExtraCargada !== null && normalizarRuta(rutaCargada) === normalizarRuta(rutaExtraCargada)
  const extraEnUso = usarExtra && rutaExtraCargada !== null
  // «En sitio»: la carpeta extra pasa a ser la carpeta de trabajo (se renombra donde está, sin mover).
  const enSitio = extraEnUso && modoExtra === 'en-sitio'
  const carpetaTrabajo = enSitio ? rutaExtraCargada : rutaCargada
  const archivosTrabajo = enSitio ? extras : archivos
  const extrasActivos = extraEnUso && !enSitio && !mismaCarpeta ? extras : []

  const estado = analizarCarpeta(archivosTrabajo, extrasActivos.length)
  const modo = resolverModo(modoPedido, estado)
  const numera = modo === 'anadir' || modo === 'renumerar'
  const horaInicioEf: number | 'auto' = typeof horaInicio === 'number' && horas.includes(horaInicio) ? horaInicio : 'auto'

  const base = basesTitulos(archivosTrabajo, extrasActivos, modo)
  const parseo = parsearTitulos(textoNuevos)
  const hayTitulos = cambiarTitulos && base.length > 0
  const titulos = hayTitulos && !parseo.error && parseo.formato !== 'vacio' ? parseo.titulos : null

  const entrada = {
    archivos: archivosTrabajo,
    extras: extrasActivos,
    modo,
    horas,
    horaInicio: horaInicioEf,
    aleatorio,
    semilla,
    titulos,
    mayusculas,
  }
  const plan = calcularPlan({ ...entrada, excluidos })
  const planCompleto = calcularPlan({ ...entrada, excluidos: new Set() })

  const problemas: string[] = []
  if (extraEnUso && !enSitio) {
    if (mismaCarpeta) problemas.push('La carpeta extra no puede ser la misma que la principal.')
    else if (rutaCargada === null) problemas.push('Carga la carpeta principal: es donde se moverán los vídeos de la extra.')
  }
  if (hayTitulos) {
    if (parseo.error) problemas.push(parseo.error)
    else if (parseo.formato === 'vacio') {
      problemas.push(`Pega los ${base.length} títulos nuevos (pestaña «Títulos») o desactiva «Cambiar los títulos».`)
    }
  }
  problemas.push(...plan.errores)

  const porClave = new Map(plan.cambios.map((c) => [c.key, c]))
  const filas: FilaPrevia[] = planCompleto.cambios.map((c) => {
    const incluido = !excluidos.has(c.key)
    const final = porClave.get(c.key)
    return {
      key: c.key,
      orig: c.orig,
      extra: c.extra,
      nuevo: incluido ? (final?.nuevo ?? c.nuevo) : null,
      duplicado: final?.duplicado ?? false,
      incluido,
    }
  })
  const sinCambios = archivosTrabajo.length - planCompleto.cambios.filter((c) => !c.extra).length
  const aMover = plan.cambios.filter((c) => c.extra).length

  const puedeAplicar = !aplicando && carpetaTrabajo !== null && plan.cambios.length > 0 && problemas.length === 0
  const tabActiva = !cambiarTitulos && tab === 'titulos' ? 'previa' : tab

  // ── Acciones ───────────────────────────────────────────────────────────────
  const editarTitulo = (i: number, valor: string) => {
    const arr = [...parseo.titulos]
    arr[i] = valor
    setTextoNuevos(JSON.stringify(arr))
  }

  const eliminarTitulo = (i: number) => {
    setTextoNuevos(JSON.stringify(parseo.titulos.filter((_, k) => k !== i)))
  }

  const alternarExcluido = (key: string) => {
    setExcluidos((prev) => {
      const s = new Set(prev)
      if (s.has(key)) s.delete(key)
      else s.add(key)
      return s
    })
  }

  const marcarTodos = (incluir: boolean) =>
    setExcluidos(incluir ? new Set() : new Set(planCompleto.cambios.map((c) => c.key)))

  const aplicar = async () => {
    if (!puedeAplicar || carpetaTrabajo === null) return
    setAplicando(true)
    const aviso = toast.loading(aMover > 0 ? 'Moviendo y renombrando…' : 'Renombrando…')
    try {
      const res = await renombrarLote(
        carpetaTrabajo,
        aMover > 0 ? rutaExtraCargada : null,
        plan.cambios.map((c) => ({ original: c.orig, nuevo: c.nuevo, desde_extra: c.extra }))
      )
      setResultado(res)
      const n = res.fallidos.length
      if (n === 0) {
        toast.success(`🎉 Listo: ${res.correctos} archivo(s) ${aMover > 0 ? 'movidos y renombrados' : 'renombrados'}`, {
          id: aviso,
          duration: 6000,
        })
      } else if (res.correctos === 0) {
        toast.error(`No se pudo procesar ningún archivo (${n} fallo(s)). Mira el detalle en «Vista previa».`, {
          id: aviso,
          duration: 10000,
        })
      } else {
        toast.warning(`${res.correctos} correctos y ${n} con error. Mira el detalle en «Vista previa».`, {
          id: aviso,
          duration: 10000,
        })
      }
      setTextoNuevos('')
      setTab('previa')
      await Promise.all([
        rutaCargada ? cargarPrincipal(rutaCargada, false) : undefined,
        rutaExtraCargada ? cargarExtra(rutaExtraCargada, false) : undefined,
      ])
    } catch (e) {
      toast.error(`No se ha cambiado nada: ${e}`, { id: aviso, duration: 10000 })
    } finally {
      setAplicando(false)
    }
  }

  const sinCarpeta = carpetaTrabajo === null
  const mensajeBarra = sinCarpeta
    ? 'Carga una carpeta para empezar.'
    : problemas.length > 0
      ? problemas[0]!
      : plan.cambios.length === 0
        ? 'No hay cambios pendientes.'
        : aMover > 0
          ? `${plan.cambios.length} archivo(s): ${aMover} se moverán desde la carpeta extra.`
          : enSitio
            ? `${plan.cambios.length} archivo(s) se renombrarán en la carpeta extra.`
            : `${plan.cambios.length} archivo(s) se renombrarán.`

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 p-4 [--primary:oklch(0.769_0.188_70.08)] [--primary-foreground:oklch(1_0_0)] [--ring:oklch(0.769_0.188_70.08)]">
      <DropOverlay zona={zonaDrag} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SelectorCarpeta
          titulo="Carpeta principal"
          descripcion="Donde están (y acabarán) tus vídeos. Puedes arrastrar una carpeta desde Windows."
          icono={<FolderOpen className="size-4 text-amber-500" />}
          placeholder="Pega la ruta, pulsa «Examinar…» o arrastra aquí una carpeta"
          ruta={ruta}
          onRuta={setRuta}
          rutaCargada={rutaCargada}
          onCargar={() => {
            setResultado(null)
            void cargarPrincipal(ruta)
          }}
          onExaminar={() => void examinar(false)}
          cargando={cargando}
          error={errorCarpeta}
          deshabilitado={aplicando}
          resaltada={zonaDrag === 'principal'}
          nota={enSitio ? 'Ahora no se usa: solo se renombran los vídeos de la carpeta extra, donde están.' : undefined}
        >
          {rutaCargada && (
            <>
              <Badge variant="secondary" className="bg-amber-100! text-amber-800!">{estado.total} archivo(s)</Badge>
              <Badge variant="secondary">{estado.sinNumerar} sin numerar</Badge>
              <Badge variant="secondary">{estado.numerados} numerados</Badge>
              {estado.ultimoContador >= 0 && (
                <Badge variant="outline">
                  Último: {estado.ultimoContador.toString().padStart(4, '0')} · hora{' '}
                  {estado.ultimaHora.toString().padStart(2, '0')}
                </Badge>
              )}
            </>
          )}
        </SelectorCarpeta>

        <SelectorCarpeta
          titulo="Carpeta extra (opcional)"
          descripcion="Vídeos nuevos para titular y numerar. Elige abajo si se mueven a la principal o se renombran donde están."
          icono={<FolderInput className="size-4 text-amber-500" />}
          placeholder="Opcional: carpeta con vídeos nuevos"
          ruta={rutaExtra}
          onRuta={setRutaExtra}
          rutaCargada={rutaExtraCargada}
          onCargar={() => {
            setResultado(null)
            void cargarExtra(rutaExtra)
          }}
          onExaminar={() => void examinar(true)}
          cargando={cargandoExtra}
          error={errorExtra}
          deshabilitado={aplicando}
          resaltada={zonaDrag === 'extra'}
        >
          {rutaExtraCargada && <Badge variant="secondary" className="bg-amber-100! text-amber-800!">{extras.length} vídeo(s) en la extra</Badge>}

          {(rutaExtra.trim() !== '' || rutaExtraCargada) && (
            <div className="flex w-full flex-col gap-3 border-t pt-3">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="usar-extra" className="cursor-pointer">
                  Usar la carpeta extra
                </Label>
                <div className="flex items-center gap-3">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={quitarExtra}
                    disabled={aplicando}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X /> Quitar carpeta extra
                  </Button>
                  <Switch
                    id="usar-extra"
                    checked={usarExtra}
                    onCheckedChange={alternarUsarExtra}
                    disabled={aplicando || !rutaExtraCargada}
                    className="data-[state=checked]:border-amber-500! data-[state=checked]:bg-amber-500!"
                  />
                </div>
              </div>

              {rutaExtraCargada && (
                <fieldset disabled={!usarExtra || aplicando} className="flex flex-col gap-2 disabled:opacity-45">
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: 'mover', titulo: 'Mover a la principal', desc: 'Numera siguiendo la principal', icono: FolderInput },
                        { id: 'en-sitio', titulo: 'Solo renombrar aquí', desc: 'Sin mover, solo esta carpeta', icono: Pencil },
                      ] as const
                    ).map((m) => {
                      const activo = modoExtra === m.id
                      const Icono = m.icono
                      return (
                        <button
                          key={m.id}
                          type="button"
                          aria-pressed={activo}
                          onClick={() => {
                            setModoExtra(m.id)
                            setExcluidos(new Set())
                          }}
                          className={cn(
                            'flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-amber-500/30',
                            activo ? 'border-amber-400 bg-amber-50 text-amber-900' : 'hover:bg-muted'
                          )}
                        >
                          <Icono className={cn('size-4 shrink-0', activo ? 'text-amber-600' : 'text-muted-foreground')} />
                          <span className="min-w-0">
                            <span className="block text-sm leading-tight font-semibold">{m.titulo}</span>
                            <span className="block truncate text-[11px] leading-tight text-muted-foreground">{m.desc}</span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {modoExtra === 'mover'
                      ? 'Los vídeos se titulan, se numeran a continuación de la carpeta principal y se mueven a ella.'
                      : 'La carpeta extra se trata como una carpeta normal: su propia numeración, sin mover nada y sin tocar la principal.'}
                  </p>
                </fieldset>
              )}
            </div>
          )}
        </SelectorCarpeta>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <NumeracionCard
            modo={modo}
            onModo={setModoPedido}
            estado={estado}
            horas={horas}
            onHoras={setHoras}
            horaInicio={horaInicioEf}
            onHoraInicio={setHoraInicio}
            aleatorio={aleatorio}
            onAleatorio={setAleatorio}
            onMezclar={() => setSemilla(Math.floor(Math.random() * 2 ** 31))}
            deshabilitado={sinCarpeta || aplicando}
          />
          <TitulosOpciones
            cambiar={cambiarTitulos}
            onCambiar={(v) => {
              setCambiarTitulos(v)
              setTab(v ? 'titulos' : 'previa')
            }}
            mayusculas={mayusculas}
            onMayusculas={setMayusculas}
            deshabilitado={sinCarpeta || aplicando}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={restablecer}
            disabled={aplicando}
            className="self-start text-muted-foreground"
            title="Borra los ajustes recordados y vuelve a los valores por defecto"
          >
            <RotateCcw /> Restablecer ajustes
          </Button>
        </div>

        <Tabs value={tabActiva} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="titulos" disabled={!cambiarTitulos} className="px-4 data-[state=active]:bg-amber-500! data-[state=active]:text-white!">
              Títulos
              {hayTitulos && (
                <span className="rounded-full bg-black/10 px-1.5 text-xs tabular-nums">{base.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="previa" className="px-4 data-[state=active]:bg-amber-500! data-[state=active]:text-white!">
              Vista previa
              <span className="rounded-full bg-black/10 px-1.5 text-xs tabular-nums">{plan.cambios.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="titulos" className="flex flex-col gap-4">
            <TitulosPanel
              base={base}
              fraseIA={fraseIA}
              onFraseIA={setFraseIA}
              texto={textoNuevos}
              onTexto={setTextoNuevos}
              parseo={parseo}
              mayusculas={mayusculas}
              onEditar={editarTitulo}
              onEliminar={eliminarTitulo}
            />
          </TabsContent>

          <TabsContent value="previa" className="flex flex-col gap-4">
            <VistaPrevia
              filas={filas}
              sinCambios={sinCambios}
              problemas={problemas}
              resultado={resultado}
              onAlternar={alternarExcluido}
              onTodos={marcarTodos}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Barra de acción fija abajo */}
      <div className="sticky bottom-0 z-10 -mx-4 -mb-4 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <p
          className={
            problemas.length > 0 && !sinCarpeta
              ? 'flex min-w-0 items-center gap-2 text-sm text-red-600'
              : 'flex min-w-0 items-center gap-2 text-sm text-muted-foreground'
          }
        >
          {problemas.length > 0 && !sinCarpeta && <TriangleAlert className="size-4 shrink-0" />}
          <span className="truncate">{mensajeBarra}</span>
          {problemas.length > 1 && !sinCarpeta && (
            <span className="shrink-0 text-xs">(+{problemas.length - 1} más)</span>
          )}
        </p>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="lg"
              disabled={!puedeAplicar}
              className="shrink-0 bg-amber-500 px-6 text-white shadow-[0_0_16px_-6px] shadow-amber-500 hover:bg-amber-600"
            >
              {aplicando ? <Loader2 className="animate-spin" /> : <Check />}
              Aplicar cambios
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Procesar {plan.cambios.length} archivo(s)?</AlertDialogTitle>
              <AlertDialogDescription>
                Se cambiarán los nombres directamente en
                <span className="mt-1 block font-mono text-xs break-all">{carpetaTrabajo}</span>
                {aMover > 0 && (
                  <span className="mt-2 block">
                    {aMover} archivo(s) se <b>moverán</b> desde{' '}
                    <span className="font-mono text-xs break-all">{rutaExtraCargada}</span> a la carpeta principal.
                  </span>
                )}
                <span className="mt-2 block">
                  {numera
                    ? 'Se añadirá la numeración elegida. '
                    : modo === 'quitar'
                      ? 'Se quitará la numeración. '
                      : ''}
                  Revisa la vista previa: esta acción modifica tus archivos.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => void aplicar()}
                className="bg-amber-500! text-white! hover:bg-amber-600!"
              >
                Sí, procesar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
