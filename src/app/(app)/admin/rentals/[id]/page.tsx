"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Rental, RentalPayment } from "@/lib/types";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  KeyRound,
  ArrowLeft,
  User,
  Calendar,
  Building2,
  DollarSign,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/core/loading-spinner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RentalForm } from "@/components/rental/rental-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { rentals, departments, getDepartmentById, updateRentalStatus, deleteRental, addRentalPayment, getRentalPayments } = useData();
  const [rental, setRental] = useState<Rental | null>(null);
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentType, setPaymentType] = useState("rent");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  useEffect(() => {
    const r = rentals.find((x) => x.id === id) ?? null;
    setRental(r);
  }, [rentals, id]);

  useEffect(() => {
    if (!id) return;
    getRentalPayments(id).then(setPayments);
  }, [id, getRentalPayments, rental?.amountPaid]);

  const department = rental ? getDepartmentById(rental.departmentId) : null;
  const loading = !rental && rentals.length > 0;

  const handleDelete = async () => {
    if (!rental) return;
    await deleteRental(rental.id);
    setDeleteDialogOpen(false);
    router.push("/admin/rentals");
  };

  const handleAddPayment = async () => {
    if (!rental || !paymentAmount || Number(paymentAmount) <= 0) return;
    setPaymentSubmitting(true);
    try {
      await addRentalPayment({
        rentalId: rental.id,
        amount: Number(paymentAmount),
        paymentMethod,
        paymentType,
      });
      setPaymentAmount("");
      setPaymentDialogOpen(false);
      const updated = await getRentalPayments(rental.id);
      setPayments(updated);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex flex-col items-center justify-center min-h-[200px]">
        <LoadingSpinner size={32} />
        <p className="mt-4 text-muted-foreground">Cargando renta...</p>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-muted-foreground">Renta no encontrada.</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/admin/rentals">Volver a Rentas</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/rentals">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold font-headline text-foreground flex items-center">
            <KeyRound className="mr-2 h-6 w-6 text-primary" />
            Renta: {rental.tenantName}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {rental.rentalStatus === "reserved" && (
            <Button
              onClick={() => updateRentalStatus(rental.id, "active")}
            >
              Check-in
            </Button>
          )}
          {rental.rentalStatus === "active" && (
            <Button
              onClick={() => updateRentalStatus(rental.id, "completed")}
            >
              Check-out
            </Button>
          )}
          {!["completed", "cancelled"].includes(rental.rentalStatus) && (
            <>
              <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </Button>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Registrar pago
              </Button>
            </>
          )}
          {!["completed", "cancelled"].includes(rental.rentalStatus) && (
            <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Arrendatario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{rental.tenantName}</p>
            {rental.tenantEmail && <p>{rental.tenantEmail}</p>}
            {rental.tenantPhone && <p>{rental.tenantPhone}</p>}
            {rental.tenantIdNumber && <p>Doc: {rental.tenantIdNumber}</p>}
            {(rental.tenantEmergencyContact || rental.tenantEmergencyPhone) && (
              <p className="text-muted-foreground">
                Emergencia: {rental.tenantEmergencyContact ?? ""} {rental.tenantEmergencyPhone ?? ""}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Estancia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Departamento:</strong> {department?.name ?? rental.departmentId}
            </p>
            <p className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Entrada: {format(new Date(rental.checkInDate), "d MMM yyyy HH:mm", { locale: es })}
            </p>
            <p className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Salida: {format(new Date(rental.checkOutDate), "d MMM yyyy HH:mm", { locale: es })}
            </p>
            {rental.actualCheckIn && (
              <p className="text-muted-foreground">
                Check-in real: {format(new Date(rental.actualCheckIn), "d MMM yyyy HH:mm", { locale: es })}
              </p>
            )}
            {rental.actualCheckOut && (
              <p className="text-muted-foreground">
                Check-out real: {format(new Date(rental.actualCheckOut), "d MMM yyyy HH:mm", { locale: es })}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge>{RENTAL_STATUS_LABELS[rental.rentalStatus]}</Badge>
              <Badge variant="outline">{PAYMENT_STATUS_LABELS[rental.paymentStatus]}</Badge>
              {rental.bookingReference && <Badge variant="secondary">{rental.bookingReference}</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Finanzas
            </CardTitle>
            {rental.paymentStatus !== "paid" && (
              <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Pago
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-semibold">
                {rental.currency ?? "USD"} {Number(rental.totalAmount).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pagado</p>
              <p className="text-xl font-semibold text-green-600">
                {rental.currency ?? "USD"} {Number(rental.amountPaid ?? 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendiente</p>
              <p className="text-xl font-semibold">
                {rental.currency ?? "USD"}{" "}
                {(Number(rental.totalAmount) - Number(rental.amountPaid ?? 0)).toFixed(2)}
              </p>
            </div>
          </div>
          {payments.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Historial de pagos</p>
              <ul className="space-y-1 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex justify-between">
                    <span>
                      {format(new Date(p.paymentDate), "d MMM yyyy", { locale: es })} – {p.paymentMethod} – {p.paymentType}
                    </span>
                    <span className="font-medium">
                      {p.currency ?? "USD"} {Number(p.amount).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {(rental.notes || rental.specialRequests || rental.cleaningNotes) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {rental.specialRequests && <p><strong>Solicitudes:</strong> {rental.specialRequests}</p>}
            {rental.cleaningNotes && <p><strong>Limpieza:</strong> {rental.cleaningNotes}</p>}
            {rental.notes && <p><strong>Internas:</strong> {rental.notes}</p>}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar renta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la renta de {rental.tenantName} y los datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar renta</DialogTitle>
          </DialogHeader>
          <RentalForm
            rental={rental}
            onSuccess={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Monto</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={paymentType} onValueChange={setPaymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Renta</SelectItem>
                  <SelectItem value="deposit">Depósito</SelectItem>
                  <SelectItem value="cleaning">Limpieza</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddPayment} disabled={paymentSubmitting || !paymentAmount || Number(paymentAmount) <= 0}>
              {paymentSubmitting ? <LoadingSpinner size={20} className="mr-2" /> : null}
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
