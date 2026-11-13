
'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  apiToday,
  apiCheckIn,
  apiCheckOut,
  apiBreakStart,
  apiBreakEnd,
  getCoords,
} from '@/app/data/attendanceApi';

export function useAttendance() {
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's attendance
  const refreshAttendance = useCallback(async () => {
    try {
      setError(null);

      const response = await apiToday();

      setAttendance(response.data);
      return response.data;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong'
      );
      throw err;
    }
  }, []);

  // Initial API fetch
  useEffect(() => {
    refreshAttendance()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshAttendance]);

  // Check in
  const checkIn = async (
    photo: string | null,
    employeeId: string
  ) => {
    const coords = await getCoords();

    const response = await apiCheckIn(
      photo,
      employeeId,
      coords
    );

    await refreshAttendance();

    return response;
  };

  // Check out
  const checkOut = async () => {
    const response = await apiCheckOut();

    await refreshAttendance();

    return response;
  };

  // Break start
  const breakStart = async () => {
    const response = await apiBreakStart();

    await refreshAttendance();

    return response;
  };

  // Break end
  const breakEnd = async () => {
    const response = await apiBreakEnd();

    await refreshAttendance();

    return response;
  };

  return {
    attendance,
    loading,
    error,
    checkIn,
    checkOut,
    breakStart,
    breakEnd,
    refreshAttendance,
  };
}
