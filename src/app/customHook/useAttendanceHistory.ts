import { useCallback, useEffect, useState } from 'react';
import { apiAllAttendance, apiEmployeeMonth } from '@/app/data/attendanceApi';
import { fetchWithAuth } from '../../../lib/fetchWithAuth';

export interface ApiRecord {
  _id: string;
  employeeId: string;
  dateKey: string;            // "2026-11-14"
  checkIn?: string | null;
  checkOut?: string | null;
  workMinutes: number;
  status: 'Present' | 'Late' | 'Absent' | 'Leave' | 'Half Day';
}


export interface DailyAttendanceRecord {
  _id: string;
  employeeId: string;
  department?: string;
  dateKey: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workMinutes: number;
  status: string;
  breaks?: {
    start: string;
    end?: string | null;
  }[];
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
  }, [employeeId, month, date]);

  useEffect(() => { load(); }, [load]);

  return { records, loading, error, refetch: load };
}



// get all attendance records for a specific date

export function useAllAttendance(date: string) {
  const [records, setRecords] = useState<DailyAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!date) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiAllAttendance(date);

      if (!response.success) {
        throw new Error(response.message || 'Unable to fetch attendance');
      }

      setRecords(response.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to fetch attendance'
      );
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return {
    records,
    loading,
    error,
    refetch: fetchRecords,
  };
}



