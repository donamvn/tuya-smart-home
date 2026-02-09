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
      path: `/v1.1/homes/${HOME_ID}/scenes`,
    });

    if (res.success) {
      return NextResponse.json({ success: true, result: res.result || [] });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể tải kịch bản cloud' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching cloud scenes:', error);
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
      path: `/v1.0/homes/${HOME_ID}/scenes`,
      body: {
        name: body.name,
        background: body.background || 'https://images.tuyacn.com/smart/rule/cover/bedroom.png',
        actions: body.actions || [],
      },
    });

    if (res.success) {
      return NextResponse.json({ success: true, result: res.result });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể tạo kịch bản cloud' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating cloud scene:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
