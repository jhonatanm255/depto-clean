import { PropertyCard } from "@/components/guest/property-card";
import { Sparkles, Map, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Suspense } from "react";
import { LoadingSpinner } from "@/components/core/loading-spinner";

import { supabase } from "@/lib/supabase";

async function getProperties() {
  const { data: properties, error } = await supabase
    .from('departments')
    .select(`
        id, name, address, max_guests, rental_price_per_night, images, description,
        companies:company_id (name)
      `)
    .eq('is_rentable', true)
    .eq('rental_status', 'available')
    .not('rental_price_per_night', 'is', null);

  if (error) {
    console.error("Error al cargar propiedades", error);
    return [];
  }

  return (properties || []).map((prop: any) => ({
    id: prop.id,
    title: prop.name,
    company: prop.companies?.name || "Anfitrión Particular",
    price: prop.rental_price_per_night || 0,
    rating: 5.0,
    reviews: 0,
    beds: prop.beds_count || 1,
    guests: prop.max_guests || 1,
    image: Array.isArray(prop.images) && prop.images.length > 0
      ? prop.images[0]
      : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop",
    allImages: Array.isArray(prop.images) ? prop.images : [],
    description: prop.description
  }));
}

export default async function AlojamientosPage() {
  const properties = await getProperties();

  return (
    <div className="container mx-auto px-4 md:px-6 py-6 fade-in">
      {/* Categorías o Filtros rápidos (opcional) */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-6 min-w-max">
          <div className="flex flex-col items-center gap-2 cursor-pointer text-primary border-b-2 border-primary pb-2">
            <Sparkles className="h-6 w-6" />
            <span className="text-sm font-medium">Novedades</span>
          </div>
          <div className="flex flex-col items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground opacity-70 hover:opacity-100 transition-all pb-2">
            <Map className="h-6 w-6" />
            <span className="text-sm font-medium">Frente a la playa</span>
          </div>
        </div>

        <Button variant="outline" className="hidden md:flex gap-2 rounded-full">
          <Filter className="h-4 w-4" /> Filtros
        </Button>
      </div>

      {/* Grid de propiedades */}
      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground border rounded-xl border-dashed">
          <Sparkles className="h-12 w-12 mb-4 opacity-50" />
          <h2 className="text-xl font-bold text-foreground">No hay propiedades disponibles</h2>
          <p className="mt-2">Ningún anfitrión ha publicado alojamientos aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {properties.map((property: any) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}
