import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

export async function GET() {
  const ctx = getTuyaContext();
  const results: Record<string, unknown> = {};

  // Test various endpoints to find the right one
  const endpoints = [
    { name: 'users (smart home)', path: '/v1.0/users', query: { page_no: '1', page_size: '20' } },
    { name: 'cloud/thing (space)', path: '/v2.0/cloud/thing/device', query: { page_size: '20', page_no: '1' } },
    { name: 'iot-03/space/child', path: '/v2.0/cloud/space/child', query: { space_id: '0' } },
    { name: 'cloud/device/list-all', path: '/v1.0/iot-01/associated-users/devices', query: { page_no: '1', page_size: '20', last_row_key: '' } },
    { name: 'smart-home/devices', path: '/v1.0/devices', query: { page_no: '1', page_size: '20' } },
    { name: 'smart-home/homes', path: '/v1.0/homes', query: {} },
    { name: 'iot-03/devices/status (all)', path: '/v1.0/iot-03/devices/status', query: {} },
  ];

  for (const ep of endpoints) {
    try {
      const res = await ctx.request({
        method: 'GET',
        path: ep.path,
        query: ep.query,
      });
      results[ep.name] = { success: res.success, result: res.result, msg: res.msg, code: res.code };
    } catch (err) {
      results[ep.name] = { error: String(err) };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
