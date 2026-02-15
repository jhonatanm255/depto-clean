
"use client";
import React from 'react';
import type { Department } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, type SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Plus, Trash2, Bed, CheckCircle2, Building2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const departmentSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  accessCode: z.string().min(1, "Se requiere el código de acceso"),
  address: z.string().optional(),
  bedrooms: z.number().min(0).optional().nullable(),
  bathrooms: z.number().min(0).optional().nullable(),
  bedsCount: z.number().min(0).optional().nullable(),
  handTowels: z.number().min(0).optional().nullable(),
  bodyTowels: z.number().min(0).optional().nullable(),
  individualBeds: z.number().min(0).default(0),
  matrimonialBeds: z.number().min(0).default(0),
  kingBeds: z.number().min(0).default(0),
  customFields: z.array(z.object({
    name: z.string().min(1, "Nombre requerido"),
    value: z.string().min(1, "Valor requerido")
  })).optional(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface DepartmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  department?: Department | null;
  defaultCondominiumId?: string;
}

export function DepartmentForm({ isOpen, onClose, department, defaultCondominiumId }: DepartmentFormProps) {
  const { addDepartment, updateDepartment } = useData();

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: department
      ? {
        name: department.name,
        accessCode: department.accessCode ?? '',
        address: department.address ?? '',
        bedrooms: department.bedrooms ?? 0,
        bathrooms: department.bathrooms ?? 0,
        bedsCount: department.bedsCount ?? 0,
        handTowels: department.handTowels ?? 0,
        bodyTowels: department.bodyTowels ?? 0,
        individualBeds: department.beds?.find(b => b.type === 'individual')?.quantity || 0,
        matrimonialBeds: department.beds?.find(b => b.type === 'matrimonial')?.quantity || 0,
        kingBeds: department.beds?.find(b => b.type === 'king')?.quantity || 0,
        customFields: department.customFields || [],
      }
      : {
        name: '',
        accessCode: '',
        address: '',
        bedrooms: 0,
        bathrooms: 0,
        bedsCount: 0,
        handTowels: 0,
        bodyTowels: 0,
        individualBeds: 0,
        matrimonialBeds: 0,
        kingBeds: 0,
        customFields: [],
      },
  });

  const { fields: customFields, append: appendCustom, remove: removeCustom } = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  // Watch bed fields to calculate bedsCount automatically
  const individualBeds = form.watch('individualBeds');
  const matrimonialBeds = form.watch('matrimonialBeds');
  const kingBeds = form.watch('kingBeds');

  React.useEffect(() => {
    const total = (individualBeds || 0) + (matrimonialBeds || 0) + (kingBeds || 0);
    form.setValue('bedsCount', total);
  }, [individualBeds, matrimonialBeds, kingBeds, form]);

  React.useEffect(() => {
    if (isOpen) {
      if (department) {
        form.reset({
          name: department.name,
          accessCode: department.accessCode ?? '',
          address: department.address ?? '',
          bedrooms: department.bedrooms ?? 0,
          bathrooms: department.bathrooms ?? 0,
          bedsCount: department.bedsCount ?? 0,
          handTowels: department.handTowels ?? 0,
          bodyTowels: department.bodyTowels ?? 0,
          individualBeds: department.beds?.find(b => b.type === 'individual')?.quantity || 0,
          matrimonialBeds: department.beds?.find(b => b.type === 'matrimonial')?.quantity || 0,
          kingBeds: department.beds?.find(b => b.type === 'king')?.quantity || 0,
          customFields: (department.customFields && department.customFields.length > 0) ? department.customFields : [],
        });
      } else {
        form.reset({
          name: '',
          accessCode: '',
          address: '',
          bedrooms: 0,
          bathrooms: 0,
          bedsCount: 0,
          handTowels: 0,
          bodyTowels: 0,
          individualBeds: 0,
          matrimonialBeds: 0,
          kingBeds: 0,
          customFields: [{ name: '', value: '' }], // Add one empty field by default for creation
        });
      }
    }
  }, [department, form, isOpen]);

  const onSubmit: SubmitHandler<DepartmentFormData> = async (data) => {
    try {
      const beds = [
        { type: 'individual' as const, quantity: data.individualBeds },
        { type: 'matrimonial' as const, quantity: data.matrimonialBeds },
        { type: 'king' as const, quantity: data.kingBeds },
      ].filter(b => b.quantity > 0);

      if (department) {
        await updateDepartment({
          ...department,
          name: data.name,
          condominiumId: department.condominiumId, // Mantener el condominio existente
          accessCode: data.accessCode,
          address: data.address?.trim() ? data.address : null,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          bedsCount: data.bedsCount,
          handTowels: data.handTowels,
          bodyTowels: data.bodyTowels,
          beds,
          customFields: data.customFields,
        });
      } else {
        await addDepartment({
          name: data.name,
          condominiumId: defaultCondominiumId, // Usar el prop por defecto
          accessCode: data.accessCode,
          address: data.address?.trim() ? data.address : null,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          bedsCount: data.bedsCount,
          handTowels: data.handTowels,
          bodyTowels: data.bodyTowels,
          beds,
          customFields: data.customFields,
        });
      }
      onClose();
    } catch (error) {
      console.error("Submit error in DepartmentForm:", error);
    }
  };

  const handleCloseDialog = () => {
    form.reset(); // Limpiar el formulario al cerrar
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleCloseDialog(); } }}>
      <DialogContent className="sm:max-w-[850px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{department ? 'Editar Departamento' : 'Agregar Nuevo Departamento'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="px-6 h-[calc(90vh-150px)]">
              <div className="py-6 pr-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  {/* Columna Izquierda: Información Básica */}
                  <div className="space-y-4">
                    <div className="space-y-4 bg-muted/20 p-4 rounded-3xl border border-dashed">
                      <FormLabel className="text-sm font-bold uppercase text-muted-foreground flex items-center">
                        <Building2 className="h-4 w-4 mr-2" /> Datos Generales
                      </FormLabel>
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del Departamento</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Apartamento 101" {...field} disabled={form.formState.isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="accessCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Acceso</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: 1234#" {...field} disabled={form.formState.isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dirección (Opcional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Ej: Av. Siempre Viva 742, Springfield" {...field} disabled={form.formState.isSubmitting} rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-dashed">
                      <FormField
                        control={form.control}
                        name="bedrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Habitaciones</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} disabled={form.formState.isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bathrooms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Baños</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} disabled={form.formState.isSubmitting} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Columna Derecha: Camas y Campos Personalizados */}
                  <div className="space-y-6">
                    <div className="bg-primary/5 p-4 rounded-3xl border border-primary/20 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Bed className="h-5 w-5 text-primary" />
                        <FormLabel className="text-base font-bold text-primary m-0 uppercase tracking-tight">Camas y Toallas</FormLabel>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <FormField
                          control={form.control}
                          name="individualBeds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Indiv.</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} disabled={form.formState.isSubmitting} className="bg-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="matrimonialBeds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Matrim.</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} disabled={form.formState.isSubmitting} className="bg-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="kingBeds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">King</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} disabled={form.formState.isSubmitting} className="bg-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-primary/10">
                        <FormField
                          control={form.control}
                          name="handTowels"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">T. Mano</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} disabled={form.formState.isSubmitting} className="bg-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bodyTowels"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">T. Cuerpo</FormLabel>
                              <FormControl>
                                <Input type="number" min={0} {...field} value={field.value ?? 0} onChange={e => field.onChange(parseInt(e.target.value) || 0)} disabled={form.formState.isSubmitting} className="bg-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bedsCount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[10px] uppercase font-bold text-primary">Total</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input type="number" {...field} value={field.value ?? 0} readOnly disabled className="bg-primary/10 border-primary/30 font-bold text-primary text-center px-1" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 bg-muted/20 p-4 rounded-3xl border border-dashed">
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-sm font-bold uppercase text-muted-foreground flex items-center">
                          <Plus className="h-4 w-4 mr-2" /> Camas Extras / Otros
                        </FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => appendCustom({ name: '', value: '' })}
                          disabled={form.formState.isSubmitting}
                          className="h-7 px-2 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Añadir
                        </Button>
                      </div>

                      {customFields.map((field, index) => (
                        <div key={field.id} className="flex gap-2 items-end group bg-white p-2 rounded-2xl border shadow-sm">
                          <FormField
                            control={form.control}
                            name={`customFields.${index}.name`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder="Nombre" {...field} value={field.value ?? ''} disabled={form.formState.isSubmitting} className="h-8 text-xs" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`customFields.${index}.value`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input placeholder="Valor" {...field} value={field.value ?? ''} disabled={form.formState.isSubmitting} className="h-8 text-xs" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive h-8 w-8 shrink-0"
                            onClick={() => removeCustom(index)}
                            disabled={form.formState.isSubmitting}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="p-6 pt-4 border-t gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={form.formState.isSubmitting}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <LoadingSpinner size={16} className="mr-2" />}
                {form.formState.isSubmitting ? (department ? 'Guardando...' : 'Agregando...') : (department ? 'Guardar Cambios' : 'Agregar Departamento')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent >
    </Dialog >
  );
}
