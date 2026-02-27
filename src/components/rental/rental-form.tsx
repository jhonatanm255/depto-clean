"use client";

import React from "react";
import type { Rental } from "@/lib/types";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingSpinner } from "@/components/core/loading-spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

const rentalFormSchema = z
  .object({
    departmentId: z.string().min(1, "Selecciona un departamento"),
    tenantName: z.string().min(2, "Nombre del arrendatario requerido"),
    tenantEmail: z.string().email("Email inválido").optional().or(z.literal("")),
    tenantPhone: z.string().optional(),
    tenantIdNumber: z.string().optional(),
    tenantEmergencyContact: z.string().optional(),
    tenantEmergencyPhone: z.string().optional(),
    checkInDate: z.string().min(1, "Fecha de entrada requerida"),
    checkOutDate: z.string().min(1, "Fecha de salida requerida"),
    totalAmount: z.coerce.number().min(0, "Monto debe ser ≥ 0"),
    depositAmount: z.coerce.number().min(0).optional(),
    numberOfGuests: z.coerce.number().int().min(1, "Al menos 1 huésped"),
    numberOfAdults: z.coerce.number().int().min(0).optional(),
    numberOfChildren: z.coerce.number().int().min(0).optional(),
    specialRequests: z.string().optional(),
    bookingSource: z.string().optional(),
    bookingReference: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.checkInDate ||
      !data.checkOutDate ||
      new Date(data.checkOutDate) > new Date(data.checkInDate),
    { message: "La salida debe ser después de la entrada", path: ["checkOutDate"] }
  );

type RentalFormData = z.infer<typeof rentalFormSchema>;

interface RentalFormProps {
  onSuccess: () => void;
  rental?: Rental | null;
}

export function RentalForm({ onSuccess, rental }: RentalFormProps) {
  const { company, departments, addRental, updateRental } = useData();

  const form = useForm<RentalFormData>({
    resolver: zodResolver(rentalFormSchema),
    defaultValues: rental
      ? {
          departmentId: rental.departmentId,
          tenantName: rental.tenantName,
          tenantEmail: rental.tenantEmail ?? "",
          tenantPhone: rental.tenantPhone ?? "",
          tenantIdNumber: rental.tenantIdNumber ?? "",
          tenantEmergencyContact: rental.tenantEmergencyContact ?? "",
          tenantEmergencyPhone: rental.tenantEmergencyPhone ?? "",
          checkInDate: rental.checkInDate.slice(0, 16),
          checkOutDate: rental.checkOutDate.slice(0, 16),
          totalAmount: rental.totalAmount,
          depositAmount: rental.depositAmount ?? 0,
          numberOfGuests: rental.numberOfGuests,
          numberOfAdults: rental.numberOfAdults ?? undefined,
          numberOfChildren: rental.numberOfChildren ?? undefined,
          specialRequests: rental.specialRequests ?? "",
          bookingSource: rental.bookingSource ?? "",
          bookingReference: rental.bookingReference ?? "",
          notes: rental.notes ?? "",
        }
      : {
          departmentId: "",
          tenantName: "",
          tenantEmail: "",
          tenantPhone: "",
          tenantIdNumber: "",
          tenantEmergencyContact: "",
          tenantEmergencyPhone: "",
          checkInDate: "",
          checkOutDate: "",
          totalAmount: 0,
          depositAmount: 0,
          numberOfGuests: 1,
          numberOfAdults: undefined,
          numberOfChildren: undefined,
          specialRequests: "",
          bookingSource: "",
          bookingReference: "",
          notes: "",
        },
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: RentalFormData) => {
    if (rental) {
      await updateRental({
        ...rental,
        departmentId: data.departmentId,
        tenantName: data.tenantName,
        tenantEmail: data.tenantEmail || null,
        tenantPhone: data.tenantPhone || null,
        tenantIdNumber: data.tenantIdNumber || null,
        tenantEmergencyContact: data.tenantEmergencyContact || null,
        tenantEmergencyPhone: data.tenantEmergencyPhone || null,
        checkInDate: new Date(data.checkInDate).toISOString(),
        checkOutDate: new Date(data.checkOutDate).toISOString(),
        totalAmount: data.totalAmount,
        depositAmount: data.depositAmount ?? 0,
        numberOfGuests: data.numberOfGuests,
        numberOfAdults: data.numberOfAdults ?? null,
        numberOfChildren: data.numberOfChildren ?? null,
        specialRequests: data.specialRequests || null,
        bookingSource: data.bookingSource || null,
        bookingReference: data.bookingReference || null,
        notes: data.notes || null,
      });
    } else {
      if (!company?.id) throw new Error("No hay empresa asociada");
      await addRental({
        companyId: company.id,
        departmentId: data.departmentId,
        tenantName: data.tenantName,
        tenantEmail: data.tenantEmail || null,
        tenantPhone: data.tenantPhone || null,
        tenantIdNumber: data.tenantIdNumber || null,
        tenantEmergencyContact: data.tenantEmergencyContact || null,
        tenantEmergencyPhone: data.tenantEmergencyPhone || null,
        rentalStatus: "reserved",
        checkInDate: new Date(data.checkInDate).toISOString(),
        checkOutDate: new Date(data.checkOutDate).toISOString(),
        totalAmount: data.totalAmount,
        depositAmount: data.depositAmount ?? 0,
        paymentStatus: "pending",
        amountPaid: 0,
        currency: "USD",
        numberOfGuests: data.numberOfGuests,
        numberOfAdults: data.numberOfAdults ?? null,
        numberOfChildren: data.numberOfChildren ?? null,
        specialRequests: data.specialRequests || null,
        bookingSource: data.bookingSource || null,
        bookingReference: data.bookingReference || null,
        notes: data.notes || null,
      });
    }
    onSuccess();
  };

  const availableDepartments = departments.filter((d) => d.isRentable !== false);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!rental}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableDepartments.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No hay departamentos disponibles
                        </SelectItem>
                      ) : (
                        availableDepartments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                            {d.rentalStatus && d.rentalStatus !== "available"
                              ? ` (${d.rentalStatus})`
                              : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tenantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del arrendatario *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenantEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tenantPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+56 9 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenantIdNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RUT / Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tenantEmergencyContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contacto de emergencia</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tenantEmergencyPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono emergencia</FormLabel>
                    <FormControl>
                      <Input placeholder="Teléfono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkInDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de entrada *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="checkOutDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de salida *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto total *</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="depositAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depósito</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="numberOfGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total huéspedes *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfAdults"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adultos</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numberOfChildren"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niños</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bookingSource"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origen de la reserva</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Airbnb, directo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bookingReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia de reserva</FormLabel>
                    <FormControl>
                      <Input placeholder="Código o ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="specialRequests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solicitudes especiales</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ej. llegada tarde, cuna" {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas internas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notas para el equipo" {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoadingSpinner size={20} className="mr-2" />
            ) : null}
            {rental ? "Guardar cambios" : "Crear renta"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
