import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

export async function GET() {
  try {
    const ctx = getTuyaContext();

    // First, get the user list linked to this project
    const usersRes = await ctx.request({
      method: 'GET',
      path: '/v1.0/token',
      query: { grant_type: '1' },
    });

    // Get devices using the IoT Core API
    const devicesRes = await ctx.request({
      method: 'GET',
      path: '/v2.0/cloud/thing/device',
      query: { page_size: '100' },
    });

    if (devicesRes.success) {
      return NextResponse.json(devicesRes);
    }

    // Fallback: try legacy endpoint
    const legacyRes = await ctx.request({
      method: 'GET',
      path: '/v1.0/iot-03/devices',
      query: { page_size: '100' },
    });

    if (legacyRes.success) {
      return NextResponse.json(legacyRes);
    }

    return NextResponse.json(
      { success: false, msg: legacyRes.msg || 'Failed to fetch devices' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
