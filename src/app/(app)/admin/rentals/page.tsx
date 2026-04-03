"use client";

import React, { useState, useMemo } from "react";
import type { Rental } from "@/lib/types";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  MapPin,
  Eye,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  Building2,
  ChevronDown,
  CalendarDays,
  CalendarRange,
  Calendar as CalendarIcon,
  LayoutList,
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
import { format, differenceInDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
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

const CONDO_GRADIENTS = [
  "from-violet-600 to-indigo-500",
  "from-sky-600 to-blue-500",
  "from-teal-600 to-emerald-500",
  "from-orange-600 to-amber-500",
  "from-pink-600 to-rose-500",
  "from-cyan-600 to-teal-500",
  "from-fuchsia-600 to-purple-500",
  "from-lime-600 to-green-500",
];

function getGradient(id: string) {
  const sum = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
}

function getCondoGradient(index: number) {
  return CONDO_GRADIENTS[index % CONDO_GRADIENTS.length];
}

type TimeFilter = "all" | "day" | "week" | "month";

const TIME_FILTER_CONFIG: Record<TimeFilter, { label: string; icon: React.ReactNode }> = {
  all: { label: "Todas", icon: <LayoutList className="w-4 h-4" /> },
  day: { label: "Hoy", icon: <CalendarDays className="w-4 h-4" /> },
  week: { label: "Esta Semana", icon: <CalendarRange className="w-4 h-4" /> },
  month: { label: "Este Mes", icon: <CalendarIcon className="w-4 h-4" /> },
};

export default function RentalsPage() {
  const { rentals, departments, condominiums, dataLoading } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [expandedCondos, setExpandedCondos] = useState<Set<string>>(new Set());

  const toggleCondo = (condoId: string) => {
    setExpandedCondos((prev) => {
      const next = new Set(prev);
      if (next.has(condoId)) {
        next.delete(condoId);
      } else {
        next.add(condoId);
      }
      return next;
    });
  };

  // Build a map: departmentId → condominiumId
  const deptToCondoMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const dept of departments) {
      if (dept.condominiumId) {
        map.set(dept.id, dept.condominiumId);
      }
    }
    return map;
  }, [departments]);

  // Filter rentals by search, status, and time
  const filteredRentals = useMemo(() => {
    const now = new Date();

    return rentals
      .filter((r) => {
        // Search filter
        const matchSearch =
          r.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.bookingReference &&
            r.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!matchSearch) return false;

        // Status filter
        if (statusFilter !== "all" && r.rentalStatus !== statusFilter) return false;

        // Time filter
        if (timeFilter !== "all") {
          const checkIn = new Date(r.checkInDate);
          const checkOut = new Date(r.checkOutDate);

          let rangeStart: Date;
          let rangeEnd: Date;

          switch (timeFilter) {
            case "day":
              rangeStart = startOfDay(now);
              rangeEnd = endOfDay(now);
              break;
            case "week":
              rangeStart = startOfWeek(now, { locale: es, weekStartsOn: 1 });
              rangeEnd = endOfWeek(now, { locale: es, weekStartsOn: 1 });
              break;
            case "month":
              rangeStart = startOfMonth(now);
              rangeEnd = endOfMonth(now);
              break;
          }

          // A rental overlaps the range if checkIn <= rangeEnd AND checkOut >= rangeStart
          if (checkIn > rangeEnd || checkOut < rangeStart) return false;
        }

        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime()
      );
  }, [rentals, searchTerm, statusFilter, timeFilter]);

  // Group filtered rentals by condominium
  const groupedByCondominium = useMemo(() => {
    const groups: Map<string, { condoName: string; condoAddress: string; rentals: Rental[] }> = new Map();
    const NO_CONDO_KEY = "__sin_condominio__";

    for (const rental of filteredRentals) {
      const condoId = deptToCondoMap.get(rental.departmentId) || NO_CONDO_KEY;

      if (!groups.has(condoId)) {
        if (condoId === NO_CONDO_KEY) {
          groups.set(condoId, {
            condoName: "Sin Condominio",
            condoAddress: "Departamentos sin condominio asignado",
            rentals: [],
          });
        } else {
          const condo = condominiums.find((c) => c.id === condoId);
          groups.set(condoId, {
            condoName: condo?.name ?? "Condominio Desconocido",
            condoAddress: condo?.address ?? "Sin dirección",
            rentals: [],
          });
        }
      }

      groups.get(condoId)!.rentals.push(rental);
    }

    // Sort groups: condominiums with rentals first, "sin condominio" last
    const entries = Array.from(groups.entries()).sort(([aKey, aVal], [bKey, bVal]) => {
      if (aKey === NO_CONDO_KEY) return 1;
      if (bKey === NO_CONDO_KEY) return -1;
      return aVal.condoName.localeCompare(bVal.condoName);
    });

    return entries;
  }, [filteredRentals, deptToCondoMap, condominiums]);

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
      <div className="bg-white dark:bg-card border border-border/60 rounded-xl p-4 shadow-sm mb-8 flex flex-col gap-4">
        {/* Search & Status row */}
        <div className="flex flex-col sm:flex-row gap-4">
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

        {/* Time filter row */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Período:
          </span>
          <div className="flex gap-1.5 bg-slate-100 dark:bg-muted/50 p-1 rounded-lg">
            {(Object.keys(TIME_FILTER_CONFIG) as TimeFilter[]).map((key) => {
              const { label, icon } = TIME_FILTER_CONFIG[key];
              const isActive = timeFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setTimeFilter(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200",
                    isActive
                      ? "bg-white dark:bg-card text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-card/50"
                  )}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </div>
          {timeFilter !== "all" && (
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">
              {timeFilter === "day" && format(new Date(), "dd 'de' MMMM yyyy", { locale: es })}
              {timeFilter === "week" && `${format(startOfWeek(new Date(), { weekStartsOn: 1 }), "dd MMM", { locale: es })} – ${format(endOfWeek(new Date(), { weekStartsOn: 1 }), "dd MMM yyyy", { locale: es })}`}
              {timeFilter === "month" && format(new Date(), "MMMM yyyy", { locale: es })}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
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
          <CalendarDays className="mx-auto h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-slate-500 text-lg font-medium">No hay rentas que coincidan con los filtros seleccionados.</p>
          <p className="text-slate-400 text-sm mt-1">Prueba cambiando el período o el estado.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByCondominium.map(([condoId, group], condoIndex) => {
            const isCollapsed = !expandedCondos.has(condoId);
            const activeInGroup = group.rentals.filter((r) => r.rentalStatus === "active").length;
            const reservedInGroup = group.rentals.filter((r) => r.rentalStatus === "reserved").length;

            return (
              <div key={condoId} className="rounded-2xl overflow-hidden border border-border/50 bg-white dark:bg-card shadow-sm transition-shadow hover:shadow-md">
                {/* Condominium Header */}
                <button
                  onClick={() => toggleCondo(condoId)}
                  className="w-full text-left"
                >
                  <div className="relative px-6 py-4 flex items-center justify-between gap-4 transition-colors bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-300 dark:bg-slate-700 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
                          {group.condoName}
                        </h2>
                        <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5">
                          <MapPin className="w-3 h-3 mr-1 shrink-0" />
                          <span className="truncate">{group.condoAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Stats badges */}
                      <div className="hidden sm:flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs font-bold">
                          {group.rentals.length} renta{group.rentals.length !== 1 ? "s" : ""}
                        </Badge>
                        {activeInGroup > 0 && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0 text-xs font-bold">
                            {activeInGroup} activa{activeInGroup !== 1 ? "s" : ""}
                          </Badge>
                        )}
                        {reservedInGroup > 0 && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0 text-xs font-bold">
                            {reservedInGroup} reservada{reservedInGroup !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>

                      <div className={cn(
                        "w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center transition-transform duration-300",
                        isCollapsed ? "" : "rotate-180"
                      )}>
                        <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                      </div>
                    </div>
                  </div>
                </button>

                {/* Mobile stat badges (visible under header when expanded) */}
                {!isCollapsed && (
                  <div className="sm:hidden flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-muted/30 border-b border-border/30">
                    <Badge variant="secondary" className="text-xs font-bold">
                      {group.rentals.length} renta{group.rentals.length !== 1 ? "s" : ""}
                    </Badge>
                    {activeInGroup > 0 && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-0 text-xs font-bold">
                        {activeInGroup} activa{activeInGroup !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {reservedInGroup > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-0 text-xs font-bold">
                        {reservedInGroup} reservada{reservedInGroup !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Rentals Grid */}
                <div
                  className={cn(
                    "transition-all duration-300 ease-in-out overflow-hidden",
                    isCollapsed ? "max-h-0" : "max-h-[5000px]"
                  )}
                >
                  <div className="p-4 md:p-6">
                    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {group.rentals.map((rental) => {
                        const { name: deptName, address: deptAddress } = getDepartmentInfo(rental.departmentId);

                        const now = new Date();
                        const start = new Date(rental.checkInDate);
                        const end = new Date(rental.checkOutDate);
                        const totalDays = differenceInDays(end, start) || 1;
                        const daysPassed = differenceInDays(now, start);

                        let progress = 0;
                        if (rental.rentalStatus === "completed") progress = 100;
                        else if (rental.rentalStatus === "reserved") progress = 0;
                        else if (daysPassed >= totalDays) progress = 100;
                        else if (daysPassed > 0)
                          progress = Math.round((daysPassed / totalDays) * 100);

                        return (
                          <Card
                            key={rental.id}
                            className="overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300 bg-white dark:bg-card border-border/50 group rounded-2xl"
                          >
                            {/* Visual Header */}
                            <div
                              className={cn(
                                "relative h-36 bg-gradient-to-br p-4 flex flex-col justify-between",
                                getGradient(rental.id)
                              )}
                            >
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
                                {rental.rentalStatus === "completed" && (
                                  <Badge className="bg-emerald-500 text-white border-0 shadow-sm uppercase text-[10px] font-bold tracking-wider rounded-md">
                                    COMPLETADA
                                  </Badge>
                                )}
                                {rental.rentalStatus === "cancelled" && (
                                  <Badge className="bg-slate-500 text-white border-0 shadow-sm uppercase text-[10px] font-bold tracking-wider rounded-md">
                                    CANCELADA
                                  </Badge>
                                )}
                              </div>

                              <div className="relative z-10 mt-auto">
                                <h3
                                  className="font-extrabold text-lg text-white leading-tight drop-shadow-md line-clamp-1"
                                  title={deptName}
                                >
                                  {deptName}
                                </h3>
                                <div className="flex items-center text-white/90 text-[11px] font-medium mt-0.5">
                                  <MapPin className="w-3 h-3 mr-1 shrink-0" />
                                  <span className="truncate drop-shadow-sm">
                                    {deptAddress}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <CardContent className="p-4 flex-1 flex flex-col">
                              {/* Tenant */}
                              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-sm shrink-0">
                                    {rental.tenantName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div className="truncate">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">
                                      {rental.tenantName}
                                    </p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">
                                      Huésped
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Progress & Dates */}
                              <div className="space-y-2 mt-auto">
                                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                  <span>Progreso</span>
                                  <span className="text-primary">{progress}%</span>
                                </div>
                                <Progress
                                  value={progress}
                                  className="h-2 bg-slate-100 dark:bg-slate-800"
                                  indicatorClassName={cn(
                                    "transition-all duration-500",
                                    progress === 100
                                      ? "bg-emerald-500"
                                      : "bg-primary"
                                  )}
                                />
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-0.5">
                                  {format(start, "dd MMM yyyy", { locale: es })} –{" "}
                                  {format(end, "dd MMM yyyy", { locale: es })}
                                </p>
                              </div>
                            </CardContent>

                            {/* Footer Actions */}
                            <div className="px-3 py-2.5 border-t bg-slate-50 dark:bg-muted/20">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800"
                                asChild
                              >
                                <Link href={`/admin/rentals/${rental.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  <span className="text-[11px] font-bold uppercase tracking-wider">
                                    Ver Detalles
                                  </span>
                                </Link>
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Rental Card */}
          <Link href="/admin/rentals/new" className="group block">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary/50 transition-all duration-300 flex items-center justify-center text-center p-8 rounded-2xl cursor-pointer">
              <div className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 flex items-center justify-center transition-colors mb-3">
                  <Briefcase className="w-7 h-7 text-slate-400 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-1">
                  Añadir Nueva Renta
                </h3>
                <p className="text-sm text-slate-500 mb-4 max-w-[260px]">
                  Expande tu portafolio y gestiona un nuevo arriendo fácilmente.
                </p>
                <div className="bg-white dark:bg-card px-6 py-2 rounded-full font-bold text-sm shadow-sm border text-slate-700 dark:text-slate-300 group-hover:border-primary/30 group-hover:text-primary transition-colors">
                  Quick Setup
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
