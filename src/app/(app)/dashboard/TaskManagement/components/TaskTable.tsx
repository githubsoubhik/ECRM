'use client';

import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import MoreHorizRounded from '@mui/icons-material/MoreHorizRounded';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import { formatTime, type Employee, type Task } from '@/app/data/taskManagementData';
import { EmployeeAvatar, PriorityChip, StatusChip } from './TaskBadges';
import styles from '../TaskManagement.module.css';

export type TaskRow = Task & { rowNo: number; employee: Employee };

interface TaskTableProps {
  rows: TaskRow[];
  onOpenActions: (anchor: HTMLElement, task: Task) => void;
  onOpenDetails: (task: Task) => void;
}

const ROW_HEIGHT = 58;
const HEADER_HEIGHT = 46;

export default function TaskTable({ rows, onOpenActions, onOpenDetails }: TaskTableProps) {
  const columns: GridColDef<TaskRow>[] = [
    { field: 'rowNo', headerName: '#', width: 56, align: 'center', headerAlign: 'center' },
    {
      field: 'employee',
      headerName: 'Employee',
      flex: 1.4,
      minWidth: 210,
      renderCell: ({ row }) => (
        <div className={styles.empCell}>
          <EmployeeAvatar employee={row.employee} size={36} />
          <span className={styles.empName}>{row.employee.name}</span>
        </div>
      ),
    },
    {
      field: 'department',
      headerName: 'Department',
      flex: 0.9,
      minWidth: 140,
      renderCell: ({ row }) => <span className={styles.mutedCell}>{row.department}</span>,
    },
    {
      field: 'title',
      headerName: 'Task Title',
      flex: 1.8,
      minWidth: 220,
      renderCell: ({ row }) => <span className={styles.titleCell}>{row.title}</span>,
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 124,
      renderCell: ({ row }) => <PriorityChip priority={row.priority} />,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 136,
      renderCell: ({ row }) => <StatusChip status={row.status} />,
    },
    {
      field: 'dueTime',
      headerName: 'Due Time',
      width: 128,
      renderCell: ({ row }) => (
        <span className={styles.timeCell}>
          <AccessTimeRounded fontSize="small" />
          {formatTime(row.dueTime)}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 96,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <IconButton
          size="small"
          aria-label={`Actions for ${row.title}`}
          onClick={(e) => {
            e.stopPropagation();
            onOpenActions(e.currentTarget, row);
          }}
        >
          <MoreHorizRounded sx={{ color: '#161C3A' }} />
        </IconButton>
      ),
    },
  ];

  // Fixed height = header + visible rows (the grid never scrolls vertically, pagination is external)
  const gridHeight = HEADER_HEIGHT + rows.length * ROW_HEIGHT + 2;

  return (
    <div className={styles.gridScroll}>
      <div className={styles.gridInner} style={{ height: gridHeight }}>
        <DataGrid
          rows={rows}
          columns={columns.map((c) => ({ ...c, sortable: false }))}
          getRowId={(r) => r.id}
          rowHeight={ROW_HEIGHT}
          columnHeaderHeight={HEADER_HEIGHT}
          hideFooter
          disableColumnMenu
          disableColumnSorting
          disableColumnResize
          disableRowSelectionOnClick
          showColumnVerticalBorder
          showCellVerticalBorder
          onRowClick={(params) => onOpenDetails(params.row)}
          sx={{
            border: 'none',
            borderTop: '1px solid #EDEFF5',
            borderRadius: 0,
            fontFamily: 'inherit',
            fontSize: 13,
            color: '#161C3A',
            '--DataGrid-containerBackground': '#F7F8FC',
            '--DataGrid-rowBorderColor': '#EDEFF5',
            '& .MuiDataGrid-columnHeader': { backgroundColor: '#F7F8FC' },
            '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 500, fontSize: 13, color: '#161C3A' },
            '& .MuiDataGrid-columnSeparator': { display: 'none' },
            '& .MuiDataGrid-withBorderColor': { borderColor: '#EDEFF5' },
            '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center', borderColor: '#EDEFF5' },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within':
              { outline: 'none' },
            '& .MuiDataGrid-row': { cursor: 'pointer' },
            '& .MuiDataGrid-row:hover': { backgroundColor: '#FAFBFD' },
          }}
        />
      </div>
    </div>
  );
}
