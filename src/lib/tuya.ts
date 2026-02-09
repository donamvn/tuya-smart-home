import { TuyaContext } from '@tuya/tuya-connector-nodejs';

let tuyaContext: TuyaContext | null = null;

export function getTuyaContext(): TuyaContext {
  if (!tuyaContext) {
    const accessKey = process.env.TUYA_ACCESS_ID;
    const secretKey = process.env.TUYA_ACCESS_SECRET;
    const baseUrl = process.env.TUYA_BASE_URL;

    if (!accessKey || !secretKey || !baseUrl) {
      throw new Error('Missing Tuya environment variables');
    }

    tuyaContext = new TuyaContext({
      baseUrl,
      accessKey,
      secretKey,
    });
  }

  return tuyaContext;
}

// Tuya device category mapping (Vietnamese)
export const CATEGORY_NAMES: Record<string, string> = {
  dj: 'Đèn',
  dd: 'Đèn dải LED',
  xdd: 'Đèn trần',
  fwd: 'Đèn bàn',
  dc: 'Đèn chuỗi',
  kg: 'Công tắc',
  cz: 'Ổ cắm',
  pc: 'Ổ cắm nguồn',
  dlq: 'Aptomat',
  kt: 'Điều hòa',
  wk: 'Bộ điều nhiệt',
  rs: 'Rèm cửa',
  cl: 'Rèm cửa cuốn',
  fs: 'Quạt',
  kfj: 'Máy pha cà phê',
  qn: 'Máy sưởi',
  wsdcg: 'Cảm biến nhiệt ẩm',
  mcs: 'Cảm biến cửa',
  ywbj: 'Cảm biến khói',
  rqbj: 'Cảm biến gas',
  pir: 'Cảm biến chuyển động',
  sp: 'Camera',
  bh: 'Bình nóng lạnh',
  cwwsq: 'Máy cho thú ăn',
  xxj: 'Máy hút bụi',
  sd: 'Máy lọc nước',
  jsq: 'Máy tạo ẩm',
  cs: 'Máy hút ẩm',
  ms: 'Khóa cửa',
  jtmspro: 'Khóa cửa thông minh',
  wg2: 'Gateway',
  mal: 'Khóa cửa',
  zndb: 'Bơm nước',
};

// Device icon mapping by category
export const CATEGORY_ICONS: Record<string, string> = {
  dj: '💡',
  dd: '💡',
  xdd: '💡',
  fwd: '💡',
  dc: '💡',
  kg: '🔌',
  cz: '🔌',
  pc: '🔌',
  dlq: '⚡',
  kt: '❄️',
  wk: '🌡️',
  rs: '🪟',
  cl: '🪟',
  fs: '🌀',
  wsdcg: '🌡️',
  mcs: '🚪',
  ywbj: '🔥',
  rqbj: '🔥',
  pir: '👁️',
  sp: '📷',
  bh: '🚿',
  xxj: '🧹',
  jsq: '💨',
  cs: '💨',
  ms: '🔒',
  jtmspro: '🔒',
  wg2: '📡',
  mal: '🔒',
};
