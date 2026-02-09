import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;
    const body = await request.json();
    const ctx = getTuyaContext();

    const res = await ctx.request({
      method: 'PUT',
      path: `/v1.0/devices/${deviceId}`,
      body: { name: body.name },
    });

    if (res.success) {
      return NextResponse.json({ success: true, msg: 'Đã đổi tên thiết bị' });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể đổi tên thiết bị' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error renaming device:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deviceId } = await params;
    const ctx = getTuyaContext();

    const res = await ctx.request({
      method: 'DELETE',
      path: `/v1.0/devices/${deviceId}`,
    });

    if (res.success) {
      return NextResponse.json({ success: true, msg: 'Đã xóa thiết bị' });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể xóa thiết bị' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
        path: `/v1.0/devices/${deviceId}`,
      }),
      ctx.request({
        method: 'GET',
        path: `/v1.0/devices/${deviceId}/status`,
      }),
      ctx.request({
        method: 'GET',
        path: `/v1.0/devices/${deviceId}/functions`,
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
