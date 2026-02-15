
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
  taskId?: string; // Opcional: para filtrar por tarea específica
}

const getFileIcon = (contentType?: string | null) => {
  if (contentType && contentType.startsWith('image/')) return <ImageIcon className="h-5 w-5 text-primary" />;
  if (contentType && contentType.startsWith('video/')) return <VideoIcon className="h-5 w-5 text-purple-500" />;
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

export function MediaReportsDialog({ isOpen, onClose, departmentId, departmentName, taskId }: MediaReportsDialogProps) {
  const { getMediaReportsForDepartment, getEmployeeProfileById, tasks } = useData();
  const [reports, setReports] = useState<MediaReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && departmentId) {
      console.log(`[MediaReportsDialog] Abriendo para departmentId: ${departmentId}, taskId: ${taskId}`);
      setIsLoading(true);
      getMediaReportsForDepartment(departmentId)
        .then(data => {
          // Filtrar por taskId si se proporciona
          const filtered = taskId 
            ? data.filter(r => r.taskId === taskId)
            : data;
          setReports(filtered);
        })
        .catch(error => {
          console.error(`[MediaReportsDialog] Error al obtener reportes para ${departmentId}:`, error);
        })
        .finally(() => setIsLoading(false));
    } else if (!isOpen) {
      setReports([]);
      setIsLoading(false);
    }
  }, [isOpen, departmentId, taskId, getMediaReportsForDepartment]);

  // Agrupar reportes si no estamos filtrando por una tarea específica
  const groupedReports = React.useMemo(() => {
    if (taskId) return null; // No agrupar si ya estamos viendo una tarea específica

    const groups: Record<string, MediaReport[]> = {};
    
    reports.forEach(report => {
      let key = 'Sin Asignar';
      
      if (report.taskId) {
        const task = tasks.find(t => t.id === report.taskId);
        if (task) {
          const date = new Date(task.assignedAt).toLocaleDateString('es-CL');
          key = `Limpieza del ${date}`;
        } else {
          key = 'Tarea Desconocida';
        }
      } else {
        // Fallback para reportes antiguos sin taskId: agrupar por fecha de subida
        const date = new Date(report.uploadedAt).toLocaleDateString('es-CL');
        key = `Subido el ${date}`;
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(report);
    });

    // Ordenar grupos por fecha (descendente es difícil con strings, pero las claves tienen fecha... 
    // mejor ordenamos por el timestamp del primer elemento de cada grupo)
    return Object.entries(groups).sort(([, a], [, b]) => {
      const dateA = new Date(a[0].uploadedAt).getTime();
      const dateB = new Date(b[0].uploadedAt).getTime();
      return dateB - dateA;
    });
  }, [reports, taskId, tasks]);

  if (!isOpen) return null;

  const renderReportItem = (report: MediaReport) => {
    const employee = report.employeeId ? getEmployeeProfileById(report.employeeId) : null;
    const fileName = report.fileName ?? 'Archivo sin nombre';
    const downloadUrl = report.downloadUrl ?? undefined;
    const contentType = report.contentType ?? 'application/octet-stream';

    return (
      <li key={report.id} className="p-3 border rounded-md bg-card hover:shadow-sm">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {getFileIcon(contentType)}
            {downloadUrl ? (
              <a 
                href={downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline truncate"
                title={fileName}
              >
                {fileName.length > 30 ? `${fileName.substring(0,27)}...` : fileName}
              </a>
            ) : (
              <span className="font-medium text-muted-foreground truncate" title={fileName}>
                {fileName}
              </span>
            )}
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
        {downloadUrl && (
          <a 
            href={downloadUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline flex items-center mt-1"
          >
            <ExternalLink className="mr-1 h-3 w-3" /> Ver archivo
          </a>
        )}
      </li>
    );
  };

  return (
            <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
              <DialogContent className="sm:max-w-lg md:max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Reportes de Limpieza: {departmentName}</DialogTitle>
                  <DialogDescription>
                    {taskId 
                      ? "Registros visuales de esta sesión de limpieza." 
                      : "Historial completo de registros visuales agrupados por limpieza."}
                  </DialogDescription>
                </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <LoadingSpinner size={24} />
              <p className="ml-2 text-muted-foreground">Cargando registros...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
               <AlertTriangle className="h-12 w-12 text-muted-foreground/70 mb-2" />
              <p className="text-muted-foreground">No hay registros visuales disponibles.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedReports ? (
                // Vista agrupada (Historial completo)
                groupedReports.map(([groupName, groupReports]) => (
                  <div key={groupName} className="space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground bg-muted/50 p-2 rounded-md sticky top-0 backdrop-blur-sm z-10">
                      {groupName}
                    </h3>
                    <ul className="space-y-3 pl-2">
                      {groupReports.map(renderReportItem)}
                    </ul>
                  </div>
                ))
              ) : (
                // Vista simple (Filtrada por tarea)
                <ul className="space-y-3">
                  {reports.map(renderReportItem)}
                </ul>
              )}
            </div>
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
