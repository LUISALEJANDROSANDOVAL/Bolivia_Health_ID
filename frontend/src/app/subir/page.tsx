import { DashboardLayout } from '@/components/dashboard-layout'
import { FileUpload } from '@/components/file-upload'
import { Lock, Cloud, Shield, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Lock,
    title: 'Cifrado End-to-End',
    description: 'Tus archivos se cifran antes de ser subidos, garantizando que solo tú puedas acceder a ellos.',
  },
  {
    icon: Cloud,
    title: 'Almacenamiento IPFS',
    description: 'Los archivos se distribuyen en una red descentralizada, eliminando puntos únicos de fallo.',
  },
  {
    icon: Shield,
    title: 'Control de Acceso',
    description: 'Decide quién puede ver tus documentos y revoca permisos cuando lo desees.',
  },
  {
    icon: CheckCircle2,
    title: 'Verificación Blockchain',
    description: 'Cada documento tiene un hash único registrado en la blockchain para verificar su autenticidad.',
  },
]

export default function SubirPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subir Archivos</h1>
          <p className="text-sm text-muted-foreground">
            Sube tus documentos médicos de forma segura a la red descentralizada
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <FileUpload />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">¿Por qué IPFS?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">{feature.title}</h4>
                    <p className="mt-0.5 text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
