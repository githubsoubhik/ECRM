'use client';

import dayjs, { type Dayjs } from 'dayjs';

import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  LogOut,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
  UserX,
} from 'lucide-react';
import styles from './page.module.css';
import AttendanceDetails from './components/AttendanceDetails';
import { useAuth } from '@/app/(app)/context/AuthContext';
import { useAttendanceHistory, type ApiRecord } from '@/app/customHook/useAttendanceHistory';



import { useAttendance } from '@/app/customHook/useAttendance';

interface AttendanceRecord {
  id: string;
  date: string;
  day: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'holiday' | 'halfday';
}




interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  status: AttendanceRecord['status'] | 'none';
  fullDateStr: string;
}



interface AttendanceRecord {
  id: string;
  dateKey: string;
  date: string;
  day: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  workMinutes: number;
  status: 'present' | 'absent' | 'late' | 'leave' | 'holiday' | 'halfday';
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  status: AttendanceRecord['status'] | 'none';
  fullDateStr: string;
}

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];


const fmtTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata',
      })
    : '-';

const fmtHours = (min: number) =>
  min > 0 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : '-';

const toRow = (r: ApiRecord): AttendanceRecord => {
  const [y, m, d] = r.dateKey.split('-').map(Number);
  return {
    id: r._id,
    dateKey: r.dateKey,
    date: `${d} ${MONTHS_SHORT[m - 1]} ${y}`,
    day: DAYS_SHORT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()],
    checkIn: fmtTime(r.checkIn),
    checkOut: fmtTime(r.checkOut),
    workHours: fmtHours(r.workMinutes),
    workMinutes: r.workMinutes,
    status: r.status.replace(' ', '').toLowerCase() as AttendanceRecord['status'],
  };
};


const AttendancePage = () => {
   const router = useRouter();
  
  const { user } = useAuth();
const [currentDate, setCurrentDate] = useState<Date>(
  () => new Date()
);
const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

const {
  records,
  loading: histLoading,
  error: histError,
} = useAttendanceHistory( user?.id, currentDate);



const attendanceData = useMemo(
  () => records.map(toRow).sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
  [records]
);

   // date picker handler

 // Date picker handler
const datePickerHandler = (value: Dayjs | null) => {
  if (!value || !value.isValid()) return;

  setCurrentDate(
    new Date(
      value.year(),
      value.month(),
      1
    )
  );
};


console.log("attendanceData------------------>",attendanceData);

  const getMonthName = (monthIndex: number): string => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  };

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const days: CalendarDay[] = [];
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // Previous month filler days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthDays - i,
        isCurrentMonth: false,
        status: 'none',
        fullDateStr: ''
      });
    }

    // Current month days matched against attendanceData
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${i} ${getMonthName(month).substring(0, 3)} ${year}`;
      const record = attendanceData.find((r) => r.date === dateStr);
      days.push({
        date: i,
        isCurrentMonth: true,
        status: record?.status || 'none',
        fullDateStr: dateStr
      });
    }

    // Next month filler days
    const nextDaysNeeded = 42 - days.length;
    for (let i = 1; i <= nextDaysNeeded; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        status: 'none',
        fullDateStr: ''
      });
    }

    return days;
  }, [currentDate, attendanceData]);

  const [currentTime, setCurrentTime] = useState('00:00:00 AM');


   const [currentDay, setCurrentDay] = useState('');



   
console.log("records------------------>",records);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: true }));

         setCurrentDay(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    );
      
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendarContent = () => (
    <>
      <div className={styles.calendarHeader}>
        <h3 className={styles.calendarTitle}>
          {getMonthName(currentDate.getMonth())} {currentDate.getFullYear()}
        </h3>
        <div className={styles.calendarNav}>
          <button className={styles.navBtn} onClick={handlePrevMonth} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button className={styles.navBtn} onClick={handleNextMonth} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={styles.calendarGrid}>
        <div className={styles.weekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className={styles.weekDay}>{day}</div>
          ))}
        </div>
        <div className={styles.daysGrid}>
          {calendarDays.map((day, idx) => {
            const isToday = day.date === 3 && day.isCurrentMonth && currentDate.getMonth() === 8;
            return (
              <div
                key={idx}
                className={`${styles.calendarDay} ${!day.isCurrentMonth ? styles.otherMonth : ''}`}
              >
                <div className={`${styles.dateNumber} ${isToday ? styles.activeDayCircle : ''}`}>
                  {day.date}
                </div>
                {day.isCurrentMonth && day.status !== 'none' && (
                  <span className={`${styles.dayDot} ${styles[day.status]}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.calendarLegend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.present}`} />
          Present
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.late}`} />
          Late
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.absent}`} />
          Absent
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.leave}`} />
          Leave
        </div>
      </div>
    </>
  );

  const {
  attendance,
  loading: attLoading,
  error,
  checkIn,
  checkOut,
  breakStart,
  breakEnd,
  refreshAttendance,
  refreshing,

} = useAttendance();





