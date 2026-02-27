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
  timeAgo?: string;
  actionHref?: string;
  actionLabel?: string;
}

interface CriticalAlertsCardProps {
  alerts: AlertItem[];
}

export function CriticalAlertsCard({ alerts }: CriticalAlertsCardProps) {
  const borderColor = (type: AlertItem["type"]) => {
    switch (type) {
      case "late": return "border-l-red-500";
      case "urgent": return "border-l-amber-500";
      default: return "border-l-slate-400";
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

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Alertas críticas
          </CardTitle>
          {alerts.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-destructive/10 text-destructive">
              {alerts.length} ACTIVAS
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No hay alertas en este momento.</p>
        ) : (
          alerts.slice(0, 5).map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border border-border border-l-4 ${borderColor(alert.type)} bg-card p-3 shadow-sm`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{alert.title}</p>
              <p className="text-sm mt-0.5">{alert.description}</p>
              {alert.timeAgo && <p className="text-xs text-muted-foreground mt-1">{alert.timeAgo}</p>}
              {alert.actionHref && alert.actionLabel && (
                <div className="mt-2 flex gap-2">
                  <Button asChild size="sm" variant={actionVariant(alert.type)}>
                    <Link href={alert.actionHref}>{alert.actionLabel}</Link>
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
