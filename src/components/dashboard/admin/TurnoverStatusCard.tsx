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
}

export function TurnoverStatusCard({ items }: TurnoverStatusCardProps) {
  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Estado de rotación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">Sin datos de rotación.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">{item.label}</span>
                <span className="text-muted-foreground tabular-nums">{item.percent}%</span>
              </div>
              <Progress value={item.percent} className="h-2" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
