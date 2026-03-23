"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share, Heart, Star, MapPin, Award, Bed, Bath, Users } from "lucide-react";
import { PropertyGallery } from "@/components/guest/property-gallery";
import { BookingWidget } from "@/components/guest/booking-widget";

import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";

// Since it's a dynamic path we can use an async server component
async function getProperty(id: string) {
  const { data: prop, error } = await supabase
    .from('departments')
    .select(`
      id, name, address, max_guests, rental_price_per_night, images, description, beds_count,
      companies:company_id (name)
    `)
    .eq('id', id)
    .single();

  if (error || !prop) return null;

  return {
    id: prop.id,
    title: prop.name,
    company: prop.companies?.name || "Anfitrión Particular",
    price: prop.rental_price_per_night || 0,
    rating: 5.0,
    reviews: 0,
    location: prop.address || "Dirección no especificada",
    host: {
      name: prop.companies?.name || "Anfitrión",
      image: "https://i.pravatar.cc/150?u=host",
      joined: "2024",
    },
    specs: {
      guests: prop.max_guests || 1,
      bedrooms: 1, // To be refined
      beds: prop.beds_count || 1,
      baths: 1, // To be refined
    },
    images: Array.isArray(prop.images) && prop.images.length > 0 
      ? prop.images 
      : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop"],
    description: prop.description || "Sin descripción proporcionada.",
  };
}

export default async function PropertyDetailsPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);

  if (!property) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-12 fade-in max-w-6xl">
      {/* Título y Acciones */}
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{property.title}</h1>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-foreground" />
              <span>{property.rating}</span>
            </div>
            <span className="underline cursor-pointer">{property.reviews} evaluaciones</span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Anfitrión destacado</span>
            </div>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="underline cursor-pointer text-muted-foreground flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {property.location}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <button className="flex items-center gap-2 hover:bg-muted p-2 rounded-md transition-colors">
              <Share className="h-4 w-4" /> <span className="underline">Compartir</span>
            </button>
            <button className="flex items-center gap-2 hover:bg-muted p-2 rounded-md transition-colors">
              <Heart className="h-4 w-4" /> <span className="underline">Guardar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Galería de imágenes */}
      <PropertyGallery images={property.images} />

      <div className="flex flex-col lg:flex-row gap-12 mt-12 relative">
        {/* Contenido principal izquierdo */}
        <div className="flex-1 flex flex-col gap-8">
          
          {/* Info del anfitrión */}
          <div className="flex items-center justify-between pb-6 border-b">
            <div>
              <h2 className="text-xl font-bold">Alojamiento entero. Anfitrión: {property.host.name}</h2>
              <div className="flex items-center gap-3 text-base mt-2 text-foreground/80">
                <span className="flex items-center gap-1"><Users className="h-4 w-4"/> {property.specs.guests} huéspedes</span> · 
                <span className="flex items-center gap-1"><Bed className="h-4 w-4"/> {property.specs.bedrooms} dormitorios</span> · 
                <span className="flex items-center gap-1"><Bath className="h-4 w-4"/> {property.specs.beds} camas</span> · 
                <span>{property.specs.baths} baños</span>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={property.host.image} 
              alt={property.host.name} 
              className="h-12 w-12 rounded-full object-cover"
            />
          </div>

          {/* Highlights */}
          <div className="flex flex-col gap-6 pb-6 border-b">
            <div className="flex gap-4">
              <Award className="h-6 w-6 text-foreground flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-base">{property.host.name} es un Anfitrión Destacado</h3>
                <p className="text-muted-foreground text-sm">Los anfitriones destacados tienen mucha experiencia y calificaciones excelentes.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <MapPin className="h-6 w-6 text-foreground flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-base">Excelente ubicación</h3>
                <p className="text-muted-foreground text-sm">El 100% de los huéspedes recientes calificó la ubicación con 5 estrellas.</p>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="pb-6 border-b">
            <h2 className="text-xl font-bold mb-4">Acerca de este espacio</h2>
            <div className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {property.description}
            </div>
            <Button variant="link" className="px-0 mt-2 underline font-semibold text-base">Mostrar más</Button>
          </div>

        </div>

        {/* Widget de reserva derecho (Sticky) */}
        <div className="w-full lg:w-[350px] xl:w-[400px]">
          <div className="sticky top-24">
            <BookingWidget property={property} />
          </div>
        </div>
      </div>
    </div>
  );
}
