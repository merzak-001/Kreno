import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: "L'inscription publique est désactivée. Contactez l'administrateur." },
    { status: 403 }
  );
}
