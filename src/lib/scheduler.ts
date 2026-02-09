import fs from 'fs';
import path from 'path';
import { Scenario, ScenarioLog } from './types';
import { getTuyaContext } from './tuya';

const DATA_DIR = path.join(process.cwd(), 'data');
const SCENARIOS_FILE = path.join(DATA_DIR, 'scenarios.json');
const LOGS_FILE = path.join(DATA_DIR, 'scenario-logs.json');
const MAX_LOGS = 100;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ---- Scenario CRUD ----

export function getScenarios(): Scenario[] {
  ensureDataDir();
  if (!fs.existsSync(SCENARIOS_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(SCENARIOS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

export function saveScenarios(scenarios: Scenario[]) {
  ensureDataDir();
  fs.writeFileSync(SCENARIOS_FILE, JSON.stringify(scenarios, null, 2));
}

export function getScenarioById(id: string): Scenario | undefined {
  return getScenarios().find((s) => s.id === id);
}

export function createScenario(scenario: Scenario): Scenario {
  const scenarios = getScenarios();
  // Calculate first nextRun
  scenario.nextRun = new Date(
    Date.now() + scenario.intervalHours * 60 * 60 * 1000
  ).toISOString();
  scenarios.push(scenario);
  saveScenarios(scenarios);
  return scenario;
}

export function updateScenario(id: string, updates: Partial<Scenario>): Scenario | null {
  const scenarios = getScenarios();
  const idx = scenarios.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  scenarios[idx] = { ...scenarios[idx], ...updates };
  saveScenarios(scenarios);
  return scenarios[idx];
}

export function deleteScenario(id: string): boolean {
  const scenarios = getScenarios();
  const filtered = scenarios.filter((s) => s.id !== id);
  if (filtered.length === scenarios.length) return false;
  saveScenarios(filtered);
  return true;
}

export function toggleScenario(id: string): Scenario | null {
  const scenarios = getScenarios();
  const idx = scenarios.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  scenarios[idx].enabled = !scenarios[idx].enabled;
  if (scenarios[idx].enabled) {
    // Reset nextRun when re-enabling
    scenarios[idx].nextRun = new Date(
      Date.now() + scenarios[idx].intervalHours * 60 * 60 * 1000
    ).toISOString();
  }
  saveScenarios(scenarios);
  return scenarios[idx];
}

// ---- Logs ----

export function getLogs(): ScenarioLog[] {
  ensureDataDir();
  if (!fs.existsSync(LOGS_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(LOGS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function addLog(log: ScenarioLog) {
  const logs = getLogs();
  logs.unshift(log); // newest first
  // Keep only the latest MAX_LOGS
  if (logs.length > MAX_LOGS) {
    logs.length = MAX_LOGS;
  }
  ensureDataDir();
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
}

// ---- Execution ----

async function sendDeviceCommand(
  deviceId: string,
  commands: { code: string; value: unknown }[]
): Promise<{ success: boolean; msg?: string }> {
  try {
    const ctx = getTuyaContext();
    const res = await ctx.request({
      method: 'POST',
      path: `/v1.0/iot-03/devices/${deviceId}/commands`,
      body: { commands },
    });
    return { success: !!res.success, msg: res.msg as string | undefined };
  } catch (err) {
    return { success: false, msg: String(err) };
  }
}

export async function executeScenario(scenario: Scenario): Promise<void> {
  console.log(`[Scheduler] Executing scenario: ${scenario.name}`);

  // Execute immediate actions (delayMinutes === 0)
  for (const action of scenario.actions.filter((a) => a.delayMinutes === 0)) {
    const result = await sendDeviceCommand(action.deviceId, action.commands);
    addLog({
      id: crypto.randomUUID(),
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      action: `Gửi lệnh đến ${action.deviceName}: ${JSON.stringify(action.commands)}`,
      timestamp: new Date().toISOString(),
      success: result.success,
      message: result.success ? 'Thành công' : (result.msg || 'Lỗi'),
    });
  }

  // Schedule delayed actions
  for (const action of scenario.actions.filter((a) => a.delayMinutes > 0)) {
    const delayMs = action.delayMinutes * 60 * 1000;
    setTimeout(async () => {
      const result = await sendDeviceCommand(action.deviceId, action.commands);
      addLog({
        id: crypto.randomUUID(),
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        action: `[Sau ${action.delayMinutes} phút] Gửi lệnh đến ${action.deviceName}: ${JSON.stringify(action.commands)}`,
        timestamp: new Date().toISOString(),
        success: result.success,
        message: result.success ? 'Thành công' : (result.msg || 'Lỗi'),
      });
    }, delayMs);
  }

  // Update lastRun and nextRun
  const scenarios = getScenarios();
  const idx = scenarios.findIndex((s) => s.id === scenario.id);
  if (idx !== -1) {
    scenarios[idx].lastRun = new Date().toISOString();
    scenarios[idx].nextRun = new Date(
      Date.now() + scenarios[idx].intervalHours * 60 * 60 * 1000
    ).toISOString();
    saveScenarios(scenarios);
  }
}

/**
 * Check all scenarios and execute any that are due.
 * Should be called periodically (e.g. every 30 seconds).
 */
export async function checkAndRunScenarios(): Promise<string[]> {
  const scenarios = getScenarios();
  const now = Date.now();
  const executed: string[] = [];

  for (const scenario of scenarios) {
    if (!scenario.enabled) continue;
    if (!scenario.nextRun) continue;

    const nextRunTime = new Date(scenario.nextRun).getTime();
    if (now >= nextRunTime) {
      await executeScenario(scenario);
      executed.push(scenario.name);
    }
  }

  return executed;
}

/**
 * Manually trigger a scenario immediately (ignoring schedule).
 */
export async function triggerScenarioNow(id: string): Promise<boolean> {
  const scenario = getScenarioById(id);
  if (!scenario) return false;
  await executeScenario(scenario);
  return true;
}
