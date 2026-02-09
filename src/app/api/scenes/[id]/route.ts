import { NextResponse } from 'next/server';
import { getTuyaContext } from '@/lib/tuya';

const HOME_ID = process.env.TUYA_HOME_ID;

// Trigger a scene
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!HOME_ID) {
    return NextResponse.json(
      { success: false, msg: 'TUYA_HOME_ID chưa được cấu hình' },
      { status: 500 }
    );
  }

  try {
    const { id: sceneId } = await params;
    const ctx = getTuyaContext();

    const res = await ctx.request({
      method: 'POST',
      path: `/v1.0/homes/${HOME_ID}/scenes/${sceneId}/trigger`,
    });

    if (res.success) {
      return NextResponse.json({ success: true, msg: 'Đã kích hoạt kịch bản' });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể kích hoạt kịch bản' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error triggering scene:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update a scene
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!HOME_ID) {
    return NextResponse.json(
      { success: false, msg: 'TUYA_HOME_ID chưa được cấu hình' },
      { status: 500 }
    );
  }

  try {
    const { id: sceneId } = await params;
    const body = await request.json();
    const ctx = getTuyaContext();

    const res = await ctx.request({
      method: 'PUT',
      path: `/v1.0/homes/${HOME_ID}/scenes/${sceneId}`,
      body: {
        name: body.name,
        background: body.background || 'https://images.tuyacn.com/smart/rule/cover/bedroom.png',
        actions: body.actions || [],
      },
    });

    if (res.success) {
      return NextResponse.json({ success: true, msg: 'Đã cập nhật kịch bản' });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể cập nhật kịch bản' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating scene:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete a scene
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!HOME_ID) {
    return NextResponse.json(
      { success: false, msg: 'TUYA_HOME_ID chưa được cấu hình' },
      { status: 500 }
    );
  }

  try {
    const { id: sceneId } = await params;
    const ctx = getTuyaContext();

    const res = await ctx.request({
      method: 'DELETE',
      path: `/v1.0/homes/${HOME_ID}/scenes/${sceneId}`,
    });

    if (res.success) {
      return NextResponse.json({ success: true, msg: 'Đã xóa kịch bản' });
    }

    return NextResponse.json(
      { success: false, msg: res.msg || 'Không thể xóa kịch bản' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error deleting scene:', error);
    return NextResponse.json(
      { success: false, msg: 'Internal server error' },
      { status: 500 }
    );
  }
}
