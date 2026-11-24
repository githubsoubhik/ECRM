import { fetchWithAuth } from "../../../lib/fetchWithAuth";

const API = process.env.NEXT_PUBLIC_API_URL;

export interface Coords {
  lat: number;
  lng: number;
}

async function request(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}/api/attendance${path}`, {
    credentials: 'include', // cookie auth. For a Bearer token, add it to headers below
    ...init,
    headers: {
      // Authorization: `Bearer ${localStorage.getItem('token')}`,
      ...(init.headers || {}),
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  return data;
}

export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mime });
}

// Best-effort location. Never blocks attendance if the user denies it.
export function getCoords(): Promise<Coords | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { timeout: 4000, maximumAge: 60000 }
    );
  });
}

// Photo is OPTIONAL for now: pass null to check in without one.
export async function apiCheckIn(photoDataUrl: string | null, employeeId: string, coords: Coords | null) {
  const form = new FormData();
  if (photoDataUrl) form.append('checkInPhoto', dataUrlToFile(photoDataUrl, `${employeeId}_checkin.jpg`));
  if (coords) {
    form.append('lat', String(coords.lat));
    form.append('lng', String(coords.lng));
  }
  return request('/check-in', { method: 'POST', body: form }); // no Content-Type: browser sets it


}

// attendanceApi.ts
export async function apiToday() {
  const res = await fetchWithAuth('/api/attendance/today', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load today’s attendance');
  return res.json(); // { success, data }
}


export async function apiEmployeeMonth(employeeId: string, month: string) {
  const res = await fetchWithAuth(
    `/api/attendance/employee/${encodeURIComponent(employeeId)}?month=${month}`,
    { credentials: 'include' }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Failed to load attendance history');
  return json; // { success, count, data: [...] }
}

// all   attendance 

export async function apiAllAttendance(date: string) {
  return request(`/all?date=${encodeURIComponent(date)}`, {
    method: 'GET',
  });
}


export const apiCheckOut = () => request('/check-out', { method: 'POST' });
export const apiBreakStart = () => request('/break-start', { method: 'POST' });
export const apiBreakEnd = () => request('/break-end', { method: 'POST' });



export async function apiUpdateAttendance(
  employeeId: string,
  date: string,
  body: {
    status?: string;
    checkIn?: string | null;   // "09:30" (IST) or null to clear
    checkOut?: string | null;
    remarks?: string;
  }
) {
  const res = await fetchWithAuth(
    `/api/attendance/employee/${encodeURIComponent(employeeId)}/${date}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Unable to update attendance');
  return json;
}



export async function apiBulkUpdateAttendance(
  updates: {
    employeeId: string;   
    date: string;
    status?: string;
    checkIn?: string | null;  
    checkOut?: string | null;
    remarks?: string;
  }[]) {
  const res = await fetchWithAuth('/api/attendance/bulk', {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updates }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.message || 'Unable to bulk update attendance');
  return json;
}