//todays attandance recent activity
type ActivityItem = {
  id: string;
  title: string;
  time: string;
  sortTime: number;
  badge: string;
  type: 'green' | 'orange' | 'gray' | 'red' | 'blue';
  icon: 'clock' | 'absent' | 'break';
};

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '--';
  const d = new Date(iso);
  const datePart = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
  const timePart = d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
  return `${datePart}, ${timePart}`;
};



const recentActivities = useMemo<ActivityItem[]>(() => {
  if (!attendance) return [];

  const items: ActivityItem[] = [];

  const addActivity = (
    id: string,
    title: string,
    dateValue: string,
    badge: string,
    type: ActivityItem['type'],
    icon: ActivityItem['icon']
  ) => {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return;

    items.push({
      id,
      title,
      time: date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      }),
      sortTime: date.getTime(),
      badge,
      type,
      icon,
    });
  };

  // Today's check-in
  if (attendance.checkIn) {
    const isLate = attendance.status?.toLowerCase() === 'late';

    addActivity(
      'today-check-in',
      isLate ? 'Late Check-In' : 'Checked In',
      attendance.checkIn,
      isLate ? 'Late' : 'On Time',
      isLate ? 'orange' : 'green',
      'clock'
    );
  }

  // Today's break events
  (attendance.breaks ?? []).forEach(
    (
      item: {
        start?: string | null;
        end?: string | null;
      },
      index: number
    ) => {
      if (item.start) {
        addActivity(
          `break-start-${index}`,
          'Break Started',
          item.start,
          'Break Start',
          'blue',
          'break'
        );
      }

      if (item.end) {
        addActivity(
          `break-end-${index}`,
          'Break Ended',
          item.end,
          'Break End',
          'blue',
          'break'
        );
      }
    }
  );

  // Today's check-out
  if (attendance.checkOut) {
    addActivity(
      'today-check-out',
      'Checked Out',
      attendance.checkOut,
      attendance.workHours || 'Completed',
      'gray',
      'clock'
    );
  }

  // Latest event first
  return items.sort(
    (a, b) => b.sortTime - a.sortTime
  );
}, [attendance]);

//console.log("recentActivities------------------>",recentActivities);



const state = attendance?.state ?? 'not_checked_in';



const STATE_LABEL: Record<string, string> = {
  not_checked_in: 'You have not checked in yet',
  checked_in: 'You are currently checked in',
  on_break: 'You are on a break',
  checked_out: 'You have checked out for today',
};

const STATE_STYLE: Record<string, string> = {
  not_checked_in: styles.statusNotCheckedIn,
  checked_in: styles.statusCheckedIn,
  on_break: styles.statusOnBreak,
  checked_out: styles.statusCheckedOut,
};




const STATUS_STYLE: Record<string, string> = {
  Present: styles.statusBadgeGreen,
  Late: styles.statusBadgeOrange,       // add in CSS, see step 4
  'Not Marked': styles.statusBadgeGray, // add in CSS
};

const formatTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      })
    : '--';

const go = (action: string) => router.push(`/dashboard/Attendance/mark?action=${action}&attendance=${attendance?.state}`);





