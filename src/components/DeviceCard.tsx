'use client';

import { useState } from 'react';
import { Power, Wifi, WifiOff, ChevronRight, Loader2 } from 'lucide-react';
import { TuyaDevice, DeviceStatus } from '@/lib/types';
import { CATEGORY_NAMES, CATEGORY_ICONS } from '@/lib/tuya';

interface DeviceCardProps {
  device: TuyaDevice;
  status: DeviceStatus[];
  onToggle: (deviceId: string, code: string, value: boolean) => Promise<void>;
  onSelect: (deviceId: string) => void;
}

function getSwitchStatus(status: DeviceStatus[]): { code: string; isOn: boolean } | null {
  const switchCodes = ['switch_led', 'switch_1', 'switch', 'power', 'master'];
  for (const code of switchCodes) {
    const s = status.find((st) => st.code === code);
    if (s !== undefined) {
      return { code, isOn: !!s.value };
    }
  }
  return null;
}

function getStatusValues(status: DeviceStatus[]): Record<string, string> {
  const display: Record<string, string> = {};
  for (const s of status) {
    if (s.code.includes('temp') && typeof s.value === 'number') {
      display['Nhiệt độ'] = `${s.value / 10}°C`;
    }
    if (s.code.includes('humidity') && typeof s.value === 'number') {
      display['Độ ẩm'] = `${s.value}%`;
    }
    if (s.code === 'bright_value' && typeof s.value === 'number') {
      display['Độ sáng'] = `${Math.round((s.value / 1000) * 100)}%`;
    }
    if (s.code === 'colour_data' && typeof s.value === 'string') {
      display['Màu'] = 'RGB';
    }
    if (s.code === 'cur_power' && typeof s.value === 'number') {
      display['Công suất'] = `${s.value / 10}W`;
    }
    if (s.code === 'cur_current' && typeof s.value === 'number') {
      display['Dòng điện'] = `${s.value}mA`;
    }
    if (s.code === 'cur_voltage' && typeof s.value === 'number') {
      display['Điện áp'] = `${s.value / 10}V`;
    }
  }
  return display;
}

export default function DeviceCard({ device, status, onToggle, onSelect }: DeviceCardProps) {
  const [loading, setLoading] = useState(false);
  const switchState = getSwitchStatus(status);
  const extraValues = getStatusValues(status);
  const icon = CATEGORY_ICONS[device.category] || '📦';
  const categoryName = CATEGORY_NAMES[device.category] || device.category_name || device.category;
  const isOn = switchState?.isOn ?? false;

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!switchState || loading) return;
    setLoading(true);
    try {
      await onToggle(device.id, switchState.code, !switchState.isOn);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => onSelect(device.id)}
      className={`
        relative rounded-2xl p-4 cursor-pointer transition-all duration-200
        border hover:shadow-lg hover:-translate-y-0.5
        ${isOn && device.online
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-md'
          : 'bg-white border-gray-200 shadow-sm'
        }
        ${!device.online ? 'opacity-60' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{device.name}</h3>
            <p className="text-xs text-gray-500">{categoryName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {device.online ? (
            <Wifi className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className={`text-xs font-medium ${device.online ? 'text-green-600' : 'text-gray-400'}`}>
            {device.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Status values */}
      {Object.keys(extraValues).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.entries(extraValues).map(([label, val]) => (
            <span key={label} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">
              {label}: <strong className="ml-1">{val}</strong>
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto">
        {switchState && device.online ? (
          <button
            onClick={handleToggle}
            disabled={loading}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              transition-all duration-200
              ${isOn
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }
              ${loading ? 'opacity-70' : ''}
            `}
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Power className="w-3.5 h-3.5" />
            )}
            {isOn ? 'Đang bật' : 'Đang tắt'}
          </button>
        ) : (
          <span className="text-xs text-gray-400">
            {!device.online ? 'Không kết nối' : 'Chỉ xem'}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}
