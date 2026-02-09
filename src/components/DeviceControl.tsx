'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Power, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { DeviceDetail, DeviceStatus, DeviceFunction } from '@/lib/types';
import { CATEGORY_NAMES, CATEGORY_ICONS } from '@/lib/tuya';

interface DeviceControlProps {
  deviceId: string;
  onClose: () => void;
  onCommand: (deviceId: string, commands: { code: string; value: unknown }[]) => Promise<void>;
  onDelete?: (deviceId: string) => Promise<void>;
}

function parseFunctionValues(values: string): Record<string, unknown> {
  try {
    return JSON.parse(values);
  } catch {
    return {};
  }
}

function StatusDisplay({ status }: { status: DeviceStatus[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Trạng thái hiện tại</h3>
      <div className="grid grid-cols-2 gap-2">
        {status.map((s) => (
          <div key={s.code} className="bg-gray-50 rounded-lg p-2.5">
            <p className="text-xs text-gray-500 truncate">{s.code}</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {typeof s.value === 'boolean' ? (s.value ? '✅ Bật' : '⭕ Tắt') : String(s.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FunctionControl({
  func,
  currentValue,
  onSend,
  loading,
}: {
  func: DeviceFunction;
  currentValue: unknown;
  onSend: (code: string, value: unknown) => void;
  loading: boolean;
}) {
  const specs = parseFunctionValues(func.values);

  if (func.type === 'Boolean') {
    const isOn = currentValue === true;
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-900">{func.name || func.code}</p>
          {func.desc && <p className="text-xs text-gray-500">{func.desc}</p>}
        </div>
        <button
          onClick={() => onSend(func.code, !isOn)}
          disabled={loading}
          className={`
            relative w-12 h-6 rounded-full transition-colors duration-200
            ${isOn ? 'bg-blue-600' : 'bg-gray-300'}
            ${loading ? 'opacity-50' : ''}
          `}
        >
          <span
            className={`
              absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200
              ${isOn ? 'translate-x-6' : 'translate-x-0.5'}
            `}
          />
        </button>
      </div>
    );
  }

  if (func.type === 'Integer') {
    const min = (specs.min as number) ?? 0;
    const max = (specs.max as number) ?? 100;
    const step = (specs.step as number) ?? 1;
    const unit = (specs.unit as string) ?? '';
    const val = typeof currentValue === 'number' ? currentValue : min;

    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-medium text-gray-900">{func.name || func.code}</p>
            {func.desc && <p className="text-xs text-gray-500">{func.desc}</p>}
          </div>
          <span className="text-sm font-semibold text-blue-600">
            {val}{unit}
          </span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          defaultValue={val}
          disabled={loading}
          onMouseUp={(e) => onSend(func.code, Number((e.target as HTMLInputElement).value))}
          onTouchEnd={(e) => onSend(func.code, Number((e.target as HTMLInputElement).value))}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    );
  }

  if (func.type === 'Enum') {
    const range = (specs.range as string[]) ?? [];
    return (
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium text-gray-900 mb-2">{func.name || func.code}</p>
        <div className="flex flex-wrap gap-1.5">
          {range.map((opt) => (
            <button
              key={opt}
              onClick={() => onSend(func.code, opt)}
              disabled={loading}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-colors
                ${currentValue === opt
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export default function DeviceControl({ deviceId, onClose, onCommand, onDelete }: DeviceControlProps) {
  const [detail, setDetail] = useState<DeviceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/devices/${deviceId}`);
      const data = await res.json();
      if (data.success) {
        setDetail(data.result);
      } else {
        setError(data.msg || 'Không thể lấy thông tin thiết bị');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSend = async (code: string, value: unknown) => {
    setSending(true);
    try {
      await onCommand(deviceId, [{ code, value }]);
      // Refresh status after command
      setTimeout(fetchDetail, 500);
    } finally {
      setSending(false);
    }
  };

  const getStatusValue = (code: string): unknown => {
    return detail?.status?.find((s) => s.code === code)?.value;
  };

  const deviceDetail = detail?.detail;
  const icon = deviceDetail ? (CATEGORY_ICONS[deviceDetail.category] || '📦') : '📦';
  const categoryName = deviceDetail
    ? (CATEGORY_NAMES[deviceDetail.category] || deviceDetail.category_name || deviceDetail.category)
    : '';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <div>
              <h2 className="font-bold text-gray-900">{deviceDetail?.name || 'Đang tải...'}</h2>
              <p className="text-sm text-gray-500">{categoryName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDetail}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Làm mới"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {loading && !detail && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {detail && (
            <>
              {/* Device info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${deviceDetail?.online ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-sm text-gray-700">
                  {deviceDetail?.online ? 'Đang kết nối' : 'Không kết nối'}
                </span>
                {deviceDetail?.ip && (
                  <span className="text-xs text-gray-400 ml-auto">IP: {deviceDetail.ip}</span>
                )}
              </div>

              {/* Status */}
              {detail.status && detail.status.length > 0 && (
                <StatusDisplay status={detail.status} />
              )}

              {/* Controls */}
              {detail.functions?.functions && detail.functions.functions.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Power className="w-4 h-4" />
                    Điều khiển
                  </h3>
                  <div className="space-y-2">
                    {detail.functions.functions.map((func) => (
                      <FunctionControl
                        key={func.code}
                        func={func}
                        currentValue={getStatusValue(func.code)}
                        onSend={handleSend}
                        loading={sending}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Device metadata */}
              <div className="text-xs text-gray-400 pt-2 border-t border-gray-100 space-y-1">
                <p>ID: {deviceDetail?.id}</p>
                <p>Product: {deviceDetail?.product_name}</p>
                {deviceDetail?.model && <p>Model: {deviceDetail.model}</p>}
                <p>Cập nhật: {deviceDetail?.update_time ? new Date(deviceDetail.update_time * 1000).toLocaleString('vi-VN') : 'N/A'}</p>
              </div>

              {/* Delete button for offline devices */}
              {!deviceDetail?.online && onDelete && (
                <button
                  onClick={async () => {
                    if (!confirm(`Xóa thiết bị "${deviceDetail?.name}"? Thiết bị sẽ bị gỡ khỏi tài khoản Tuya.`)) return;
                    setDeleting(true);
                    try {
                      await onDelete(deviceId);
                      onClose();
                    } catch {
                      setError('Không thể xóa thiết bị');
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Xóa thiết bị offline
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
