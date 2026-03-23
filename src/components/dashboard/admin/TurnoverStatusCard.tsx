"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export interface TurnoverItem {
  id: string;
  label: string;
  percent: number;
}

interface TurnoverStatusCardProps {
  items: TurnoverItem[];
  className?: string;
}

export function TurnoverStatusCard({ items, className }: TurnoverStatusCardProps) {
  return (
    <Card className={`border border-border shadow-sm ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Estado de rotación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Sin datos de rotación.</p>
        ) : (
          items.map((item) => {
            let indicatorColor = "bg-primary";
            if (item.id === "completed" || item.label.toLowerCase().includes("completados")) indicatorColor = "bg-green-500";
            if (item.id === "in_progress" || item.label.toLowerCase().includes("en progreso")) indicatorColor = "bg-blue-500";
            if (item.id === "pending" || item.label.toLowerCase().includes("pendientes")) indicatorColor = "bg-yellow-500";
            if (item.id === "canceled" || item.label.toLowerCase().includes("cancelado")) indicatorColor = "bg-red-500";

            return (
              <div key={item.id} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground tabular-nums">{item.percent}%</span>
                </div>
                <Progress value={item.percent} className="h-2" indicatorClassName={indicatorColor} />
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
