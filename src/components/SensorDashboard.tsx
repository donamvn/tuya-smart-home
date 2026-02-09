'use client';

import { Thermometer, Droplets, Battery, Wifi, WifiOff } from 'lucide-react';
import { TuyaDevice, DeviceStatus } from '@/lib/types';

interface SensorDashboardProps {
  devices: { device: TuyaDevice; status: DeviceStatus[] }[];
}

interface SensorReading {
  label: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function extractSensorData(status: DeviceStatus[]): SensorReading[] {
  const readings: SensorReading[] = [];

  for (const s of status) {
    // Temperature
    if ((s.code === 'temp_current' || s.code === 'va_temperature') && typeof s.value === 'number') {
      readings.push({
        label: 'Nhiệt độ',
        value: (s.value / 10).toFixed(1),
        unit: '°C',
        icon: <Thermometer className="w-5 h-5" />,
        color: s.value / 10 > 30 ? 'text-red-600' : s.value / 10 < 18 ? 'text-blue-600' : 'text-amber-600',
        bgColor: s.value / 10 > 30 ? 'bg-red-50' : s.value / 10 < 18 ? 'bg-blue-50' : 'bg-amber-50',
      });
    }
    // Humidity
    if ((s.code === 'humidity_value' || s.code === 'va_humidity') && typeof s.value === 'number') {
      readings.push({
        label: 'Độ ẩm',
        value: String(s.value),
        unit: '%',
        icon: <Droplets className="w-5 h-5" />,
        color: s.value > 70 ? 'text-blue-600' : s.value < 40 ? 'text-amber-600' : 'text-cyan-600',
        bgColor: s.value > 70 ? 'bg-blue-50' : s.value < 40 ? 'bg-amber-50' : 'bg-cyan-50',
      });
    }
    // Battery
    if (s.code === 'battery_percentage' && typeof s.value === 'number') {
      readings.push({
        label: 'Pin',
        value: String(s.value),
        unit: '%',
        icon: <Battery className="w-5 h-5" />,
        color: s.value < 20 ? 'text-red-600' : 'text-green-600',
        bgColor: s.value < 20 ? 'bg-red-50' : 'bg-green-50',
      });
    }
  }

  return readings;
}

function SensorCard({ device, status }: { device: TuyaDevice; status: DeviceStatus[] }) {
  const readings = extractSensorData(status);

  if (readings.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌡️</span>
          <h3 className="font-semibold text-gray-900 text-sm">{device.name}</h3>
        </div>
        <div className="flex items-center gap-1">
          {device.online ? (
            <Wifi className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-gray-400" />
          )}
          <span className={`text-xs ${device.online ? 'text-green-600' : 'text-gray-400'}`}>
            {device.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {readings.map((reading) => (
          <div key={reading.label} className={`${reading.bgColor} rounded-xl p-3`}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className={reading.color}>{reading.icon}</span>
              <span className="text-xs text-gray-500">{reading.label}</span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className={`text-2xl font-bold ${reading.color}`}>{reading.value}</span>
              <span className="text-sm text-gray-500">{reading.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SensorDashboard({ devices }: SensorDashboardProps) {
  // Filter devices that are sensors (have temp/humidity data)
  const sensorDevices = devices.filter(({ status }) => {
    return status.some((s) =>
      ['temp_current', 'va_temperature', 'humidity_value', 'va_humidity'].includes(s.code)
    );
  });

  if (sensorDevices.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <Thermometer className="w-4 h-4" />
        Cảm biến
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sensorDevices.map(({ device, status }) => (
          <SensorCard key={device.id} device={device} status={status} />
        ))}
      </div>
    </div>
  );
}
