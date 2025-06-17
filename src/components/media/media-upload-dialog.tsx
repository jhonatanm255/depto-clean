
"use client";
import React, { useState } from 'react';
import type { MediaReportType } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { useForm, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { UploadCloud, FileImage, Video } from 'lucide-react';

const mediaReportSchema = z.object({
  file: z.instanceof(FileList).refine(files => files.length > 0, "Se requiere un archivo."),
  reportType: z.enum(['before', 'after', 'incident'], { required_error: "Se requiere el tipo de reporte." }),
  description: z.string().optional(),
});

type MediaReportFormData = z.infer<typeof mediaReportSchema>;

interface MediaUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
}

export function MediaUploadDialog({ isOpen, onClose, departmentId }: MediaUploadDialogProps) {
  const { addMediaReport } = useData();
  const { currentUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const form = useForm<MediaReportFormData>({
    resolver: zodResolver(mediaReportSchema),
    defaultValues: {
      reportType: 'incident',
      description: '',
    },
  });

  const onSubmit: SubmitHandler<MediaReportFormData> = async (data) => {
    if (!currentUser?.employeeProfileId || !data.file || data.file.length === 0) {
      form.setError("file", { type: "manual", message: "Error de usuario o archivo." });
      return;
    }
    const fileToUpload = data.file[0];
    setIsUploading(true);
    try {
      await addMediaReport(
        departmentId,
        currentUser.employeeProfileId,
        fileToUpload,
        data.reportType as MediaReportType,
        data.description
      );
      form.reset();
      setFileName(null);
      onClose();
    } catch (error) {
      console.error("Error en submit de MediaUploadDialog:", error);
      // El toast de error ya lo maneja DataContext
    } finally {
      setIsUploading(false);
    }
  };

  const handleCloseDialog = () => {
    form.reset();
    setFileName(null);
    setIsUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UploadCloud className="mr-2 h-6 w-6 text-primary" />
            Subir Evidencia Multimedia
          </DialogTitle>
          <DialogDescription>
            Selecciona una foto o video para adjuntar al reporte del departamento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Archivo (Foto o Video)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => {
                          onChange(e.target.files);
                          setFileName(e.target.files && e.target.files.length > 0 ? e.target.files[0].name : null);
                        }}
                        {...fieldProps}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                        disabled={isUploading}
                      />
                    </div>
                  </FormControl>
                  {fileName && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      {fileName.match(/\.(jpeg|jpg|gif|png)$/) ? <FileImage className="h-4 w-4 mr-1 text-primary" /> : <Video className="h-4 w-4 mr-1 text-primary" />}
                      Archivo seleccionado: {fileName}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Reporte</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isUploading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="before">Antes de Limpiar</SelectItem>
                      <SelectItem value="after">Después de Limpiar</SelectItem>
                      <SelectItem value="incident">Reporte de Incidente</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe el incidente o añade notas..." {...field} disabled={isUploading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-wrap gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={isUploading}>Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isUploading || !form.formState.isValid}>
                {isUploading && <LoadingSpinner size={16} className="mr-2" />}
                {isUploading ? 'Subiendo...' : 'Subir Archivo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
