export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  role_name: string;
  permissions: string[];
  session_timeout_min?: number;
}

const TOKEN_KEY = 'psts_auth_token';
const USER_KEY = 'psts_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserProfile | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredAuth(token: string, user: UserProfile): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(path, {
    ...options,
    headers,
  });

  if (response.status === 401 && !path.includes('/api/auth/login')) {
    clearStoredAuth();
    window.dispatchEvent(new Event('psts-unauthorized'));
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export function getReportDownloadUrl(reportId: string, format: 'PDF' | 'CSV'): string {
  const token = getStoredToken() || '';
  return `/api/reports/${reportId}/download?format=${format}&token=${encodeURIComponent(token)}`;
}
