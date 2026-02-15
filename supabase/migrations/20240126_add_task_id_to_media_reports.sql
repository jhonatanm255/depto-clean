-- Agregar columna task_id a la tabla media_reports
ALTER TABLE media_reports 
ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Crear índice para mejorar el rendimiento de las consultas por task_id
CREATE INDEX idx_media_reports_task_id ON media_reports(task_id);

-- Comentario para documentar el cambio
COMMENT ON COLUMN media_reports.task_id IS 'Referencia a la tarea de limpieza específica a la que pertenece este reporte multimedia.';
