'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Home, Loader2, Search, Wifi, WifiOff, LayoutGrid, Zap } from 'lucide-react';
import DeviceCard from './DeviceCard';
import DeviceControl from './DeviceControl';
import QuickActions from './QuickActions';
import ScenarioPanel from './ScenarioPanel';
import SensorDashboard from './SensorDashboard';
import { TuyaDevice, DeviceStatus } from '@/lib/types';
import { CATEGORY_NAMES } from '@/lib/tuya';

interface DeviceWithStatus {
  device: TuyaDevice;
  status: DeviceStatus[];
}

export default function Dashboard() {
  const [devices, setDevices] = useState<DeviceWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterOnline, setFilterOnline] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'devices' | 'scenarios'>('devices');

  const fetchDevices = useCallback(async () => {
    try {
      const res = await fetch('/api/devices');
      const data = await res.json();

      if (data.success && data.result) {
        // API returns array of devices with embedded status
        const deviceList = Array.isArray(data.result) ? data.result : [];

        // Status is already included in each device object from Tuya API
        const devicesWithStatus: DeviceWithStatus[] = deviceList.map(
          (raw: TuyaDevice & { status?: DeviceStatus[] }) => ({
            device: raw,
            status: raw.status || [],
          })
        );

        setDevices(devicesWithStatus);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(data.msg || 'Không thể tải danh sách thiết bị');
      }
    } catch {
      setError('Lỗi kết nối đến server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const handleToggle = async (deviceId: string, code: string, value: boolean) => {
    try {
      const res = await fetch(`/api/devices/${deviceId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: [{ code, value }] }),
      });
      const data = await res.json();
      if (data.success) {
        // Optimistic update
        setDevices((prev) =>
          prev.map((d) => {
            if (d.device.id === deviceId) {
              return {
                ...d,
                status: d.status.map((s) =>
                  s.code === code ? { ...s, value } : s
                ),
              };
            }
            return d;
          })
        );
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const handleCommand = async (deviceId: string, commands: { code: string; value: unknown }[]) => {
    try {
      await fetch(`/api/devices/${deviceId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands }),
      });
    } catch (err) {
      console.error('Command error:', err);
    }
  };

  const handleDelete = async (deviceId: string) => {
    const res = await fetch(`/api/devices/${deviceId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setDevices((prev) => prev.filter((d) => d.device.id !== deviceId));
      setSelectedDevice(null);
    } else {
      throw new Error(data.msg);
    }
  };

  const handleRename = async (deviceId: string, newName: string) => {
    const res = await fetch(`/api/devices/${deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    });
    const data = await res.json();
    if (data.success) {
      setDevices((prev) =>
        prev.map((d) =>
          d.device.id === deviceId
            ? { ...d, device: { ...d.device, name: newName } }
            : d
        )
      );
    } else {
      throw new Error(data.msg);
    }
  };

  // Get unique categories
  const categories = Array.from(new Set(devices.map((d) => d.device.category)));

  // Filter devices
  const filteredDevices = devices.filter((d) => {
    const matchSearch =
      !searchQuery ||
      d.device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.device.product_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory === 'all' || d.device.category === filterCategory;
    const matchOnline =
      filterOnline === 'all' ||
      (filterOnline === 'online' && d.device.online) ||
      (filterOnline === 'offline' && !d.device.online);
    return matchSearch && matchCategory && matchOnline;
  });

  const onlineCount = devices.filter((d) => d.device.online).length;
  const offlineCount = devices.length - onlineCount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="w-7 h-7 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Nhà Thông Minh</h1>
                <p className="text-xs text-gray-500">Tuya Smart Home Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-green-600">
                  <Wifi className="w-3.5 h-3.5" /> {onlineCount} online
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <WifiOff className="w-3.5 h-3.5" /> {offlineCount} offline
                </span>
              </div>
              {/* Refresh */}
              <button
                onClick={() => { setLoading(true); fetchDevices(); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Sensor Dashboard */}
        <SensorDashboard devices={devices} />

        {/* Quick Actions Strip */}
        <QuickActions devices={devices} onToggle={handleToggle} />

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'devices'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Thiết bị ({devices.length})
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'scenarios'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            Kịch bản
          </button>
        </div>

        {/* Scenarios Tab */}
        {activeTab === 'scenarios' && (
          <ScenarioPanel devices={devices} />
        )}

        {/* Devices Tab */}
        {activeTab === 'devices' && (
        <>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm thiết bị..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả loại</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_NAMES[cat] || cat}
              </option>
            ))}
          </select>
          <select
            value={filterOnline}
            onChange={(e) => setFilterOnline(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        {/* Loading */}
        {loading && devices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500">Đang tải danh sách thiết bị...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 text-sm font-medium">Lỗi: {error}</p>
            <button
              onClick={() => { setLoading(true); fetchDevices(); }}
              className="mt-2 text-sm text-red-600 underline hover:text-red-800"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Device Grid */}
        {!loading && filteredDevices.length === 0 && !error && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-2">Không tìm thấy thiết bị nào</p>
            <p className="text-gray-400 text-sm">
              {devices.length > 0 ? 'Thử thay đổi bộ lọc' : 'Hãy liên kết thiết bị trong Tuya IoT Platform'}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDevices.map(({ device, status }) => (
            <DeviceCard
              key={device.id}
              device={device}
              status={status}
              onToggle={handleToggle}
              onSelect={setSelectedDevice}
            />
          ))}
        </div>

        {/* Last update */}
        {lastUpdate && (
          <p className="text-center text-xs text-gray-400 mt-8">
            Cập nhật lần cuối: {lastUpdate.toLocaleString('vi-VN')} · Tự động làm mới mỗi 30 giây
          </p>
        )}
        </>
        )}
      </main>

      {/* Device Control Modal */}
      {selectedDevice && (
        <DeviceControl
          deviceId={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onCommand={handleCommand}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      )}
    </div>
  );
}
