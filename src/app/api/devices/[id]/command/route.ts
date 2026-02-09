import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;
    const body = await request.json();
    const ctx = getTuyaContext();

    const res = await ctx.request({
      method: 'POST',
      path: `/v1.0/iot-03/devices/${deviceId}/commands`,
      body: { commands: body.commands },
    });

    if (res.success) {
      return NextResponse.json(res);
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Failed to send command' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error sending command:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
