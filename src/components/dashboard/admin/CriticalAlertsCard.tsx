"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export interface AlertItem {
  id: string;
  type: "urgent" | "late" | "unassigned";
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
  className?: string;
}

export function CriticalAlertsCard({ alerts, onAction, className }: CriticalAlertsCardProps) {
  const borderColor = (type: AlertItem["type"]) => {
    switch (type) {
      case "late": return "border-l-red-500";
      case "urgent": return "border-l-amber-500";
      default: return "border-l-red-500";
    }
  };

  const actionVariant = (type: AlertItem["type"]) => {
    switch (type) {
      case "late": return "destructive";
      case "urgent": return "default";
      case "unassigned": return "default";
      default: return "secondary";
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
    <Card className={`border border-border shadow-sm flex flex-col h-full bg-red-50/50 ${className}`}>
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
          alerts.slice(0, 10).map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border border-border border-l-4 ${borderColor(alert.type)} bg-card p-3 shadow-sm`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{alert.title}</p>
              {renderDescription(alert)}
              {alert.timeAgo && <p className="text-[10px] text-muted-foreground mt-1">{alert.timeAgo}</p>}
              {(alert.actionHref || alert.actionLabel) && (
                <div className="mt-2 flex gap-2">
                  {onAction && alert.type === 'urgent' ? (
                    <Button 
                      size="sm" 
                      variant={actionVariant(alert.type)}
                      onClick={() => onAction(alert)}
                    >
                      {alert.actionLabel || 'Confirmar'}
                    </Button>
                  ) : alert.actionHref ? (
                    <Button asChild size="sm" variant={actionVariant(alert.type)}>
                      <Link href={alert.actionHref}>{alert.actionLabel}</Link>
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
