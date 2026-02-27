"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { RentalForm } from "@/components/rental/rental-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewRentalPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/rentals">←</Link>
          </Button>
          <h1 className="text-2xl font-bold font-headline text-foreground flex items-center">
            <KeyRound className="mr-2 h-6 w-6 text-primary" />
            Nueva Renta
          </h1>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la reserva</CardTitle>
          <p className="text-sm text-muted-foreground">
            Completa los datos del arrendatario y las fechas. El estado inicial será &quot;Reservada&quot;.
          </p>
        </CardHeader>
        <CardContent>
          <RentalForm
            onSuccess={() => router.push("/admin/rentals")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
