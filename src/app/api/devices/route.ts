import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

interface TuyaDeviceResponse {
  devices: unknown[];
  has_more: boolean;
  last_row_key: string;
  total: number;
}

export async function GET() {
  try {
    const ctx = getTuyaContext();
    const allDevices: unknown[] = [];
    let lastRowKey = '';
    let hasMore = true;

    // Paginate through all devices linked to this project
    while (hasMore) {
      const res = await ctx.request({
        method: 'GET',
        path: '/v1.0/iot-01/associated-users/devices',
        query: {
          page_no: '1',
          page_size: '50',
          last_row_key: lastRowKey,
        },
      });

      if (!res.success || !res.result) {
        if (allDevices.length > 0) break;
        return NextResponse.json(
          { success: false, msg: res.msg || 'Failed to fetch devices' },
          { status: 500 }
        );
      }

      const data = res.result as TuyaDeviceResponse;
      allDevices.push(...(data.devices || []));
      hasMore = data.has_more;
      lastRowKey = data.last_row_key || '';
    }

    return NextResponse.json({
      success: true,
      result: allDevices,
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
