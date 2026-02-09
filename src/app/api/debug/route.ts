import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

export async function GET() {
  const ctx = getTuyaContext();
  const results: Record<string, unknown> = {};

  const uid = 'az1600337130301RRvqq'; // from device owner

  const homeId = '23016090';
  const endpoints = [
    // Scenes (v1.0 home-based)
    { name: 'home-scenes', method: 'GET' as const, path: `/v1.0/homes/${homeId}/scenes` },
    { name: 'home-automations', method: 'GET' as const, path: `/v1.0/homes/${homeId}/automations` },
    { name: 'home-tap-to-run', method: 'GET' as const, path: `/v1.0/homes/${homeId}/tap-to-run` },
    // Remove device API
    { name: 'remove-device-api', method: 'GET' as const, path: `/v1.0/devices/26304754bcddc260598d/reset-factory` },
    // Turn off the water heater we accidentally turned on
    { name: 'cmd-off', method: 'POST' as const, path: '/v1.0/devices/26304754bcddc260598d/commands', body: { commands: [{ code: 'switch_1', value: false }] } },
  ];

  for (const ep of endpoints) {
    try {
      const res = await ctx.request({
        method: ep.method || 'GET',
        path: ep.path,
        query: (ep as Record<string, unknown>).query as Record<string, string> | undefined,
        body: ep.body,
      });
      results[ep.name] = { success: res.success, result: res.result, msg: res.msg, code: res.code };
    } catch (err) {
      results[ep.name] = { error: String(err) };
    }
  }

  return NextResponse.json(results, { status: 200 });
}
