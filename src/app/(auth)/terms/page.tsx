import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Términos y Condiciones - CleanSweep Manager',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="flex flex-col items-center mb-6">
        <div className="mb-4 flex h-20 w-20 items-center justify-center bg-primary p-4 rounded-md">
          <Image 
            src="/logo.png" 
            alt="Logo de CleanSweep Manager" 
            width={80} 
            height={80}
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl font-headline font-semibold text-foreground">CleanSweep Manager</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Términos y Condiciones de Uso</CardTitle>
          <CardDescription>Última actualización: {new Date().toLocaleDateString('es-CL')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 prose prose-sm max-w-none">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Aceptación de los Términos</h2>
            <p className="text-muted-foreground">
              Al acceder y utilizar CleanSweep Manager, usted acepta estar sujeto a estos términos 
              y condiciones de uso. Si no está de acuerdo con alguna parte de estos términos, 
              no debe utilizar nuestro servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Uso del Servicio</h2>
            <p className="text-muted-foreground mb-4">
              Usted se compromete a utilizar el servicio de manera responsable y de acuerdo con 
              la ley. Está prohibido:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Utilizar el servicio para actividades ilegales</li>
              <li>Intentar acceder a áreas no autorizadas del sistema</li>
              <li>Interferir con el funcionamiento del servicio</li>
              <li>Compartir credenciales de acceso con terceros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Cuentas de Usuario</h2>
            <p className="text-muted-foreground mb-4">
              Usted es responsable de:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Mantener la confidencialidad de sus credenciales</li>
              <li>Todas las actividades que ocurran bajo su cuenta</li>
              <li>Notificarnos inmediatamente sobre uso no autorizado</li>
              <li>Proporcionar información precisa y actualizada</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Propiedad Intelectual</h2>
            <p className="text-muted-foreground">
              Todo el contenido del servicio, incluyendo pero no limitado a textos, gráficos, 
              logotipos, iconos y software, es propiedad de CleanSweep Manager y está protegido 
              por leyes de propiedad intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground">
              CleanSweep Manager se proporciona "tal cual" sin garantías de ningún tipo. 
              No garantizamos que el servicio esté libre de errores o interrupciones. 
              No seremos responsables por daños indirectos o consecuentes derivados del uso del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Modificaciones</h2>
            <p className="text-muted-foreground">
              Nos reservamos el derecho de modificar estos términos en cualquier momento. 
              Las modificaciones entrarán en vigor al publicarse en el servicio. 
              Es su responsabilidad revisar periódicamente estos términos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Terminación</h2>
            <p className="text-muted-foreground">
              Podemos suspender o terminar su acceso al servicio en cualquier momento, 
              con o sin causa, con o sin previo aviso, por cualquier motivo, incluyendo 
              violación de estos términos.
            </p>
          </section>

          <div className="pt-6 border-t">
            <Link href="/login">
              <Button variant="outline">Volver al inicio de sesión</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
