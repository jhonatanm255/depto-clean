"use client";

import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyGalleryProps {
  images: string[];
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
  if (!images || images.length === 0) return null;

  return (
    <div className="relative group">
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 h-[300px] md:h-[450px] rounded-2xl overflow-hidden">
        {/* Imagen principal */}
        <div className="md:col-span-2 md:row-span-2 h-full w-full relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt="Property view"
            className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition"
          />
        </div>
        
        {/* Resto de fotos (ocultas en movil para no saturar) */}
        {images.slice(1, 5).map((img, index) => (
          <div key={index} className={`hidden md:block h-full w-full relative ${index === 1 && images.length === 5 ? 'col-start-3 row-start-1' : ''}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`Property view ${index + 2}`}
              className="w-full h-full object-cover cursor-pointer hover:brightness-90 transition"
            />
          </div>
        ))}
      </div>

      <Button 
        variant="secondary" 
        className="absolute bottom-4 right-4 flex gap-2 items-center text-sm font-semibold bg-white/90 shadow-sm hover:bg-white"
      >
        <LayoutGrid className="h-4 w-4" />
        Mostrar todas las fotos
      </Button>
    </div>
  );
}
