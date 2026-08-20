const BACKEND_URL: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) ||
  'http://localhost:3000';

export interface TriggerSyncPayload {
  pitchId: number;
  action: 'toggle_power' | 'set_amperage' | 'set_power_state';
  value?: number;
}

export interface ResolveHashResponse {
  pitchId: number;
  pitchName: string;
  veldNaam: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

export interface GuestPitchStatus {
  pitchId: number;
  pitchName: string;
  veldNaam: string;
  stat: number;
  gewenst: number;
  kwhnu: number;
  kwhtot: number;
  iverb: number;
  maxAmperage: number;
  errorcode: number;
}

export interface ApiError {
  error: string;
}

const TOKEN_KEY = 'blueplug_jwt_token';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  authenticated = false,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (authenticated) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BACKEND_URL}${endpoint}`;
  const res = await fetch(url, { headers, ...options });

  const body = await res.json();

  if (!res.ok) {
    const msg = (body as ApiError).error || `Request failed with status ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      clearToken();
      if (typeof window !== 'undefined') {
        window.location.replace('/login');
      }
    }
    throw new Error(msg);
  }

  return body as T;
}

export function login(username: string, password: string, remember?: boolean): Promise<LoginResponse> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password, remember }),
  });
}

export function triggerSync(payload: TriggerSyncPayload): Promise<{ success: boolean; pitchId: number; action: string }> {
  return request('/api/pitch/trigger-sync', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, true);
}

export function resolveHash(hash: string): Promise<ResolveHashResponse> {
  return request(`/api/pitch/resolve/${encodeURIComponent(hash)}`);
}

export function getGuestPitchStatus(pltsnr: number): Promise<GuestPitchStatus> {
  return request(`/api/guest/pitch/${pltsnr}`);
}

export function resetPitchError(pltsnr: number): Promise<{ success: boolean; pitchId: number }> {
  return request(`/api/guest/pitch/${pltsnr}/reset`, {
    method: 'POST',
  });
}

export interface PitchSummary {
  pitchId: number;
  pitchName: string;
  veldNaam: string;
  stat: number;
  gewenst: number;
  kwhnu: number;
  kwhtot: number;
  iverb: number;
  maxAmperage: number;
  errorcode: number;
  guestName: string | null;
}

export interface AllPitchesResponse {
  pitches: PitchSummary[];
}

export function getAllPitches(): Promise<AllPitchesResponse> {
  return request('/api/pitch/', {}, true);
}

export interface Eigenaar {
  naam?: string;
  straat?: string;
  nummer?: string;
  postcode?: string;
  plaats?: string;
  land?: string;
  telefoon?: string;
  email?: string;
  website?: string;
  kvk?: string;
  'btw-nummer'?: string;
}

export interface ManagerSettings {
  id: number;
  stroominstelling: string[];
  vrijverbruikinstelling: string[];
  sessionDurationDays: number;
  eigenaar: Eigenaar;
}

export function getSettings(): Promise<ManagerSettings> {
  return request('/api/settings', {}, true);
}

export function updateSettings(payload: { eigenaar?: Partial<Eigenaar>; sessionDurationDays?: number }): Promise<{ success: boolean }> {
  return request('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }, true);
}

// ── Failures ─────────────────────────────────────────

export interface FailureRecord {
  id: number;
  pitchId: number;
  pitchName: string;
  veldNaam: string;
  occurredAt: string;
  startMeterReading: number | null;
  resolvedAt: string | null;
  endMeterReading: number | null;
  failureCode: number;
  description: string;
  severity: 'critical' | 'high' | 'warning';
}

export interface FailuresResponse {
  failures: FailureRecord[];
  activeCount: number;
  recentResolvedCount: number;
  totalHistoricalCount: number;
}

export function getFailures(): Promise<FailuresResponse> {
  return request('/api/failures', {}, true);
}

export function resolveFailure(id: number): Promise<{ success: boolean; pitchId: number }> {
  return request(`/api/failures/${id}/resolve`, { method: 'POST' }, true);
}

export function resolveAllFailures(): Promise<{ resolved: number; pitchesAffected: number[] }> {
  return request('/api/failures/resolve-all', { method: 'POST' }, true);
}

// ── Maintenance ───────────────────────────────────────

export function testSwitches(pitchId: number): Promise<{ success: boolean; pitchId: number; message: string }> {
  return request('/api/maintenance/test-switches', {
    method: 'POST',
    body: JSON.stringify({ pitchId }),
  }, true);
}
