import { NextResponse } from 'next/server';
import { checkAndRunScenarios } from '@/lib/scheduler';

export async function POST() {
  try {
    const executed = await checkAndRunScenarios();
    return NextResponse.json({
      success: true,
      result: { executed, checkedAt: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Error checking scenarios:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
