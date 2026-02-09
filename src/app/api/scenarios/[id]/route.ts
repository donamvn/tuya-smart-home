import { NextResponse } from 'next/server';
import { toggleScenario, deleteScenario, triggerScenarioNow, getScenarioById } from '@/lib/scheduler';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const scenario = getScenarioById(id);
  if (!scenario) {
    return NextResponse.json({ success: false, msg: 'Không tìm thấy kịch bản' }, { status: 404 });
  }
  return NextResponse.json({ success: true, result: scenario });
}

// PATCH: toggle enabled or trigger now
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'toggle') {
      const updated = toggleScenario(id);
      if (!updated) {
        return NextResponse.json({ success: false, msg: 'Không tìm thấy kịch bản' }, { status: 404 });
      }
      return NextResponse.json({ success: true, result: updated });
    }

    if (body.action === 'trigger') {
      const ok = await triggerScenarioNow(id);
      if (!ok) {
        return NextResponse.json({ success: false, msg: 'Không tìm thấy kịch bản' }, { status: 404 });
      }
      return NextResponse.json({ success: true, msg: 'Đã kích hoạt kịch bản' });
    }

    return NextResponse.json({ success: false, msg: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating scenario:', error);
    return NextResponse.json({ success: false, msg: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = deleteScenario(id);
  if (!ok) {
    return NextResponse.json({ success: false, msg: 'Không tìm thấy kịch bản' }, { status: 404 });
  }
  return NextResponse.json({ success: true, msg: 'Đã xóa kịch bản' });
}
