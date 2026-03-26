"use client";

import React, { useState, useMemo } from "react";
import type { Rental } from "@/lib/types";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  KeyRound,
  Search,
  User,
  MapPin,
  Eye,
  BarChart2,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase
} from "lucide-react";
import { LoadingSpinner } from "@/components/core/loading-spinner";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const RENTAL_STATUS_LABELS: Record<Rental["rentalStatus"], string> = {
  reserved: "Reservada",
  active: "En Curso",
  completed: "Completada",
  cancelled: "Cancelada",
};

const PAYMENT_STATUS_LABELS: Record<Rental["paymentStatus"], string> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagado",
  refunded: "Reembolsado",
};

const GRADIENTS = [
  "from-blue-600 to-cyan-500",
  "from-indigo-600 to-purple-500",
  "from-emerald-600 to-teal-500",
  "from-rose-600 to-pink-500",
  "from-amber-500 to-orange-500",
  "from-slate-700 to-slate-500",
];

function getGradient(id: string) {
  const sum = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

export default function RentalsPage() {
  const { rentals, departments, dataLoading } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredRentals = useMemo(() => {
    return rentals
      .filter((r) => {
        const matchSearch =
          r.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.bookingReference &&
            r.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!matchSearch) return false;
        if (statusFilter !== "all" && r.rentalStatus !== statusFilter) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
      );
  }, [rentals, searchTerm, statusFilter]);

  const getDepartmentInfo = (departmentId: string) => {
    const dept = departments.find((d) => d.id === departmentId);
    return { name: dept?.name ?? "—", address: dept?.address ?? "Sin dirección" };
  };

  const activeRentalsCount = rentals.filter((r) => r.rentalStatus === "active").length;
  const reservedRentalsCount = rentals.filter((r) => r.rentalStatus === "reserved").length;

  if (dataLoading && rentals.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando portafolio de rentas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 bg-slate-50/50 dark:bg-background/95 min-h-screen">
      {/* Header Section */}
      <header className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-headline text-slate-900 dark:text-slate-100 flex items-center gap-3 tracking-tight">
              Gestión de Rentas
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-base">
              Control en tiempo real de reservas, huéspedes y ocupación en {rentals.length} rentas registradas.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-3 bg-white dark:bg-card border border-border/60 shadow-sm rounded-xl px-4 py-3 flex-1 lg:flex-none">
              <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none dark:text-slate-100">{activeRentalsCount}</p>
                <p className="text-xs text-slate-500 font-medium">Activas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white dark:bg-card border border-border/60 shadow-sm rounded-xl px-4 py-3 flex-1 lg:flex-none">
              <div className="bg-amber-100 dark:bg-amber-500/20 p-2 rounded-full">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none dark:text-slate-100">{reservedRentalsCount}</p>
                <p className="text-xs text-slate-500 font-medium">Reservadas</p>
              </div>
            </div>

            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl font-semibold flex-1 lg:flex-none h-auto py-3">
              <Link href="/admin/rentals/new">
                <Plus className="mr-2 h-5 w-5" /> Nueva Renta
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Filters Section */}
      <div className="bg-white dark:bg-card border border-border/60 rounded-xl p-4 shadow-sm mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por huésped, referencia o plataforma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 bg-slate-50 dark:bg-muted/50 border-transparent focus-visible:border-primary rounded-lg text-base"
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px] h-12 bg-slate-50 dark:bg-muted/50 border-transparent rounded-lg">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {(Object.keys(RENTAL_STATUS_LABELS) as Rental["rentalStatus"][]).map(
                (s) => (
                  <SelectItem key={s} value={s}>
                    {RENTAL_STATUS_LABELS[s]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {!dataLoading && rentals.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl bg-white/50 dark:bg-card/50">
          <Briefcase className="mx-auto h-20 w-20 text-slate-300 dark:text-slate-700 mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            No tienes rentas registradas
          </h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Comienza a administrar tu portafolio añadiendo tu primera reserva desde Booking, Airbnb o directa.
          </p>
          <Button asChild size="lg" className="rounded-xl shadow-md">
            <Link href="/admin/rentals/new">
              <Plus className="mr-2 h-5 w-5" /> Añadir Renta
            </Link>
          </Button>
        </div>
      ) : !dataLoading && filteredRentals.length === 0 ? (
        <div className="text-center py-16 border rounded-xl bg-white dark:bg-card shadow-sm">
          <p className="text-slate-500 text-lg">No hay rentas que coincidan con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRentals.map((rental) => {
            const { name: deptName, address: deptAddress } = getDepartmentInfo(rental.departmentId);
            
            const now = new Date();
            const start = new Date(rental.checkInDate);
            const end = new Date(rental.checkOutDate);
            const totalDays = differenceInDays(end, start) || 1;
            const daysPassed = differenceInDays(now, start);
            
            let progress = 0;
            if (rental.rentalStatus === 'completed') progress = 100;
            else if (rental.rentalStatus === 'reserved') progress = 0;
            else if (daysPassed >= totalDays) progress = 100;
            else if (daysPassed > 0) progress = Math.round((daysPassed / totalDays) * 100);

            const isAirbnb = rental.bookingSource?.toLowerCase().includes("airbnb");
            const isBooking = rental.bookingSource?.toLowerCase().includes("booking");

            return (
              <Card key={rental.id} className="overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 bg-white dark:bg-card border-border/50 group rounded-2xl">
                {/* Visual Header */}
                <div className={cn("relative h-40 bg-gradient-to-br p-4 flex flex-col justify-between", getGradient(rental.id))}>
                  <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-transparent" />
                  
                  <div className="flex justify-between items-start relative z-10">
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md shadow-sm uppercase text-[10px] font-bold tracking-wider rounded-md">
                      {rental.bookingSource || "Directo"}
                    </Badge>
                    {rental.rentalStatus === "active" && (
                      <Badge className="bg-rose-500 text-white border-0 shadow-sm uppercase text-[10px] font-bold tracking-wider rounded-md">
                        ACTIVA
                      </Badge>
                    )}
                    {rental.rentalStatus === "reserved" && (
                      <Badge className="bg-amber-500 text-white border-0 shadow-sm uppercase text-[10px] font-bold tracking-wider rounded-md">
                        RESERVA
                      </Badge>
                    )}
                    {(rental.rentalStatus === "active" || rental.rentalStatus === "reserved") && new Date(rental.checkOutDate) <= new Date() && (
                      <Badge className="bg-orange-600 text-white border-0 shadow-sm uppercase text-[10px] font-bold tracking-wider rounded-md">
                        TIEMPO CUMPLIDO
                      </Badge>
                    )}
                  </div>

                  <div className="relative z-10 mt-auto">
                    <h3 className="font-extrabold text-xl text-white leading-tight drop-shadow-md line-clamp-1" title={deptName}>
                      {deptName}
                    </h3>
                    <div className="flex items-center text-white/90 text-[11px] font-medium mt-1">
                      <MapPin className="w-3 h-3 mr-1 shrink-0" />
                      <span className="truncate drop-shadow-sm">{deptAddress}</span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col">
                  {/* Tenant */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold shrink-0">
                        {rental.tenantName.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{rental.tenantName}</p>
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Huésped</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress & Dates */}
                  <div className="space-y-2 mb-4 mt-auto">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>Progreso de Estancia</span>
                      <span className="text-primary">{progress}%</span>
                    </div>
                    <Progress 
                      value={progress} 
                      className="h-2.5 bg-slate-100 dark:bg-slate-800" 
                      indicatorClassName={cn(
                        "transition-all duration-500",
                        progress === 100 ? 'bg-emerald-500' : 'bg-primary'
                      )} 
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1">
                      {format(start, 'dd MMM yyyy', { locale: es })} – {format(end, 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                </CardContent>

                {/* Footer Actions */}
                <div className="px-3 py-3 border-t bg-slate-50 dark:bg-muted/20">
                  <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800" asChild>
                    <Link href={`/admin/rentals/${rental.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Ver Detalles de Renta</span>
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
          
          {/* Add New Property Card Overlay Style */}
          <Link href="/admin/rentals/new" className="group">
            <Card className="h-full min-h-[350px] border-2 border-dashed border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center text-center p-6 rounded-2xl cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 flex items-center justify-center transition-colors mb-4">
                <Briefcase className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">Añadir Nueva Renta</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-[200px]">
                Expande tu portafolio y gestiona un nuevo arriendo fácilmente.
              </p>
              <div className="bg-white dark:bg-card px-6 py-2 rounded-full font-bold text-sm shadow-sm border text-slate-700 dark:text-slate-300 group-hover:border-primary/30 group-hover:text-primary transition-colors">
                Quick Setup
              </div>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
