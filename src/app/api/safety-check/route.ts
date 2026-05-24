import { NextResponse } from 'next/server';
import { runSafetyCheck } from '../../../lib/safety-engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { proposedDrug, currentMeds, allergies, patient } = body;
    if (!proposedDrug || !currentMeds || !patient) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const results = await runSafetyCheck({ proposedDrug, currentMeds, allergies: allergies ?? [], patient });
    return NextResponse.json(results);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
