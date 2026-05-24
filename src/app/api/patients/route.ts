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
