import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

const HOME_ID = process.env.TUYA_HOME_ID;

// Trigger an automation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!HOME_ID) {
    return NextResponse.json(
      { success: false, msg: 'TUYA_HOME_ID chưa được cấu hình' },
      { status: 500 }
    );
  }

  try {
    const { id: automationId } = await params;
    const ctx = getTuyaContext();

    const res = await ctx.request({
      method: 'POST',
      path: `/v1.0/homes/${HOME_ID}/automations/${automationId}/trigger`,
    });

    if (res.success) {
      return NextResponse.json({ success: true, msg: 'Đã kích hoạt automation' });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể kích hoạt automation' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error triggering automation:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Enable/disable an automation
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!HOME_ID) {
    return NextResponse.json(
      { success: false, msg: 'TUYA_HOME_ID chưa được cấu hình' },
      { status: 500 }
    );
  }

  try {
    const { id: automationId } = await params;
    const body = await request.json();
    const ctx = getTuyaContext();

    const res = await ctx.request({
      method: 'PUT',
      path: `/v1.0/homes/${HOME_ID}/automations/${automationId}`,
      body: { enabled: body.enabled },
    });

    if (res.success) {
      return NextResponse.json({
        success: true,
        msg: body.enabled ? 'Đã bật automation' : 'Đã tắt automation',
      });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể cập nhật automation' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating automation:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete an automation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!HOME_ID) {
    return NextResponse.json(
      { success: false, msg: 'TUYA_HOME_ID chưa được cấu hình' },
      { status: 500 }
    );
  }

  try {
    const { id: automationId } = await params;
    const ctx = getTuyaContext();

    const res = await ctx.request({
      method: 'DELETE',
      path: `/v1.0/homes/${HOME_ID}/automations/${automationId}`,
    });

    if (res.success) {
      return NextResponse.json({ success: true, msg: 'Đã xóa automation' });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể xóa automation' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error deleting automation:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
