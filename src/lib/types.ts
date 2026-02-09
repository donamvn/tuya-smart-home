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
