import { NextResponse } from 'next/server';
import { getSupabaseClient } from '../../../lib/supabase';
import type { Patient } from '../../../lib/types';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = (await supabase.from('patients').select('*')) as {
      data: Patient[] | null;
      error: any;
    };

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data ?? []);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      age,
      sex,
      conditions,
      allergies,
      medications,
      labs,
      summary,
    }: Partial<Patient> & { labs?: Record<string, string | number> } = body;

    if (!name || !age || !sex || !summary) {
      return NextResponse.json(
        { error: 'name, age, sex, and summary are required' },
        { status: 400 },
      );
    }

    const supabase = getSupabaseClient();
    const insertPayload = {
      name,
      age: Number(age),
      sex,
      weight_kg: typeof body.weightKg === 'number' ? body.weightKg : null,
      conditions: Array.isArray(conditions) ? conditions : [],
      allergies: Array.isArray(allergies) ? allergies : [],
      medications: Array.isArray(medications) ? medications : [],
      labs: labs ?? {},
      summary,
    };

    const { data, error } = (await supabase
      .from('patients')
      .insert([insertPayload])
      .select()
      .single()) as {
      data: Patient | null;
      error: any;
    };

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(data ?? null, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
