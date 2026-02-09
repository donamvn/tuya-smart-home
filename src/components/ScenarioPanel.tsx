'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Play, Clock, Loader2, ToggleLeft, ToggleRight,
  Timer, Zap, History, ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react';
import { Scenario, ScenarioLog, TuyaDevice } from '@/lib/types';

interface ScenarioPanelProps {
  devices: { device: TuyaDevice }[];
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}

function timeUntil(isoStr: string): string {
  const diff = new Date(isoStr).getTime() - Date.now();
  if (diff <= 0) return 'Đã đến lịch';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút nữa`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h${remainMins > 0 ? `${remainMins}p` : ''} nữa`;
}

export default function ScenarioPanel({ devices }: ScenarioPanelProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [logs, setLogs] = useState<ScenarioLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formInterval, setFormInterval] = useState(3);
  const [formDuration, setFormDuration] = useState(15);
  const [formDeviceId, setFormDeviceId] = useState('');
  const [formSwitchCode, setFormSwitchCode] = useState('switch_1');

  const fetchScenarios = useCallback(async () => {
    try {
      const res = await fetch('/api/scenarios');
      const data = await res.json();
      if (data.success) {
        setScenarios(data.result.scenarios || []);
        setLogs(data.result.logs || []);
      }
    } catch (err) {
      console.error('Error fetching scenarios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
    // Check scheduler every 30 seconds
    const interval = setInterval(async () => {
      await fetch('/api/scenarios/check', { method: 'POST' });
      fetchScenarios();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchScenarios]);

  const handleToggle = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/scenarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      await fetchScenarios();
    } finally {
      setActionLoading(null);
    }
  };

  const handleTrigger = async (id: string) => {
    setActionLoading(`trigger-${id}`);
    try {
      await fetch(`/api/scenarios/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'trigger' }),
      });
      await fetchScenarios();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa kịch bản này?')) return;
    setActionLoading(`del-${id}`);
    try {
      await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
      await fetchScenarios();
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDeviceId) return;

    const selectedDevice = devices.find((d) => d.device.id === formDeviceId);
    const deviceName = selectedDevice?.device.name || formDeviceId;

    setActionLoading('create');
    try {
      await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          intervalHours: formInterval,
          durationMinutes: formDuration,
          actions: [
            {
              deviceId: formDeviceId,
              deviceName,
              commands: [{ code: formSwitchCode, value: true }],
              delayMinutes: 0,
            },
            {
              deviceId: formDeviceId,
              deviceName,
              commands: [{ code: formSwitchCode, value: false }],
              delayMinutes: formDuration,
            },
          ],
        }),
      });
      await fetchScenarios();
      setShowCreate(false);
      setFormName('');
      setFormDesc('');
      setFormInterval(3);
      setFormDuration(15);
      setFormDeviceId('');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Kịch bản tự động
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {scenarios.filter((s) => s.enabled).length} kịch bản đang hoạt động
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"
          >
            <History className="w-4 h-4" />
            Lịch sử
          </button>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Tạo mới
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Tạo kịch bản mới</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên kịch bản *</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VD: Bật bình nước nóng"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <input
                type="text"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="VD: Mỗi 3 tiếng bật 15 phút"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thiết bị *</label>
              <select
                value={formDeviceId}
                onChange={(e) => setFormDeviceId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn thiết bị...</option>
                {devices.map(({ device }) => (
                  <option key={device.id} value={device.id}>
                    {device.name} {!device.online ? '(Offline)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lặp lại mỗi (giờ)</label>
              <input
                type="number"
                value={formInterval}
                onChange={(e) => setFormInterval(Number(e.target.value))}
                min={0.5}
                step={0.5}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bật trong (phút)</label>
              <input
                type="number"
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã lệnh bật/tắt</label>
            <select
              value={formSwitchCode}
              onChange={(e) => setFormSwitchCode(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="switch_1">switch_1 (Công tắc 1)</option>
              <option value="switch">switch (Công tắc chính)</option>
              <option value="switch_led">switch_led (Đèn LED)</option>
              <option value="power">power (Nguồn)</option>
              <option value="switch_2">switch_2 (Công tắc 2)</option>
              <option value="switch_3">switch_3 (Công tắc 3)</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Kịch bản sẽ: <strong>Bật</strong> thiết bị → chờ <strong>{formDuration} phút</strong> → <strong>Tắt</strong> thiết bị.
            Lặp lại mỗi <strong>{formInterval} giờ</strong>.
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={actionLoading === 'create'}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading === 'create' ? (
                <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
              ) : null}
              Tạo kịch bản
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Scenario List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Zap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Chưa có kịch bản nào</p>
          <p className="text-sm text-gray-400 mt-1">Nhấn "Tạo mới" để thêm kịch bản tự động</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`bg-white rounded-xl border p-4 transition-all ${
                scenario.enabled ? 'border-blue-200 shadow-sm' : 'border-gray-200 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 truncate">{scenario.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        scenario.enabled
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {scenario.enabled ? 'Đang bật' : 'Đã tắt'}
                    </span>
                  </div>
                  {scenario.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{scenario.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5" />
                      Mỗi {scenario.intervalHours}h, bật {scenario.durationMinutes} phút
                    </span>
                    {scenario.lastRun && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Chạy lần cuối: {timeAgo(scenario.lastRun)}
                      </span>
                    )}
                    {scenario.enabled && scenario.nextRun && (
                      <span className="flex items-center gap-1 text-blue-600 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Lần tiếp: {timeUntil(scenario.nextRun)}
                      </span>
                    )}
                  </div>
                  {/* Actions list */}
                  <div className="mt-2 space-y-1">
                    {scenario.actions.map((action, i) => (
                      <div key={i} className="text-xs text-gray-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        {action.delayMinutes === 0 ? 'Ngay lập tức' : `Sau ${action.delayMinutes} phút`}:
                        {' '}{action.deviceName} →{' '}
                        {action.commands.map((c) =>
                          `${c.code}: ${c.value === true ? 'BẬT' : c.value === false ? 'TẮT' : c.value}`
                        ).join(', ')}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleTrigger(scenario.id)}
                    disabled={actionLoading === `trigger-${scenario.id}`}
                    className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                    title="Chạy ngay"
                  >
                    {actionLoading === `trigger-${scenario.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggle(scenario.id)}
                    disabled={actionLoading === scenario.id}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title={scenario.enabled ? 'Tắt kịch bản' : 'Bật kịch bản'}
                  >
                    {actionLoading === scenario.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                    ) : scenario.enabled ? (
                      <ToggleRight className="w-5 h-5 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(scenario.id)}
                    disabled={actionLoading === `del-${scenario.id}`}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                    title="Xóa"
                  >
                    {actionLoading === `del-${scenario.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs section */}
      {showLogs && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4" />
              Lịch sử thực thi ({logs.length})
            </h3>
            {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="border-t border-gray-100 max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="p-4 text-sm text-gray-400 text-center">Chưa có lịch sử</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {logs.slice(0, 20).map((log) => (
                  <div key={log.id} className="px-4 py-2.5 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{log.scenarioName}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(log.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          log.success ? 'bg-green-500' : 'bg-red-500'
                        }`}
                      />
                      <span className="text-xs text-gray-500 truncate">{log.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
