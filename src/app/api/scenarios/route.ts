import { NextResponse } from 'next/server';
import { getScenarios, createScenario, getLogs } from '@/lib/scheduler';
import { Scenario } from '@/lib/types';

export async function GET() {
  try {
    const scenarios = getScenarios();
    const logs = getLogs();
    return NextResponse.json({ success: true, result: { scenarios, logs } });
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const scenario: Scenario = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description || '',
      enabled: body.enabled ?? true,
      intervalHours: body.intervalHours,
      durationMinutes: body.durationMinutes || 0,
      actions: body.actions || [],
      lastRun: null,
      nextRun: null,
      createdAt: new Date().toISOString(),
    };

    const created = createScenario(scenario);
    return NextResponse.json({ success: true, result: created });
  } catch (error) {
    console.error('Error creating scenario:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
