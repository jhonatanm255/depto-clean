import { GuestNavbar } from "@/components/guest/guest-navbar";

export default function GuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GuestNavbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t py-8 mt-12">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} CleanSweep. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacidad</a>
            <a href="#" className="hover:underline">Términos</a>
            <a href="#" className="hover:underline">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
