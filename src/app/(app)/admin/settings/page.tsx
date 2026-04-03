"use client";

import { useState, useEffect } from "react";
import { useData } from "@/contexts/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Upload, Loader2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { company, updateCompany } = useData();
  const [displayName, setDisplayName] = useState(company?.displayName || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sincronizar el estado local cuando cambian los datos del contexto
  useEffect(() => {
    if (company?.displayName) {
      setDisplayName(company.displayName);
    }
  }, [company]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Archivo demasiado grande",
        description: "El tamaño máximo permitido es de 2MB.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${company.id}/logo-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      // Actualizar registro en la base de datos
      await updateCompany({ logoUrl: publicUrl });
      
      toast({
        title: "Logo actualizado",
        description: "El logo de tu empresa se ha cargado correctamente.",
      });
    } catch (error: any) {
      console.error("Error al subir logo:", error);
      toast({
        variant: "destructive",
        title: "Error al subir",
        description: error.message || "No se pudo cargar la imagen.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({
        variant: "destructive",
        title: "Campo requerido",
        description: "El nombre comercial no puede estar vacío.",
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateCompany({ displayName: displayName.trim() });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!company) return;
    try {
      await updateCompany({ logoUrl: null });
      toast({
        title: "Logo eliminado",
        description: "Se ha restaurado el icono por defecto.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el logo.",
      });
    }
  };

  return (
    <div className="container max-w-4xl py-6 sm:py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Configuración de Empresa</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Personaliza la identidad y preferencias de tu organización.</p>
      </div>

      <div className="grid gap-6">
        <Card className="border shadow-sm overflow-hidden bg-card">
          <CardHeader className="border-b bg-muted/30 py-4 sm:py-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Identidad de Marca
            </CardTitle>
            <CardDescription>Define cómo verán tus empleados la empresa en la aplicación.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-8 space-y-8">
            {/* Sección de Logo */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Logo Corporativo</Label>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
                <div className="relative group">
                  <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl bg-muted/50 flex items-center justify-center overflow-hidden border-2 border-dashed border-border group-hover:border-primary/50 transition-all duration-300">
                    {company?.logoUrl ? (
                      <img src={company.logoUrl} alt="Logo de empresa" className="h-full w-full object-contain p-3" />
                    ) : (
                      <Building2 className="h-12 w-12 text-muted-foreground/30" />
                    )}
                    
                    {isUploading && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  
                  <label 
                    htmlFor="logo-upload" 
                    className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-4 border-background cursor-pointer hover:scale-110 active:scale-95 transition-all"
                    title="Subir logo"
                  >
                    <Upload className="h-5 w-5" />
                  </label>
                  
                  <input 
                    id="logo-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleLogoUpload}
                    disabled={isUploading}
                  />
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <h3 className="font-semibold text-foreground">Imagen del Perfil</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sube el logo de tu empresa en formato PNG, JPG o SVG.<br className="hidden sm:block" />
                    Se recomienda un fondo transparente.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                      className="cursor-pointer"
                    >
                      <label htmlFor="logo-upload">Cambiar imagen</label>
                    </Button>
                    {company?.logoUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={handleDeleteLogo}
                      >
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* Sección de Nombre */}
            <div className="space-y-4 pt-2">
              <div className="grid gap-2">
                <Label htmlFor="display-name" className="text-base font-semibold">Nombre Comercial</Label>
                <p className="text-sm text-muted-foreground">Este es el nombre que aparecerá en el encabezado de todos tus empleados.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                <Input 
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej: CleanSweep Pro"
                  className="h-11"
                />
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving || !displayName.trim() || displayName === company?.displayName}
                  className="h-11 px-6 shadow-sm whitespace-nowrap"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Guardar Nombre
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Informativa */}
        <div className="p-4 bg-primary/5 border border-primary/10 rounded-lg">
          <p className="text-xs sm:text-sm text-primary/80 text-center italic">
            "Los cambios en la identidad visual se reflejan instantáneamente para todos los usuarios conectados."
          </p>
        </div>
      </div>
    </div>
  );
}