//  for   card Calculation

    const CurrentMonthWorkingDays = Array.from(
  { length: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate() },
  (_, i) => new Date(currentDate.getFullYear(), currentDate.getMonth(), i + 1)
).filter(date => date.getDay() !== 0).length;

                //const currentMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();  
       

                  //console.log("attendanceData------------------>",attendanceData);
                const totalPresentDays = attendanceData.length;
                const totalAbsentDays = CurrentMonthWorkingDays - totalPresentDays;
                const totalLateDays = attendanceData.filter(r => r.status === 'late').length;
                const totalWorkHours = attendanceData.reduce((sum, r) => sum + r.workMinutes, 0);
                const totalWorkHoursFormatted = `${Math.floor(totalWorkHours / 60)}h ${totalWorkHours % 60}m`;

  return (
    <div className={styles.attendancePageWrapper}>
      {/* Breadcrumb & Header */}
      {/* <div className={styles.topNavigation}>
        <span className={styles.breadcrumb}>Dashboard &gt; Attendance</span>
      </div> */}




      <div className={styles.attendanceHeader}>
        <div className={styles.headerLeft}>
          <h1>Attendance</h1>
          <p>Track your working hours, view attendance history and manage your leave requests.</p>
        </div>
     <div className={styles.headerRight}>
  <div className={styles.dateChip}>
    <Calendar size={16} />
    <span>{currentDay}</span>
  </div>
  <div className={STATUS_STYLE[attendance?.status ?? 'Not Marked'] ?? styles.statusBadgeGray}>
    <span className={styles.dotGreen}></span>
    <span>{attendance?.status ?? 'Not Marked'}</span>
  </div>
</div>
      </div>

      <div className={styles.attendanceContainer}>
        {/* Left / Main Section */}
        <div className={styles.leftSection}>
          {/* Top Panel: Today's Attendance + Stats Cards */}
          <div className={styles.dashboardTopGrid}>
            <div className={styles.todayAttendance}>
              <h2>Todays Attendance</h2>
              <div className={styles.currentTime}>{currentTime}</div>
              <p className={styles.currentDate}><strong>{currentDay}</strong></p>
           
                        <br></br>
             {/* <div className={styles.checkedInStatus}>
  <span className={styles.statusDotCheck}></span>
  <span>{loading ? 'Loading…' : STATE_LABEL[state]}</span>
</div> */}

<div
  className={`${styles.checkedInStatus} ${
    STATE_STYLE[state] || styles.statusNotCheckedIn
  }`}
>
  <span className={styles.statusDotCheck}></span>

  <span>
    {attLoading
      ? 'Loading…'
      : STATE_LABEL[state] || 'Unknown status'}
  </span>
</div>

{attendance?.checkIn && (
  <p className={styles.currentDate}>
    In: {formatTime(attendance.checkIn)}
    {attendance.checkOut && <> &nbsp;|&nbsp; Out: {formatTime(attendance.checkOut)}</>}
  </p>
)}


        <div className={styles.actionButtons}>
          {!attLoading && attendance?.canCheckIn && (
            <button className={styles.checkOutBtn} onClick={() => go('check-in')}>
              Check In
            </button>
          )}

          {!attLoading && attendance?.canStartBreak && (
            <button className={styles.breakBtn} onClick={() => go('break-start')}>
              <Coffee size={16} /> Break
            </button>
          )}

          {!attLoading && attendance?.canEndBreak && (
            <button className={styles.breakBtn} onClick={() => go('break-end')}>
              <Coffee size={16} /> End Break
            </button>
          )}

          {!attLoading && attendance?.canCheckOut && (
            <button className={styles.checkOutBtn} onClick={() => go('check-out')}>
              <LogOut size={16} /> Check Out
            </button>
          )}
        </div>



            </div>


            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.iconContainer} ${styles.greenBg}`}>
                    <User size={18} className={styles.greenText} />
                  </div>
                </div>
                <div className={styles.statLabel}>Present</div>
                <div className={styles.statValue}>{totalPresentDays} <span className={styles.statUnit}>Days</span></div> 
                <div className={styles.progressTrack}>
                  <div className={styles.progressBar} style={{ width: '80%', backgroundColor: '#10b981' }}></div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.iconContainer} ${styles.redBg}`}>
                    <UserX size={18} className={styles.redText} />
                  </div>
                </div>
                <div className={styles.statLabel}>Absent</div>
                <div className={styles.statValue}>{totalAbsentDays} <span className={styles.statUnit}>Days <br></br> Out of <b style={{ fontSize: '20px' }}>{CurrentMonthWorkingDays}</b> Working Days</span></div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressBar} style={{ width: '10%', backgroundColor: '#ef4444' }}></div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.iconContainer} ${styles.orangeBg}`}>
                    <Clock size={18} className={styles.orangeText} />
                  </div>
                </div>
                <div className={styles.statLabel}>Late</div>
                <div className={styles.statValue}>{totalLateDays} <span className={styles.statUnit}>Days</span></div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressBar} style={{ width: '20%', backgroundColor: '#f59e0b' }}></div>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <div className={`${styles.iconContainer} ${styles.purpleBg}`}>
                    <Clock size={18} className={styles.purpleText} />
                  </div>
                </div>
                <div className={styles.statLabel}>Work Hours</div>
                <div className={styles.statValue}>{totalWorkHoursFormatted} <span className={styles.statUnit}>Hours</span></div>
                <div className={styles.progressTrack}>
                  <div className={styles.progressBar} style={{ width: '65%', backgroundColor: '#8b5cf6' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Calendar Card */}
          <div className={styles.calendarCardMobileOnly}>
            {renderCalendarContent()}
          </div>

          {/* Attendance History Table */}
          <div className={styles.attendanceHistory}>
            <div className={styles.historyHeader}>
              <h3>Attendance History</h3>
              <div className={styles.selectWrapper}>
                {/* <Calendar size={14} className={styles.selectIcon} /> */}
                {/* <select className={styles.monthSelect}>
                  <option>September 2026</option>
                </select> */}

     <LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker
    views={['year', 'month']}
    openTo="month"
    format="MMMM YYYY"
    value={dayjs(currentDate)}
    onChange={datePickerHandler}
    slotProps={{
      textField: {
        size: 'small',
        fullWidth: true,
      },
    }}
  />
</LocalizationProvider>

              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.attendanceTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Work Hours</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {histLoading && (
                    <tr><td colSpan={7}>Loading attendance history…</td></tr>
                  )}

                  {!histLoading && histError && (
                    <tr><td colSpan={7} role="alert">{histError}</td></tr>
                  )}

                  {!histLoading && !histError && attendanceData.length === 0 && (
                    <tr><td colSpan={7}>No attendance records for this month.</td></tr>
                  )}

                  {!histLoading && !histError && attendanceData.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.day}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.workHours}</td>
                      <td>
                        <span className={`${styles.tableBadge} ${styles[record.status]}`}>
                          <span className={styles.badgeDot}></span>
                          {record.status === 'halfday'
                            ? 'Half Day'
                            : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        {record.checkOut !== '-' ? (
                          <button className={styles.actionLink} onClick={() => setSelectedRecord(record)}>
                            View
                          </button>
                        ) : (
                          <span className={styles.dash}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
          
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar Section */}
        <div className={styles.rightSection}>
          {/* Desktop Calendar Card */}
          <div className={styles.calendarCard}>
            {renderCalendarContent()}
          </div>

          
          <div className={styles.recentActivity}>
  <div className={styles.activityHeader}>
    <h3>Recent Activity</h3>

    {refreshing && (
      <span className={styles.activityRefreshing}>
        Updating...
      </span>
    )}
  </div>

        <div className={styles.activityList}>
          {attLoading ? (
            <p>Loading attendance activities...</p>
          ) : error && recentActivities.length === 0 ? (
            <p role="alert">Unable to load attendance activities.</p>
          ) : recentActivities.length === 0 ? (
            <p>No attendance activity found.</p>
          ) : (
            recentActivities.map((item) => (
              <div className={styles.activityItem} key={item.id}>
                <div
                  className={`${styles.activityIcon} ${
                    item.type === 'green'
                      ? styles.greenIconBg
                      : item.type === 'orange'
                      ? styles.orangeIconBg
                      : item.type === 'red'
                      ? styles.redIconBg
                      : item.type === 'blue'
                      ? styles.blueIconBg
                      : styles.redIconBg
                  }`}
                >
                  <Clock
                    size={16}
                    className={
                      item.type === 'green'
                        ? styles.greenText
                        : item.type === 'orange'
                        ? styles.orangeText
                        : item.type === 'blue'
                        ? styles.blueText
                        : styles.redText
                    }
                  />
                </div>

                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>
                    {item.title}
                  </p>

                  <p className={styles.activityTime}>
                    {item.time}
                  </p>
                </div>

                <span
                  className={
                    item.type === 'green'
                      ? styles.pillGreen
                      : item.type === 'orange'
                      ? styles.pillOrange
                      : item.type === 'red'
                      ? styles.pillRed
                      : styles.pillGray
                  }
                >
                  {item.badge}
                </span>
              </div>
            ))
          )}

          {!attLoading && error && recentActivities.length > 0 && (
            <p className={styles.activityRefreshing}>
              Could not refresh. Showing previously loaded activities.
            </p>
          )}
        </div>
</div>

          {/* Leave Request Card */}
          <div className={styles.leaveRequest}>
            <div className={styles.leaveHeader}>
              <div className={styles.leaveIconBox}>
                <Calendar size={18} className={styles.blueText} />
              </div>
              <div className={styles.leaveText}>
                <h3>Leave Request</h3>
                <p>Need time off? Submit a leave request.</p>
              </div>
            </div>
            <button className={styles.requestLeaveBtn}>
              <Plus size={16} />
              Request Leave
            </button>
          </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {selectedRecord && (
        <div className={styles.modalOverlay} onClick={() => setSelectedRecord(null)}>
          <AttendanceDetails record={selectedRecord} onClose={() => setSelectedRecord(null)} />
        </div>
      )}
    </div>
  );
};

export default AttendancePage;  
