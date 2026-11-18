'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Type } from 'lucide-react'

interface Props {
  cambiar: boolean
  onCambiar: (v: boolean) => void
  mayusculas: boolean
  onMayusculas: (v: boolean) => void
  deshabilitado: boolean
}

export function TitulosOpciones({ cambiar, onCambiar, mayusculas, onMayusculas, deshabilitado }: Props) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Type className="size-4 text-amber-500" /> Títulos
        </CardTitle>
        <CardDescription className="text-xs">Sustituye los nombres por los que te devuelva la IA.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">

        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="cambiar-titulos" className="cursor-pointer">
            Cambiar los títulos
          </Label>
          <Switch
            id="cambiar-titulos"
            checked={cambiar}
            onCheckedChange={onCambiar}
            disabled={deshabilitado}
            className="data-[state=checked]:border-amber-500! data-[state=checked]:bg-amber-500!"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="mayusculas" className="cursor-pointer">
            Todo en MAYÚSCULAS
          </Label>
          <Switch
            id="mayusculas"
            checked={mayusculas}
            onCheckedChange={onMayusculas}
            disabled={deshabilitado || !cambiar}
            className="data-[state=checked]:border-amber-500! data-[state=checked]:bg-amber-500!"
          />
        </div>
      </CardContent>
    </Card>
  )
}
