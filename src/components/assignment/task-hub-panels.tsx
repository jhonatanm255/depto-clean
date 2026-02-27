"use client";

import React, { useState, useMemo } from "react";
import type { Department, EmployeeProfile } from "@/lib/types";
import { useData } from "@/contexts/data-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, AlertCircle, Filter, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/core/loading-spinner";
import { toast } from "@/hooks/use-toast";

const EST_MINUTES_PER_UNIT = 30;

interface TaskHubPanelsProps {
  departments: Department[];
  employees: EmployeeProfile[];
  dataLoading: boolean;
}

export function TaskHubPanels({ departments, employees, dataLoading }: TaskHubPanelsProps) {
  const { assignTask, getTasksForEmployee } = useData();
  const [selectedDeptIds, setSelectedDeptIds] = useState<Set<string>>(new Set());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [staffSearch, setStaffSearch] = useState("");
  const [assigning, setAssigning] = useState(false);

  const unassignedDepartments = useMemo(() => {
    return departments
      .filter((d) => d.status === "pending" && !d.assignedTo)
      .filter((d) => !urgentOnly || d.priority === "high")
      .sort((a, b) => (a.priority === "high" ? -1 : b.priority === "high" ? 1 : 0));
  }, [departments, urgentOnly]);

  const filteredStaff = useMemo(() => {
    return employees
      .filter((e) => {
        const name = (e.name ?? "").toLowerCase();
        const email = (e.email ?? "").toLowerCase();
        const q = staffSearch.toLowerCase().trim();
        return !q || name.includes(q) || email.includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, staffSearch]);

  const toggleDept = (id: string) => {
    setSelectedDeptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllDepts = () => {
    if (selectedDeptIds.size === unassignedDepartments.length) {
      setSelectedDeptIds(new Set());
    } else {
      setSelectedDeptIds(new Set(unassignedDepartments.map((d) => d.id)));
    }
  };

  const clearSelection = () => {
    setSelectedDeptIds(new Set());
    setSelectedEmployeeId(null);
  };

  const handleAssignAndConfirm = async () => {
    if (selectedDeptIds.size === 0 || !selectedEmployeeId) {
      toast({
        variant: "destructive",
        title: "Selección incompleta",
        description: "Elige al menos un departamento y una empleada.",
      });
      return;
    }
    setAssigning(true);
    try {
      const ids = Array.from(selectedDeptIds);
      for (const deptId of ids) {
        await assignTask(deptId, selectedEmployeeId, "normal");
      }
      toast({
        title: "Tareas asignadas",
        description: `${ids.length} departamento(s) asignados correctamente.`,
      });
      clearSelection();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error al asignar",
        description: "No se pudieron asignar todas las tareas.",
      });
    } finally {
      setAssigning(false);
    }
  };

  const estimatedMinutes = selectedDeptIds.size * EST_MINUTES_PER_UNIT;
  const estimatedDisplay =
    estimatedMinutes < 60
      ? `${estimatedMinutes}m`
      : `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`;

  if (dataLoading && departments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size={32} />
        <span className="ml-2 text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-16rem)] min-h-[400px]">
      {/* Panel izquierdo: Unidades sin asignar */}
      <Card className="flex flex-col border border-border shadow-sm overflow-hidden">
        <CardHeader className="py-4 px-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Unidades sin asignar
          </CardTitle>
          <span className="text-sm font-medium text-foreground">{unassignedDepartments.length} en total</span>
        </CardHeader>
        <div className="px-4 py-2 flex items-center gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setUrgentOnly(!urgentOnly)}
            className={cn(
              "text-xs font-semibold uppercase tracking-wide",
              urgentOnly ? "text-destructive" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Solo urgentes
          </button>
          <span className="text-border">|</span>
          <Filter className="h-4 w-4 text-muted-foreground" />
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2 pr-2">
            {unassignedDepartments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {urgentOnly ? "No hay unidades urgentes sin asignar." : "No hay unidades pendientes sin asignar."}
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 py-1">
                  <Checkbox
                    checked={selectedDeptIds.size === unassignedDepartments.length && unassignedDepartments.length > 0}
                    onCheckedChange={selectAllDepts}
                  />
                  <span className="text-xs text-muted-foreground">Seleccionar todos</span>
                </div>
                {unassignedDepartments.map((dept) => (
                  <div
                    key={dept.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 transition-colors cursor-pointer",
                      selectedDeptIds.has(dept.id)
                        ? "border-primary bg-primary/5"
                        : dept.priority === "high"
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-border hover:bg-muted/50"
                    )}
                    onClick={() => toggleDept(dept.id)}
                  >
                    <Checkbox
                      checked={selectedDeptIds.has(dept.id)}
                      onCheckedChange={() => toggleDept(dept.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{dept.name}</span>
                        {dept.priority === "high" && (
                          <Badge variant="destructive" className="text-[10px] uppercase">
                            Urgente
                          </Badge>
                        )}
                      </div>
                      {dept.address && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{dept.address}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">Necesita limpieza</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Panel derecho: Personal disponible */}
      <Card className="flex flex-col border border-border shadow-sm overflow-hidden">
        <CardHeader className="py-4 px-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Personal disponible
          </CardTitle>
          <span className="text-sm font-medium text-foreground">{filteredStaff.length} activos</span>
        </CardHeader>
        <div className="px-4 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2 pr-2">
            {filteredStaff.map((emp) => {
              const empTasks = getTasksForEmployee(emp.id);
              const activeCount = empTasks.filter((t) => t.status !== "completed").length;
              const isSelected = selectedEmployeeId === emp.id;
              const status =
                activeCount === 0
                  ? "available"
                  : activeCount >= 4
                    ? "capacity"
                    : "onsite";
              const statusLabel = status === "available" ? "Disponible" : status === "onsite" ? "En sitio" : "Al límite";
              const statusClass =
                status === "available"
                  ? "bg-emerald-500"
                  : status === "onsite"
                    ? "bg-amber-500"
                    : "bg-destructive";

              return (
                <div
                  key={emp.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition-colors cursor-pointer",
                    isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedEmployeeId(isSelected ? null : emp.id)}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(emp.name ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{emp.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn("inline-block h-2 w-2 rounded-full", statusClass)} />
                      <span className="text-xs text-muted-foreground">{statusLabel}</span>
                      <span className="text-xs text-muted-foreground">
                        · {activeCount} tarea(s) activa(s)
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full max-w-[120px] rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", activeCount >= 4 ? "bg-destructive" : "bg-primary")}
                        style={{ width: `${Math.min(100, (activeCount / 5) * 100)}%` }}
                      />
                    </div>
                  </div>
                  {isSelected && (
                    <Badge className="bg-primary text-primary-foreground shrink-0">Seleccionada</Badge>
                  )}
                </div>
              );
            })}
            {filteredStaff.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                {staffSearch ? "Ningún resultado." : "No hay empleadas cargadas."}
              </p>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Barra inferior: resumen y acciones */}
      <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">{selectedDeptIds.size} unidades</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm font-semibold text-primary">
              {selectedEmployeeId ? "1 empleada" : "0 empleadas"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">Est. total: {estimatedDisplay}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={clearSelection} disabled={selectedDeptIds.size === 0 && !selectedEmployeeId}>
            Limpiar selección
          </Button>
        </div>
        <Button
          onClick={handleAssignAndConfirm}
          disabled={selectedDeptIds.size === 0 || !selectedEmployeeId || assigning}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {assigning ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <UserPlus className="h-4 w-4 mr-2" />
          )}
          Asignar y confirmar
        </Button>
      </div>
    </div>
  );
}
