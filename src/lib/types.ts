export interface TuyaDevice {
  id: string;
  name: string;
  category: string;
  category_name: string;
  icon: string;
  ip: string;
  lat: string;
  lon: string;
  local_key: string;
  model: string;
  online: boolean;
  product_id: string;
  product_name: string;
  sub: boolean;
  time_zone: string;
  uid: string;
  uuid: string;
  active_time: number;
  create_time: number;
  update_time: number;
  gateway_id: string;
  asset_id?: string;
}

export interface DeviceStatus {
  code: string;
  value: boolean | number | string;
}

export interface DeviceFunction {
  code: string;
  name: string;
  desc: string;
  type: string;
  values: string;
}

export interface DeviceDetail {
  detail: TuyaDevice | null;
  status: DeviceStatus[];
  functions: {
    category: string;
    functions: DeviceFunction[];
  };
}

export interface Home {
  home_id: number;
  name: string;
  geo_name: string;
  lat: number;
  lon: number;
  user_uid: string;
  rooms: Room[];
}

export interface Room {
  room_id: number;
  name: string;
}

// Scenario types
export interface ScenarioAction {
  deviceId: string;
  deviceName: string;
  commands: { code: string; value: unknown }[];
  delayMinutes: number; // 0 = immediate, >0 = delay after scenario starts
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  intervalHours: number; // run every X hours
  durationMinutes: number; // how long the "on" action lasts before auto-off
  actions: ScenarioAction[];
  lastRun: string | null; // ISO timestamp
  nextRun: string | null;
  createdAt: string;
}

export interface ScenarioLog {
  id: string;
  scenarioId: string;
  scenarioName: string;
  action: string;
  timestamp: string;
  success: boolean;
  message: string;
}

// Cloud Scene types (from Tuya API)
export interface CloudSceneAction {
  action_executor: string; // 'dpIssue' | 'delay' | 'ruleEnable' | 'ruleDisable' | 'ruleTrigger'
  entity_id: string;
  entity_name?: string;
  executor_property: Record<string, unknown>;
}

export interface CloudScene {
  id: string;
  name: string;
  enabled: boolean;
  background: string;
  actions: CloudSceneAction[];
  status: number; // 1 = enabled, 2 = disabled
}
