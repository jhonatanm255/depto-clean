import Link from "next/link";
import { Star, Heart } from "lucide-react";

interface PropertyProps {
  property: {
    id: string;
    title: string;
    company: string;
    price: number;
    rating: number;
    reviews: number;
    beds: number;
    guests: number;
    image: string;
  };
}

export function PropertyCard({ property }: PropertyProps) {
  return (
    <Link href={`/alojamientos/${property.id}`} className="group block">
      <div className="flex flex-col gap-3">
        {/* Imagen */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={property.image}
            alt={property.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <button className="absolute right-3 top-3 p-1.5 rounded-full hover:bg-white/20 transition-colors">
            <Heart className="h-5 w-5 text-white/80 hover:text-white" />
          </button>
        </div>

        {/* Detalles */}
        <div className="flex flex-col">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-base line-clamp-1">{property.company}</h3>
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-foreground" />
              <span>{property.rating}</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm line-clamp-1">{property.title}</p>
          <p className="text-muted-foreground text-sm">{property.beds} camas · {property.guests} huéspedes</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-semibold">
              ${property.price.toLocaleString("es-CL")}
            </span>
            <span className="text-sm text-muted-foreground">noche</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
