"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, CheckCircle2, Loader2 } from "lucide-react";

interface BookingWidgetProps {
  property: {
    id: string;
    price: number;
    rating: number;
    reviews: number;
  };
}

export function BookingWidget({ property }: BookingWidgetProps) {
  const [nights, setNights] = useState(3); // Por defecto 3 noches para el mockup
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const cleaningFee = 25000;
  const serviceFee = Math.round(property.price * nights * 0.1);
  const total = (property.price * nights) + cleaningFee + serviceFee;

  const handleBooking = async () => {
    setIsBooking(true);
    try {
      // Simular llamada a API
      const res = await fetch("/api/rentals/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: property.id,
          checkIn: "2026-03-20",
          checkOut: "2026-03-23",
          guests: 2,
          nights,
          totalAmount: total
        }),
      });
      
      if (res.ok) {
        setBookingSuccess(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsBooking(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="bg-background rounded-xl border p-8 shadow-xl text-center flex flex-col items-center gap-4">
        <div className="bg-green-100 p-4 rounded-full">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold">¡Reserva Confirmada!</h3>
        <p className="text-muted-foreground">Te hemos enviado un correo con todos los detalles de tu estadía.</p>
        <Button className="mt-4 w-full" variant="outline" onClick={() => setBookingSuccess(false)}>
          Hacer otra reserva
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-xl border p-6 shadow-xl card-shadow flex flex-col gap-4">
      {/* Cabecera */}
      <div className="flex items-baseline justify-between mb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold">${property.price.toLocaleString("es-CL")}</span>
          <span className="text-muted-foreground text-base">noche</span>
        </div>
      </div>

      {/* Selectores de fecha/huespedes */}
      <div className="rounded-lg border overflow-hidden flex flex-col">
        <div className="flex border-b w-full">
          <div className="flex-1 p-3 border-r flex flex-col cursor-pointer hover:bg-muted">
            <span className="text-[10px] font-bold uppercase">Llegada</span>
            <span className="text-sm">20 Mar 2026</span>
          </div>
          <div className="flex-1 p-3 flex flex-col cursor-pointer hover:bg-muted">
            <span className="text-[10px] font-bold uppercase">Salida</span>
            <span className="text-sm">23 Mar 2026</span>
          </div>
        </div>
        <div className="w-full p-3 flex justify-between items-center cursor-pointer hover:bg-muted">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase">Huéspedes</span>
            <span className="text-sm">2 huéspedes</span>
          </div>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <Button 
        className="w-full py-6 text-base font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 border-0"
        onClick={handleBooking}
        disabled={isBooking}
      >
        {isBooking ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Procesando...
          </>
        ) : "Reservar"}
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-2">
        Aún no se te cobrará nada
      </p>

      {/* Desglose */}
      <div className="flex flex-col gap-3 mt-4 text-sm font-medium">
        <div className="flex justify-between">
          <span className="underline">${property.price.toLocaleString("es-CL")} x {nights} noches</span>
          <span>${(property.price * nights).toLocaleString("es-CL")}</span>
        </div>
        <div className="flex justify-between">
          <span className="underline">Tarifa de limpieza</span>
          <span>${cleaningFee.toLocaleString("es-CL")}</span>
        </div>
        <div className="flex justify-between">
          <span className="underline">Comisión por servicio</span>
          <span>${serviceFee.toLocaleString("es-CL")}</span>
        </div>
        
        <div className="border-t pt-4 mt-2 flex justify-between text-base font-bold">
          <span>Total</span>
          <span>${total.toLocaleString("es-CL")}</span>
        </div>
      </div>
    </div>
  );
}
