// src/app/dashboard/Attendance/mark/page.tsx
'use client';

import { Suspense } from 'react';
import MarkAttendanceClient from '../components/MarkAttendanceClient';

export default function MarkAttendancePage() {
  return (
    <Suspense fallback={null}>
      <MarkAttendanceClient />
    </Suspense>
  );
}
