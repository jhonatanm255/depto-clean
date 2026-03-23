import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, guests, nights, checkIn, checkOut, totalAmount } = body;

    // Validación básica
    if (!propertyId || !checkIn || !checkOut) {
      return NextResponse.json({ error: "Faltan datos obligatorios para la reserva" }, { status: 400 });
    }

    // Obtener `company_id` del departamento a rentar para amarrar la renta
    const { data: deptInfo, error: deptError } = await supabase
      .from('departments')
      .select('company_id, name, rental_status')
      .eq('id', propertyId)
      .single();

    if (deptError || !deptInfo) {
      return NextResponse.json({ error: "Propiedad no encontrada" }, { status: 404 });
    }

    // Verificar disponibilidad real
    if (deptInfo.rental_status !== 'available') {
      return NextResponse.json({ 
        error: "Esta propiedad no está disponible para reserva en este momento (puede estar en limpieza o mantenimiento)" 
      }, { status: 400 });
    }

    // Crear la renta con estado 'reserved'
    const { data: rentalData, error: rentalError } = await supabase
      .from('rentals')
      .insert([{
        company_id: deptInfo.company_id,
        department_id: propertyId,
        tenant_name: "Huésped (Reserva Web)", // Temporal, luego se pedirán datos
        rental_status: 'reserved',
        check_in_date: checkIn,
        check_out_date: checkOut,
        total_amount: totalAmount,
        payment_status: 'pending',
        number_of_guests: guests,
        booking_source: 'Direct Web',
      }])
      .select('id')
      .single();

    if (rentalError || !rentalData) {
      console.error(rentalError);
      throw new Error("Error creando reserva");
    }

    // Actualizar el estado del departamento para que aparezca "reservado" en admin
    await supabase
      .from('departments')
      .update({
        rental_status: 'reserved',
        current_rental_id: rentalData.id
      })
      .eq('id', propertyId);

    return NextResponse.json({
      success: true,
      message: "Reserva procesada exitosamente",
      reservationId: rentalData.id
    });
  } catch (error) {
    console.error("Error al procesar reserva:", error);
    return NextResponse.json({ error: "Ocurrió un error interno del servidor" }, { status: 500 });
  }
}
