import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guests = parseInt(searchParams.get('guests') || '1');
    const destination = searchParams.get('destination') || '';

    let query = supabase
      .from('departments')
      .select(`
        id,
        name,
        address,
        max_guests,
        rental_price_per_night,
        images,
        description,
        companies:company_id (
          name
        )
      `)
      .eq('is_rentable', true)
      .eq('rental_status', 'available')
      .not('rental_price_per_night', 'is', null) // asegurar que tienen precio
      .gte('max_guests', guests); // filtro básico por capacidad mínima

    if (destination) {
      query = query.ilike('address', `%${destination}%`);
    }

    const { data: properties, error } = await query;

    if (error) throw error;

    // Transformar datos para la UI
    const formattedProperties = (properties || []).map((prop: any) => ({
      id: prop.id,
      title: prop.name,
      company: prop.companies?.name || "Anfitrión Particular",
      price: prop.rental_price_per_night || 0,
      rating: 5.0, // Mock, se implementaría reviews después
      reviews: 0,
      beds: prop.beds_count || 1, // Por ahora mock si no lo trae
      guests: prop.max_guests,
      image: Array.isArray(prop.images) && prop.images.length > 0
        ? prop.images[0]
        : "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop", // Fallback
      allImages: Array.isArray(prop.images) ? prop.images : [],
      description: prop.description
    }));

    return NextResponse.json({ properties: formattedProperties });
  } catch (err: any) {
    console.error("Error fetching properties:", err);
    return NextResponse.json({ error: "No se pudieron cargar las propiedades" }, { status: 500 });
  }
}
