"use client";

import React, { useState, useMemo } from "react";
import type { Rental } from "@/lib/types";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { KeyRound, PlusCircle, Search, Calendar, User, Building2 } from "lucide-react";
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
import { format } from "date-fns";
import { es } from "date-fns/locale";

const RENTAL_STATUS_LABELS: Record<Rental["rentalStatus"], string> = {
  reserved: "Reservada",
  active: "Activa",
  completed: "Completada",
  cancelled: "Cancelada",
};

const PAYMENT_STATUS_LABELS: Record<Rental["paymentStatus"], string> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagado",
  refunded: "Reembolsado",
};

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

  const getDepartmentName = (departmentId: string) =>
    departments.find((d) => d.id === departmentId)?.name ?? "—";

  if (dataLoading && rentals.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando rentas...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground flex items-center gap-2">
            <KeyRound className="h-7 w-7 text-muted-foreground" />
            Gestión de Rentas
          </h1>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link href="/admin/rentals/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Nueva Renta
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">
          Administra las reservas y rentas de departamentos. Check-in, check-out y pagos.
        </p>
      </header>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por arrendatario o referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
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

      {!dataLoading && rentals.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-card shadow-sm mt-6">
          <KeyRound className="mx-auto h-16 w-16 text-muted-foreground/70" />
          <p className="mt-4 text-xl font-semibold text-muted-foreground">
            No hay rentas registradas.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Crea tu primera renta para gestionar reservas y check-ins.
          </p>
          <Button asChild className="mt-6">
            <Link href="/admin/rentals/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Nueva Renta
            </Link>
          </Button>
        </div>
      ) : !dataLoading && filteredRentals.length === 0 ? (
        <div className="text-center py-10 border rounded-lg bg-card shadow-sm mt-6">
          <p className="text-muted-foreground">No hay rentas que coincidan con el filtro.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRentals.map((rental) => (
            <Link key={rental.id} href={`/admin/rentals/${rental.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{rental.tenantName}</span>
                      <Badge variant={rental.rentalStatus === "active" ? "default" : "secondary"}>
                        {RENTAL_STATUS_LABELS[rental.rentalStatus]}
                      </Badge>
                      <Badge variant="outline">
                        {PAYMENT_STATUS_LABELS[rental.paymentStatus]}
                      </Badge>
                    </div>
                    <span className="text-lg font-headline text-primary">
                      {rental.currency ?? "USD"} {Number(rental.totalAmount).toFixed(2)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" />
                      {getDepartmentName(rental.departmentId)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(rental.checkInDate), "d MMM yyyy", { locale: es })} –{" "}
                      {format(new Date(rental.checkOutDate), "d MMM yyyy", { locale: es })}
                    </span>
                    {rental.bookingReference && (
                      <span>Ref: {rental.bookingReference}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
