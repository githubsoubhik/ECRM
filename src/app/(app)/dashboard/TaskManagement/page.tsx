import type { Metadata } from 'next';
import MuiProviders from '@/app/(app)/components/MuiProviders';
import TaskManagement from './components/TaskManagement';

export const metadata: Metadata = {
  title: 'Task Management | Pavion Dashboard',
};

export default function TaskManagementPage() {
  return (
    <MuiProviders>
      <TaskManagement />
    </MuiProviders>
  );
}