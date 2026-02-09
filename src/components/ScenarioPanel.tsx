'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Play, Clock, Loader2, ToggleLeft, ToggleRight,
  Timer, Zap, History, ChevronDown, ChevronUp, AlertCircle, Pencil,
  Cloud, HardDrive, RefreshCw,
} from 'lucide-react';
import { Scenario, ScenarioLog, TuyaDevice, CloudScene, Automation } from '@/lib/types';

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
  const [activeTab, setActiveTab] = useState<'cloud' | 'automation' | 'local'>('cloud');

  // Local scenarios state
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [logs, setLogs] = useState<ScenarioLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Cloud scenes state
  const [cloudScenes, setCloudScenes] = useState<CloudScene[]>([]);
  const [cloudLoading, setCloudLoading] = useState(true);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [showCloudForm, setShowCloudForm] = useState(false);
  const [cloudFormName, setCloudFormName] = useState('');
  const [editingCloudId, setEditingCloudId] = useState<string | null>(null);

  // Multi-action cloud form
  interface CloudActionForm {
    type: 'dpIssue' | 'delay';
    deviceId: string;
    code: string;
    value: string;
    delayH: number;
    delayM: number;
    delayS: number;
  }
  const [cloudActions, setCloudActions] = useState<CloudActionForm[]>([
    { type: 'dpIssue', deviceId: '', code: 'switch_1', value: 'true', delayH: 0, delayM: 0, delayS: 5 },
  ]);
  const [deviceFunctions, setDeviceFunctions] = useState<Record<string, { code: string; name: string; type: string }[]>>({});

  // Automations state
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [autoLoading, setAutoLoading] = useState(true);
  const [autoError, setAutoError] = useState<string | null>(null);

  // Local form state (shared for create & edit)
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formInterval, setFormInterval] = useState(3);
  const [formDuration, setFormDuration] = useState(15);
  const [formDeviceId, setFormDeviceId] = useState('');
  const [formSwitchCode, setFormSwitchCode] = useState('switch_1');

  // ---- Fetch Local Scenarios ----
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

  // ---- Fetch Cloud Scenes ----
  const fetchCloudScenes = useCallback(async () => {
    setCloudLoading(true);
    setCloudError(null);
    try {
      const res = await fetch('/api/scenes');
      const data = await res.json();
      if (data.success) {
        setCloudScenes(data.result || []);
      } else {
        setCloudError(data.msg || 'Không thể tải kịch bản cloud');
      }
    } catch {
      setCloudError('Lỗi kết nối');
    } finally {
      setCloudLoading(false);
    }
  }, []);

  // ---- Fetch Automations ----
  const fetchAutomations = useCallback(async () => {
    setAutoLoading(true);
    setAutoError(null);
    try {
      const res = await fetch('/api/automations');
      const data = await res.json();
      if (data.success) {
        setAutomations(data.result || []);
      } else {
        setAutoError(data.msg || 'Không thể tải automation');
      }
    } catch {
      setAutoError('Lỗi kết nối');
    } finally {
      setAutoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScenarios();
    fetchCloudScenes();
    fetchAutomations();
    const interval = setInterval(async () => {
      await fetch('/api/scenarios/check', { method: 'POST' });
      fetchScenarios();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchScenarios, fetchCloudScenes, fetchAutomations]);

  // ---- Local Scenario Handlers ----
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

  const handleEdit = (scenario: Scenario) => {
    setEditingId(scenario.id);
    setFormName(scenario.name);
    setFormDesc(scenario.description);
    setFormInterval(scenario.intervalHours);
    setFormDuration(scenario.durationMinutes);
    const firstAction = scenario.actions[0];
    setFormDeviceId(firstAction?.deviceId || '');
    setFormSwitchCode(firstAction?.commands[0]?.code || 'switch_1');
    setShowForm(true);
  };

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormInterval(3);
    setFormDuration(15);
    setFormDeviceId('');
    setFormSwitchCode('switch_1');
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formDeviceId) return;

    const selectedDevice = devices.find((d) => d.device.id === formDeviceId);
    const deviceName = selectedDevice?.device.name || formDeviceId;
    const actions = [
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
    ];

    setActionLoading('submit');
    try {
      if (editingId) {
        await fetch(`/api/scenarios/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            name: formName,
            description: formDesc,
            intervalHours: formInterval,
            durationMinutes: formDuration,
            actions,
          }),
        });
      } else {
        await fetch('/api/scenarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            description: formDesc,
            intervalHours: formInterval,
            durationMinutes: formDuration,
            actions,
          }),
        });
      }
      await fetchScenarios();
      resetForm();
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Automation Handlers ----
  const handleAutoToggle = async (id: string, currentEnabled: boolean) => {
    setActionLoading(`auto-toggle-${id}`);
    try {
      const res = await fetch(`/api/automations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchAutomations();
      } else {
        alert(data.msg || 'Không thể cập nhật');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleAutoTrigger = async (id: string) => {
    setActionLoading(`auto-trigger-${id}`);
    try {
      const res = await fetch(`/api/automations/${id}`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        alert(data.msg || 'Không thể kích hoạt');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleAutoDelete = async (id: string) => {
    if (!confirm('Xóa automation? Thao tác này không thể hoàn tác.')) return;
    setActionLoading(`auto-del-${id}`);
    try {
      const res = await fetch(`/api/automations/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchAutomations();
      } else {
        alert(data.msg || 'Không thể xóa');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Cloud Scene Handlers ----
  const handleCloudTrigger = async (id: string) => {
    setActionLoading(`cloud-trigger-${id}`);
    try {
      const res = await fetch(`/api/scenes/${id}`, { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        alert(data.msg || 'Không thể kích hoạt kịch bản');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloudDelete = async (id: string) => {
    if (!confirm('Xóa kịch bản cloud? Thao tác này không thể hoàn tác.')) return;
    setActionLoading(`cloud-del-${id}`);
    try {
      const res = await fetch(`/api/scenes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchCloudScenes();
      } else {
        alert(data.msg || 'Không thể xóa');
      }
    } finally {
      setActionLoading(null);
    }
  };

  // Fetch device functions for DP selection
  const fetchDeviceFunctions = async (deviceId: string) => {
    if (deviceFunctions[deviceId]) return;
    try {
      const res = await fetch(`/api/devices/${deviceId}`);
      const data = await res.json();
      if (data.success && data.result?.functions?.functions) {
        setDeviceFunctions((prev) => ({
          ...prev,
          [deviceId]: data.result.functions.functions.map((f: { code: string; name: string; type: string }) => ({
            code: f.code,
            name: f.name || f.code,
            type: f.type,
          })),
        }));
      }
    } catch {
      // Fallback: no dynamic functions
    }
  };

  const addCloudAction = (type: 'dpIssue' | 'delay') => {
    setCloudActions((prev) => [
      ...prev,
      type === 'dpIssue'
        ? { type: 'dpIssue', deviceId: '', code: 'switch_1', value: 'true', delayH: 0, delayM: 0, delayS: 0 }
        : { type: 'delay', deviceId: '', code: '', value: '', delayH: 0, delayM: 0, delayS: 5 },
    ]);
  };

  const updateCloudAction = (idx: number, updates: Partial<CloudActionForm>) => {
    setCloudActions((prev) => prev.map((a, i) => (i === idx ? { ...a, ...updates } : a)));
    if (updates.deviceId) fetchDeviceFunctions(updates.deviceId);
  };

  const removeCloudAction = (idx: number) => {
    setCloudActions((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetCloudForm = () => {
    setCloudFormName('');
    setCloudActions([{ type: 'dpIssue', deviceId: '', code: 'switch_1', value: 'true', delayH: 0, delayM: 0, delayS: 5 }]);
    setEditingCloudId(null);
    setShowCloudForm(false);
  };

  const handleCloudEdit = (scene: CloudScene) => {
    setEditingCloudId(scene.id);
    setCloudFormName(scene.name);
    // Convert existing actions to form actions
    const formActions: CloudActionForm[] = (scene.actions || []).map((a) => {
      if (a.action_executor === 'delay') {
        const p = a.executor_property;
        return {
          type: 'delay' as const,
          deviceId: '', code: '', value: '',
          delayH: Number(p.hours || 0), delayM: Number(p.minutes || 0), delayS: Number(p.seconds || 0),
        };
      }
      const code = Object.keys(a.executor_property)[0] || 'switch_1';
      const val = a.executor_property[code];
      if (a.entity_id) fetchDeviceFunctions(a.entity_id);
      return {
        type: 'dpIssue' as const,
        deviceId: a.entity_id, code, value: String(val),
        delayH: 0, delayM: 0, delayS: 0,
      };
    });
    setCloudActions(formActions.length > 0 ? formActions : [{ type: 'dpIssue', deviceId: '', code: 'switch_1', value: 'true', delayH: 0, delayM: 0, delayS: 5 }]);
    setShowCloudForm(true);
  };

  const handleCloudSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloudFormName) return;
    const validActions = cloudActions.filter((a) => a.type === 'delay' || a.deviceId);
    if (validActions.length === 0) return;

    const sceneActions = validActions.map((a) => {
      if (a.type === 'delay') {
        return {
          action_executor: 'delay',
          executor_property: { hours: String(a.delayH), minutes: String(a.delayM), seconds: String(a.delayS) },
        };
      }
      // Parse value: try bool, then number, then string
      let parsedValue: unknown = a.value;
      if (a.value === 'true') parsedValue = true;
      else if (a.value === 'false') parsedValue = false;
      else if (!isNaN(Number(a.value)) && a.value !== '') parsedValue = Number(a.value);
      return {
        action_executor: 'dpIssue',
        entity_id: a.deviceId,
        executor_property: { [a.code]: parsedValue },
      };
    });

    setActionLoading('cloud-submit');
    try {
      if (editingCloudId) {
        const res = await fetch(`/api/scenes/${editingCloudId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cloudFormName, actions: sceneActions }),
        });
        const data = await res.json();
        if (!data.success) alert(data.msg || 'Không thể cập nhật');
      } else {
        const res = await fetch('/api/scenes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cloudFormName, actions: sceneActions }),
        });
        const data = await res.json();
        if (!data.success) alert(data.msg || 'Không thể tạo kịch bản');
      }
      await fetchCloudScenes();
      resetCloudForm();
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
            Kịch bản
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {cloudScenes.length} cloud · {automations.length} auto · {scenarios.filter((s) => s.enabled).length}/{scenarios.length} local
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
        </div>
      </div>

      {/* Sub-tabs: Cloud / Automation / Local */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('cloud')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'cloud'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          Cloud ({cloudScenes.length})
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'automation'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          Automation ({automations.length})
        </button>
        <button
          onClick={() => setActiveTab('local')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'local'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          Local ({scenarios.length})
        </button>
      </div>

      {/* ============ CLOUD TAB ============ */}
      {activeTab === 'cloud' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={fetchCloudScenes}
              disabled={cloudLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${cloudLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button
              onClick={() => { resetCloudForm(); setShowCloudForm(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Tạo mới
            </button>
          </div>

          {/* Cloud Create/Edit Form */}
          {showCloudForm && (
            <form onSubmit={handleCloudSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">
                {editingCloudId ? 'Sửa kịch bản Cloud' : 'Tạo kịch bản Cloud'}
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên kịch bản *</label>
                <input
                  type="text"
                  value={cloudFormName}
                  onChange={(e) => setCloudFormName(e.target.value)}
                  placeholder="VD: Bật đèn phòng khách"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Actions list */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Hành động ({cloudActions.length})</label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => addCloudAction('dpIssue')}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100">
                      + Thiết bị
                    </button>
                    <button type="button" onClick={() => addCloudAction('delay')}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100">
                      + Trì hoãn
                    </button>
                  </div>
                </div>

                {cloudActions.map((action, idx) => (
                  <div key={idx} className={`border rounded-lg p-3 space-y-2 ${
                    action.type === 'delay' ? 'border-amber-200 bg-amber-50/50' : 'border-gray-200 bg-gray-50/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">
                        {idx + 1}. {action.type === 'delay' ? '⏱ Trì hoãn' : '📡 Gửi lệnh thiết bị'}
                      </span>
                      {cloudActions.length > 1 && (
                        <button type="button" onClick={() => removeCloudAction(idx)}
                          className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {action.type === 'delay' ? (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">Giờ</label>
                          <input type="number" min={0} max={23} value={action.delayH}
                            onChange={(e) => updateCloudAction(idx, { delayH: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Phút</label>
                          <input type="number" min={0} max={59} value={action.delayM}
                            onChange={(e) => updateCloudAction(idx, { delayM: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Giây</label>
                          <input type="number" min={0} max={59} value={action.delayS}
                            onChange={(e) => updateCloudAction(idx, { delayS: Number(e.target.value) })}
                            className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm" />
                        </div>
                      </div>
                    ) : (
                      <>
                        <select value={action.deviceId}
                          onChange={(e) => updateCloudAction(idx, { deviceId: e.target.value })}
                          className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm">
                          <option value="">Chọn thiết bị...</option>
                          {devices.map(({ device }) => (
                            <option key={device.id} value={device.id}>
                              {device.name} {!device.online ? '(Offline)' : ''}
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500">Mã lệnh (DP)</label>
                            {deviceFunctions[action.deviceId] ? (
                              <select value={action.code}
                                onChange={(e) => updateCloudAction(idx, { code: e.target.value })}
                                className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm">
                                {deviceFunctions[action.deviceId].map((f) => (
                                  <option key={f.code} value={f.code}>{f.name} ({f.code})</option>
                                ))}
                              </select>
                            ) : (
                              <input type="text" value={action.code}
                                onChange={(e) => updateCloudAction(idx, { code: e.target.value })}
                                placeholder="switch_1"
                                className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm" />
                            )}
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Giá trị</label>
                            <input type="text" value={action.value}
                              onChange={(e) => updateCloudAction(idx, { value: e.target.value })}
                              placeholder="true / false / 100"
                              className="w-full px-2 py-1.5 rounded border border-gray-200 text-sm" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm text-indigo-800">
                <Cloud className="w-4 h-4 inline mr-1" />
                Kịch bản sẽ được lưu trên Tuya Cloud và đồng bộ với app điện thoại.
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={actionLoading === 'cloud-submit'}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {actionLoading === 'cloud-submit' ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}
                  {editingCloudId ? 'Lưu thay đổi' : 'Tạo kịch bản'}
                </button>
                <button type="button" onClick={resetCloudForm}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Hủy
                </button>
              </div>
            </form>
          )}

          {/* Cloud Scene List */}
          {cloudLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : cloudError ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {cloudError}
              </p>
              <p className="text-amber-700 text-xs mt-2">
                Nếu lỗi &quot;No permissions&quot;, hãy vào{' '}
                <a
                  href="https://iot.tuya.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  Tuya IoT Platform
                </a>{' '}
                → Cloud → Project → Service API → Subscribe &quot;Smart Home Scene Linkage&quot; → Authorize.
              </p>
            </div>
          ) : cloudScenes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Cloud className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có kịch bản cloud nào</p>
              <p className="text-sm text-gray-400 mt-1">Tạo kịch bản cloud để đồng bộ với app Tuya Smart</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cloudScenes.map((scene) => (
                <div
                  key={scene.id}
                  className="bg-white rounded-xl border border-indigo-200 p-4 transition-all shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-indigo-500 shrink-0" />
                        <h3 className="font-semibold text-gray-900 truncate">{scene.name}</h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                          Cloud
                        </span>
                      </div>
                      {scene.actions && scene.actions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {scene.actions.map((action, i) => (
                            <div key={i} className="text-xs text-gray-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
                              {action.action_executor === 'dpIssue' ? (
                                <>
                                  {action.entity_name || action.entity_id} →{' '}
                                  {Object.entries(action.executor_property).map(([k, v]) =>
                                    `${k}: ${v === true ? 'BẬT' : v === false ? 'TẮT' : String(v)}`
                                  ).join(', ')}
                                </>
                              ) : action.action_executor === 'delay' ? (
                                <>Trì hoãn {JSON.stringify(action.executor_property)}</>
                              ) : (
                                <>{action.action_executor}: {action.entity_id}</>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCloudEdit(scene)}
                        className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                        title="Sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCloudTrigger(scene.id)}
                        disabled={actionLoading === `cloud-trigger-${scene.id}`}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                        title="Chạy ngay"
                      >
                        {actionLoading === `cloud-trigger-${scene.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCloudDelete(scene.id)}
                        disabled={actionLoading === `cloud-del-${scene.id}`}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                        title="Xóa"
                      >
                        {actionLoading === `cloud-del-${scene.id}` ? (
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
        </div>
      )}

      {/* ============ AUTOMATION TAB ============ */}
      {activeTab === 'automation' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={fetchAutomations}
              disabled={autoLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"
            >
              <RefreshCw className={`w-4 h-4 ${autoLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {autoLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : autoError ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {autoError}
              </p>
            </div>
          ) : automations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Timer className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có automation nào</p>
              <p className="text-sm text-gray-400 mt-1">Tạo automation từ app Tuya Smart trên điện thoại</p>
            </div>
          ) : (
            <div className="space-y-3">
              {automations.map((auto) => {
                const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
                return (
                  <div
                    key={auto.id}
                    className={`bg-white rounded-xl border p-4 transition-all shadow-sm ${
                      auto.enabled ? 'border-emerald-200' : 'border-gray-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-emerald-500 shrink-0" />
                          <h3 className="font-semibold text-gray-900 truncate">{auto.name}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            auto.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {auto.enabled ? 'Đang bật' : 'Đã tắt'}
                          </span>
                        </div>

                        {/* Conditions */}
                        {auto.conditions && auto.conditions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {auto.conditions.map((cond, i) => (
                              <div key={i} className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                {cond.entity_type === 6 ? (
                                  <>
                                    <Clock className="w-3 h-3 inline" />
                                    {' '}{cond.display?.time || '??:??'}
                                    {cond.display?.loops && cond.display.loops !== '0000000' && (
                                      <span className="ml-1 text-gray-400">
                                        ({cond.display.loops === '1111111'
                                          ? 'Mỗi ngày'
                                          : cond.display.loops.split('').map((c, j) => c === '1' ? DAY_LABELS[j] : '').filter(Boolean).join(', ')
                                        })
                                      </span>
                                    )}
                                  </>
                                ) : cond.entity_type === 1 ? (
                                  <>Thiết bị {cond.entity_id}: {cond.display?.code} {cond.display?.operator} {String(cond.display?.value ?? '')}</>
                                ) : (
                                  <>Điều kiện loại {cond.entity_type}</>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        {auto.actions && auto.actions.length > 0 && (
                          <div className="mt-1.5 space-y-1">
                            {auto.actions.map((action, i) => (
                              <div key={i} className="text-xs text-gray-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                                {action.action_executor === 'dpIssue' ? (
                                  <>
                                    {action.entity_name || action.entity_id} →{' '}
                                    {Object.entries(action.executor_property).map(([k, v]) =>
                                      `${k}: ${v === true ? 'BẬT' : v === false ? 'TẮT' : String(v)}`
                                    ).join(', ')}
                                  </>
                                ) : action.action_executor === 'delay' ? (
                                  <>Trì hoãn {action.executor_property.minutes || 0}p {action.executor_property.seconds || 0}s</>
                                ) : (
                                  <>{action.action_executor}: {action.entity_id}</>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleAutoTrigger(auto.id)}
                          disabled={actionLoading === `auto-trigger-${auto.id}`}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Chạy ngay"
                        >
                          {actionLoading === `auto-trigger-${auto.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleAutoToggle(auto.id, auto.enabled)}
                          disabled={actionLoading === `auto-toggle-${auto.id}`}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          title={auto.enabled ? 'Tắt automation' : 'Bật automation'}
                        >
                          {actionLoading === `auto-toggle-${auto.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                          ) : auto.enabled ? (
                            <ToggleRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleAutoDelete(auto.id)}
                          disabled={actionLoading === `auto-del-${auto.id}`}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Xóa"
                        >
                          {actionLoading === `auto-del-${auto.id}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============ LOCAL TAB ============ */}
      {activeTab === 'local' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Tạo mới
            </button>
          </div>

          {/* Create / Edit Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Sửa kịch bản' : 'Tạo kịch bản mới'}</h3>

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
                  disabled={actionLoading === 'submit'}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading === 'submit' ? (
                    <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                  ) : null}
                  {editingId ? 'Lưu thay đổi' : 'Tạo kịch bản'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
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
              <HardDrive className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Chưa có kịch bản local nào</p>
              <p className="text-sm text-gray-400 mt-1">Kịch bản local chạy scheduler trên server, không cần Tuya Cloud</p>
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleEdit(scenario)}
                        className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                        title="Sửa kịch bản"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
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
