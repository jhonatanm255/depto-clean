"use client";
import React from 'react';
import type { Condominium } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { Building2, MapPin, ImagePlus, X } from 'lucide-react';
import { supabase, SUPABASE_MEDIA_BUCKET } from '@/lib/supabase';

const condominiumSchema = z.object({
    name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    address: z.string().optional(),
});

type CondominiumFormData = z.infer<typeof condominiumSchema>;

interface CondominiumFormProps {
    isOpen: boolean;
    onClose: () => void;
    condominium?: Condominium | null;
}

export function CondominiumForm({ isOpen, onClose, condominium }: CondominiumFormProps) {
    const { addCondominium, updateCondominium } = useData();
    const { currentUser } = useAuth();
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);
    const [existingImageUrl, setExistingImageUrl] = React.useState<string | null>(null);
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const form = useForm<CondominiumFormData>({
        resolver: zodResolver(condominiumSchema),
        defaultValues: {
            name: '',
            address: '',
        },
    });

    React.useEffect(() => {
        if (isOpen) {
            if (condominium) {
                form.reset({
                    name: condominium.name,
                    address: condominium.address ?? '',
                });
                setExistingImageUrl(condominium.imageUrl ?? null);
                setImagePreview(condominium.imageUrl ?? null);
            } else {
                form.reset({
                    name: '',
                    address: '',
                });
                setExistingImageUrl(null);
                setImagePreview(null);
            }
            setImageFile(null);
        }
    }, [condominium, form, isOpen]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
        setExistingImageUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const uploadImage = async (file: File): Promise<string> => {
        if (!currentUser?.companyId) throw new Error('No company ID');

        const uniqueFileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const storagePath = `companies/${currentUser.companyId}/condominiums/${uniqueFileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(SUPABASE_MEDIA_BUCKET)
            .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) throw uploadError;
        if (!uploadData?.path) throw new Error('No se pudo subir la imagen.');

        const { data: urlData } = supabase.storage
            .from(SUPABASE_MEDIA_BUCKET)
            .getPublicUrl(uploadData.path);

        return urlData.publicUrl;
    };

    const onSubmit: SubmitHandler<CondominiumFormData> = async (data) => {
        try {
            let imageUrl: string | null = existingImageUrl;

            if (imageFile) {
                setUploading(true);
                imageUrl = await uploadImage(imageFile);
                setUploading(false);
            } else if (!imagePreview) {
                // User removed the image
                imageUrl = null;
            }

            if (condominium) {
                await updateCondominium({
                    ...condominium,
                    name: data.name,
                    address: data.address?.trim() ? data.address : null,
                    imageUrl,
                });
            } else {
                await addCondominium({
                    name: data.name,
                    address: data.address?.trim() ? data.address : null,
                    imageUrl,
                });
            }
            onClose();
        } catch (error) {
            setUploading(false);
            console.error("Submit error in CondominiumForm:", error);
        }
    };

    const handleCloseDialog = () => {
        form.reset();
        setImageFile(null);
        setImagePreview(null);
        setExistingImageUrl(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleCloseDialog(); } }}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{condominium ? 'Editar Condominio' : 'Agregar Nuevo Condominio'}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-4 py-4">
                            {/* Image Upload */}
                            <div className="space-y-2">
                                <FormLabel>Foto del Condominio (Opcional)</FormLabel>
                                <div className="relative">
                                    {imagePreview ? (
                                        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-border bg-muted">
                                            <img
                                                src={imagePreview}
                                                alt="Vista previa"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="text-xs"
                                                >
                                                    <ImagePlus className="w-3.5 h-3.5 mr-1" /> Cambiar
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={handleRemoveImage}
                                                    className="text-xs"
                                                >
                                                    <X className="w-3.5 h-3.5 mr-1" /> Quitar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full h-36 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-muted/30 hover:bg-slate-100 dark:hover:bg-muted/50 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                <ImagePlus className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                                            </div>
                                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                                Haz clic para subir una foto
                                            </span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                JPG, PNG o WebP
                                            </span>
                                        </button>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre del Condominio</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="Ej: Torres del Sol" {...field} className="pl-9" disabled={form.formState.isSubmitting} />
                                            </div>
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
                                            <div className="relative">
                                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                <Textarea placeholder="Ej: Av. Principal 123" {...field} className="pl-9 min-h-[80px]" disabled={form.formState.isSubmitting} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={handleCloseDialog} disabled={form.formState.isSubmitting || uploading}>Cancelar</Button>
                            </DialogClose>
                            <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
                                {(form.formState.isSubmitting || uploading) && <LoadingSpinner size={16} className="mr-2" />}
                                {uploading ? 'Subiendo imagen...' : form.formState.isSubmitting ? (condominium ? 'Guardando...' : 'Agregando...') : (condominium ? 'Guardar Cambios' : 'Crear Condominio')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
