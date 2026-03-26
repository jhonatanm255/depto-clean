"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface AlertItem {
  id: string;
  type: "urgent" | "late" | "unassigned" | "warning";
  title: string;
  description: string;
  guestName?: string; 
  timeAgo?: string;
  actionHref?: string;
  actionLabel?: string;
}

interface CriticalAlertsCardProps {
  alerts: AlertItem[];
  onAction?: (alert: AlertItem) => void;
  onDismiss?: (alertId: string) => void;
  className?: string;
}

export function CriticalAlertsCard({ alerts, onAction, onDismiss, className }: CriticalAlertsCardProps) {

  const actionVariant = (type: AlertItem["type"]) => {
    switch (type) {
      case "late": return "destructive";
      case "urgent": return "destructive";
      case "unassigned": return "destructive";
      case "warning": return "outline";
      default: return "secondary";
    }
  };

  const getAlertStyles = (type: AlertItem["type"]) => {
    switch (type) {
      case "warning":
        return {
          container: "bg-amber-50 border-amber-500/20 dark:bg-amber-500/5 dark:border-amber-500/20",
          title: "text-amber-600 dark:text-amber-500",
          icon: "text-amber-500"
        };
      default:
        return {
          container: "bg-red-50 border-destructive/10 dark:bg-destructive/5 dark:border-destructive/10",
          title: "text-red-500 dark:text-red-500",
          icon: "text-destructive"
        };
    }
  };

  const renderDescription = (alert: AlertItem) => {
    if (alert.guestName && alert.description.includes(alert.guestName)) {
      const parts = alert.description.split(alert.guestName);
      return (
        <p className="text-xs mt-0.5 text-foreground leading-relaxed">
          {parts[0]}
          <span className="font-semibold text-muted-foreground/80">{alert.guestName}</span>
          {parts[1]}
        </p>
      );
    }
    return <p className="text-xs mt-0.5 text-foreground leading-relaxed">{alert.description}</p>;
  };

  return (
    <Card className={`border border-border border-t-4 border-t-red-400 shadow-sm flex flex-col h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Alertas
          </CardTitle>
          {alerts.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-destructive/10 text-destructive">
              {alerts.length} ACTIVAS
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow overflow-auto">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay alertas en este momento.</p>
        ) : (
          alerts.slice(0, 10).map((alert) => {
            const styles = getAlertStyles(alert.type);
            return (
              <div
                key={alert.id}
                className={`rounded-lg border ${styles.container} p-3 shadow-sm`}
              >
                <p className={`text-[12px] font-bold uppercase tracking-wide ${styles.title}`}>{alert.title}</p>
                {renderDescription(alert)}
                {alert.timeAgo && <p className="text-[10px] text-muted-foreground mt-1">{alert.timeAgo}</p>}
                    <div className="mt-2 flex gap-2">
                    {onAction && alert.type === 'urgent' && (
                      <Button 
                        size="sm" 
                        variant={actionVariant(alert.type)}
                        className="flex-1"
                        onClick={() => onAction(alert)}
                      >
                        {alert.actionLabel || 'Confirmar'}
                      </Button>
                    )}
                    
                    {alert.actionHref && (
                      <Button asChild size="sm" variant={actionVariant(alert.type)} className="flex-1">
                        <Link href={alert.actionHref}>{alert.actionLabel}</Link>
                      </Button>
                    )}

                    {onDismiss && (alert.type === 'warning' || alert.type === 'unassigned') && (
                      <Button 
                        size="sm"  
                        className={cn(
                          "text-xs",
                          alert.actionHref ? "flex-1" : "w-full",
                          alert.type === 'unassigned' 
                            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700" 
                            : "bg-orange-400 text-white hover:bg-orange-500"
                        )}
                        onClick={() => onDismiss(alert.id)}
                      >
                        Cerrar
                      </Button>
                    )}
                  </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
