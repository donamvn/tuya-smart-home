'use client';

import { useState } from 'react';
import { Power, Loader2 } from 'lucide-react';
import { TuyaDevice, DeviceStatus } from '@/lib/types';
import { CATEGORY_ICONS } from '@/lib/tuya';

interface QuickActionsProps {
  devices: { device: TuyaDevice; status: DeviceStatus[] }[];
  onToggle: (deviceId: string, code: string, value: boolean) => Promise<void>;
}

function getSwitchInfo(status: DeviceStatus[]): { code: string; isOn: boolean } | null {
  const switchCodes = ['switch_led', 'switch_1', 'switch', 'power', 'master'];
  for (const code of switchCodes) {
    const s = status.find((st) => st.code === code);
    if (s !== undefined) {
      return { code, isOn: !!s.value };
    }
  }
  return null;
}

export default function QuickActions({ devices, onToggle }: QuickActionsProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Only show online devices that have a switch
  const toggleableDevices = devices.filter((d) => {
    if (!d.device.online) return false;
    return getSwitchInfo(d.status) !== null;
  });

  if (toggleableDevices.length === 0) return null;

  const handleToggle = async (deviceId: string, code: string, value: boolean) => {
    setLoadingId(deviceId);
    try {
      await onToggle(deviceId, code, value);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Power className="w-4 h-4" />
        Bật/Tắt nhanh
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {toggleableDevices.map(({ device, status }) => {
          const sw = getSwitchInfo(status)!;
          const icon = CATEGORY_ICONS[device.category] || '📦';
          const isLoading = loadingId === device.id;

          return (
            <button
              key={device.id}
              onClick={() => handleToggle(device.id, sw.code, !sw.isOn)}
              disabled={isLoading}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border whitespace-nowrap
                text-sm font-medium transition-all duration-200 shrink-0
                ${sw.isOn
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }
                ${isLoading ? 'opacity-70' : ''}
              `}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span className="text-base">{icon}</span>
              )}
              {device.name}
              <span
                className={`w-2 h-2 rounded-full ${
                  sw.isOn ? 'bg-white/70' : 'bg-gray-300'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
