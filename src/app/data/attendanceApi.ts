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

// export const apiCheckOut = () => request('/check-out', { method: 'POST' });
// export const apiBreakStart = () => request('/break-start', { method: 'POST' });
// export const apiBreakEnd = () => request('/break-end', { method: 'POST' });

export const apiCheckOut = () =>
  request('/check-out', { method: 'POST' });

export const apiBreakStart = () =>
  request('/break-start', { method: 'POST' });

export const apiBreakEnd = () =>
  request('/break-end', { method: 'POST' });

export const apiToday = () =>
  request('/today', { method: 'GET' });