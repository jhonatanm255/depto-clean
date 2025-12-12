import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Política de Privacidad - CleanSweep Manager',
};

export default function PrivacyPage() {
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
          <CardTitle className="text-3xl">Política de Privacidad</CardTitle>
          <CardDescription>Última actualización: {new Date().toLocaleDateString('es-CL')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 prose prose-sm max-w-none">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Información que Recopilamos</h2>
            <p className="text-muted-foreground mb-4">
              Recopilamos información que usted nos proporciona directamente, incluyendo:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Nombre completo y datos de contacto</li>
              <li>Dirección de correo electrónico</li>
              <li>Información de la empresa y departamentos</li>
              <li>Datos de empleados y asignaciones de trabajo</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Uso de la Información</h2>
            <p className="text-muted-foreground mb-4">
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Proporcionar y mejorar nuestros servicios</li>
              <li>Gestionar cuentas de usuario y empresas</li>
              <li>Comunicarnos con usted sobre el servicio</li>
              <li>Cumplir con obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Protección de Datos</h2>
            <p className="text-muted-foreground">
              Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger 
              su información personal contra acceso no autorizado, alteración, divulgación o destrucción.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Compartir Información</h2>
            <p className="text-muted-foreground">
              No vendemos, alquilamos ni compartimos su información personal con terceros, excepto 
              cuando sea necesario para proporcionar nuestros servicios o cuando la ley lo requiera.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Sus Derechos</h2>
            <p className="text-muted-foreground mb-4">
              Usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Acceder a su información personal</li>
              <li>Rectificar datos inexactos</li>
              <li>Solicitar la eliminación de sus datos</li>
              <li>Oponerse al procesamiento de sus datos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Contacto</h2>
            <p className="text-muted-foreground">
              Si tiene preguntas sobre esta política de privacidad, puede contactarnos a través de 
              los canales de soporte disponibles en la aplicación.
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
