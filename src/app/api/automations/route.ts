import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

const HOME_ID = process.env.TUYA_HOME_ID;

export async function GET() {
  if (!HOME_ID) {
    return NextResponse.json(
      { success: false, msg: 'TUYA_HOME_ID chưa được cấu hình' },
      { status: 500 }
    );
  }

  try {
    const ctx = getTuyaContext();
    const res = await ctx.request({
      method: 'GET',
      path: `/v1.0/homes/${HOME_ID}/automations`,
    });

    if (res.success) {
      // Map automation_id → id for consistency
      const automations = ((res.result || []) as Record<string, unknown>[]).map((a) => ({
        ...a,
        id: a.automation_id || a.id,
      }));
      return NextResponse.json({ success: true, result: automations });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể tải automation' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching automations:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!HOME_ID) {
    return NextResponse.json(
      { success: false, msg: 'TUYA_HOME_ID chưa được cấu hình' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const ctx = getTuyaContext();

    const res = await ctx.request({
      method: 'POST',
      path: `/v1.0/homes/${HOME_ID}/automations`,
      body: {
        name: body.name,
        background: body.background || 'https://images.tuyacn.com/smart/rule/cover/bedroom.png',
        conditions: body.conditions || [],
        actions: body.actions || [],
        match_type: body.match_type ?? 1,
        preconditions: body.preconditions || [],
      },
    });

    if (res.success) {
      return NextResponse.json({ success: true, result: res.result });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể tạo automation' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating automation:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
