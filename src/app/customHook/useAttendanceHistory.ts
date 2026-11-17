import { useCallback, useEffect, useState } from 'react';
import { apiEmployeeMonth } from '@/app/data/attendanceApi';

export interface ApiRecord {
  _id: string;
  employeeId: string;
  dateKey: string;            // "2026-11-14"
  checkIn?: string | null;
  checkOut?: string | null;
  workMinutes: number;
  status: 'Present' | 'Late' | 'Absent' | 'Leave' | 'Half Day';
}

export function useAttendanceHistory(employeeId: string | undefined, date: Date) {
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // string key, so the effect runs only when the month changes
  const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  const load = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      setError(null);
      const res = await apiEmployeeMonth(employeeId, month);
      setRecords(res.data ?? []);
    } catch (e) {
      setRecords([]);
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [employeeId, month]);

  useEffect(() => { load(); }, [load]);

  return { records, loading, error, refetch: load };
}