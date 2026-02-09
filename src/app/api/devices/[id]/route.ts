import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;
    const ctx = getTuyaContext();

    // Fetch device detail, status, and functions in parallel
    const [detailRes, statusRes, functionsRes] = await Promise.all([
      ctx.request({
        method: 'GET',
        path: `/v1.0/iot-03/devices/${deviceId}`,
      }),
      ctx.request({
        method: 'GET',
        path: `/v1.0/iot-03/devices/${deviceId}/status`,
      }),
      ctx.request({
        method: 'GET',
        path: `/v1.0/iot-03/devices/${deviceId}/functions`,
      }),
    ]);

    return NextResponse.json({
      success: true,
      result: {
        detail: detailRes.success ? detailRes.result : null,
        status: statusRes.success ? statusRes.result : [],
        functions: functionsRes.success ? functionsRes.result : { functions: [] },
      },
    });
  } catch (error) {
    console.error('Error fetching device:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
