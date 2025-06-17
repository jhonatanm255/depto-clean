
"use client";
import React, { useState, useEffect } from 'react';
import type { MediaReport } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/core/loading-spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImageIcon, VideoIcon, FileText, CalendarDays, User, ExternalLink, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MediaReportsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  departmentId: string;
  departmentName: string;
}

const getFileIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
  if (contentType.startsWith('video/')) return <VideoIcon className="h-5 w-5 text-purple-500" />;
  return <FileText className="h-5 w-5 text-gray-500" />;
};

const translateReportType = (type: MediaReport['reportType']) => {
  switch (type) {
    case 'before': return 'Antes de Limpiar';
    case 'after': return 'Después de Limpiar';
    case 'incident': return 'Incidente';
    default: return type;
  }
}

export function MediaReportsDialog({ isOpen, onClose, departmentId, departmentName }: MediaReportsDialogProps) {
  const { getMediaReportsForDepartment, getEmployeeProfileById } = useData();
  const [reports, setReports] = useState<MediaReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && departmentId) {
      setIsLoading(true);
      getMediaReportsForDepartment(departmentId)
        .then(data => {
          setReports(data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, departmentId, getMediaReportsForDepartment]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Evidencias Multimedia: {departmentName}</DialogTitle>
          <DialogDescription>
            Archivos subidos para este departamento. Haz clic en el nombre del archivo para verlo.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6"> {/* Negative margin to compensate ScrollArea padding */}
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <LoadingSpinner size={24} />
              <p className="ml-2 text-muted-foreground">Cargando reportes...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
               <AlertTriangle className="h-12 w-12 text-muted-foreground/70 mb-2" />
              <p className="text-muted-foreground">No hay evidencias multimedia para este departamento.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {reports.map((report) => {
                const employee = report.employeeProfileId ? getEmployeeProfileById(report.employeeProfileId) : null;
                return (
                  <li key={report.id} className="p-3 border rounded-md bg-card hover:shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getFileIcon(report.contentType)}
                        <a 
                          href={report.downloadURL} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline truncate"
                          title={report.fileName}
                        >
                          {report.fileName.length > 30 ? `${report.fileName.substring(0,27)}...` : report.fileName}
                        </a>
                      </div>
                      <Badge variant={report.reportType === 'incident' ? 'destructive' : 'secondary'}>
                        {translateReportType(report.reportType)}
                      </Badge>
                    </div>
                    {report.description && <p className="text-sm text-muted-foreground mb-1 italic">"{report.description}"</p>}
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                      <span className="flex items-center"><User className="mr-1 h-3 w-3" /> Subido por: {employee?.name || 'Desconocido'}</span>
                      <span className="flex items-center"><CalendarDays className="mr-1 h-3 w-3" /> Fecha: {new Date(report.uploadedAt).toLocaleDateString('es-CL')} {new Date(report.uploadedAt).toLocaleTimeString('es-CL')}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
