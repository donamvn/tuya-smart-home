import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

interface TuyaUser {
  uid: string;
  username: string;
}

export async function GET() {
  try {
    const ctx = getTuyaContext();

    // Get linked app users
    const usersRes = await ctx.request({
      method: 'GET',
      path: '/v1.0/iot-03/users',
      query: { page_size: '20', page_no: '1' },
    });

    if (!usersRes.success || !usersRes.result) {
      return NextResponse.json({
        success: true,
        result: { users: [], homes: [] },
      });
    }

    const users = ((usersRes.result as { list?: TuyaUser[] }).list || []) as TuyaUser[];

    // For each user, get their homes
    const allHomes: unknown[] = [];
    for (const user of users) {
      const homesRes = await ctx.request({
        method: 'GET',
        path: `/v1.0/users/${user.uid}/homes`,
      });
      if (homesRes.success && Array.isArray(homesRes.result)) {
        allHomes.push(
          ...homesRes.result.map((home: unknown) => ({
            ...(home as Record<string, unknown>),
            user_uid: user.uid,
          }))
        );
      }
    }

    return NextResponse.json({
      success: true,
      result: { users, homes: allHomes },
    });
  } catch (error) {
    console.error('Error fetching homes:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
