'use client';

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
import { fetchWithAuth } from '../../../../../lib/fetchWithAuth';

interface AttendanceRecord {
  id: string;
  date: string;
  day: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'holiday';
}

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  status: 'present' | 'absent' | 'late' | 'leave' | 'holiday' | 'none';
  fullDateStr: string;
}

const attendanceHistory: AttendanceRecord[] = [
  { id: '1', date: '3 Sep 2026', day: 'Thu', checkIn: '09:12 AM', checkOut: '-', workHours: '-', status: 'present' },
  { id: '2', date: '1 Sep 2026', day: 'Tue', checkIn: '09:05 AM', checkOut: '06:15 PM', workHours: '9h 10m', status: 'present' },
  { id: '3', date: '2 Sep 2026', day: 'Wed', checkIn: '09:20 AM', checkOut: '06:05 PM', workHours: '8h 45m', status: 'present' },
  { id: '4', date: '4 Sep 2026', day: 'Fri', checkIn: '09:00 AM', checkOut: '06:00 PM', workHours: '9h 00m', status: 'present' },
  { id: '5', date: '5 Sep 2026', day: 'Sat', checkIn: '09:10 AM', checkOut: '05:50 PM', workHours: '8h 40m', status: 'present' },
  { id: '6', date: '7 Sep 2026', day: 'Mon', checkIn: '09:10 AM', checkOut: '06:05 PM', workHours: '8h 55m', status: 'present' },
  { id: '7', date: '9 Sep 2026', day: 'Wed', checkIn: '09:05 AM', checkOut: '06:10 PM', workHours: '9h 05m', status: 'present' },
  { id: '8', date: '10 Sep 2026', day: 'Thu', checkIn: '09:00 AM', checkOut: '06:00 PM', workHours: '9h 00m', status: 'present' },
  { id: '9', date: '11 Sep 2026', day: 'Fri', checkIn: '-', checkOut: '-', workHours: '-', status: 'leave' },
  { id: '10', date: '14 Sep 2026', day: 'Mon', checkIn: '-', checkOut: '-', workHours: '-', status: 'leave' },
  { id: '11', date: '15 Sep 2026', day: 'Tue', checkIn: '09:45 AM', checkOut: '06:10 PM', workHours: '8h 25m', status: 'late' },
  { id: '12', date: '17 Sep 2026', day: 'Thu', checkIn: '09:05 AM', checkOut: '06:00 PM', workHours: '8h 55m', status: 'present' },
  { id: '13', date: '22 Sep 2026', day: 'Tue', checkIn: '-', checkOut: '-', workHours: '-', status: 'absent' },
  { id: '14', date: '24 Sep 2026', day: 'Thu', checkIn: '-', checkOut: '-', workHours: '-', status: 'absent' },
  { id: '15', date: '29 Sep 2026', day: 'Tue', checkIn: '09:12 AM', checkOut: '06:00 PM', workHours: '8h 48m', status: 'present' },
];


const AttendancePage = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 3));
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  // Ready for API integration: Swap attendanceHistory with response data here
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>(attendanceHistory);

  /*
  // Example API fetch implementation:
  useEffect(() => {
    const fetchAttendance = async () => {
      const response = await fetch(`/api/attendance?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`);
      const data = await response.json();
      setAttendanceData(data);
    };
    fetchAttendance();
  }, [currentDate]);
  */


  
const fetchCheckin = async () => {

   const token = localStorage.getItem("token"); 

   const formData = new FormData();

  formData.append("location", "Office");
  formData.append("lat", "22.5726");
  formData.append("lng", "88.3639");


  const response = await fetchWithAuth(
  "api/attendance/check-in",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    credentials: "include",
    body: formData
  }
);

const data = await response.json();

console.log("--------------checkinData0", data);




}

useEffect(()=>{

  fetchCheckin();
}, []);

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

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: true }));
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

  return (
    <div className={styles.attendancePageWrapper}>
      {/* Breadcrumb & Header */}
      <div className={styles.topNavigation}>
        <span className={styles.breadcrumb}>Dashboard &gt; Attendance</span>
      </div>

      <div className={styles.attendanceHeader}>
        <div className={styles.headerLeft}>
          <h1>Attendance</h1>
          <p>Track your working hours, view attendance history and manage your leave requests.</p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.dateChip}>
            <Calendar size={16} />
            <span>Wed, 3 Sep 2026</span>
          </div>
          <div className={styles.statusBadgeGreen}>
            <span className={styles.dotGreen}></span>
            <span>Present</span>
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
              <p className={styles.currentDate}>Wednesday, 3 Sep 2026</p>
              <div className={styles.checkedInStatus}>
                <span className={styles.statusDotCheck}></span>
                <span>You are currently checked in</span>
              </div>
              <div className={styles.actionButtons}>
                <button
                  className={styles.checkOutBtn}
                  onClick={() => router.push('/dashboard/Attendance/mark?action=check-in')}
                >
                  <LogOut size={16} />
                  Check IN
                </button>
                <button
                  className={styles.breakBtn}
                  onClick={() => router.push('/dashboard/Attendance/mark?action=break-start')}
                >
                  <Coffee size={16} />
                  Break
                </button>
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
                <div className={styles.statValue}>18 <span className={styles.statUnit}>Days</span></div>
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
                <div className={styles.statValue}>1 <span className={styles.statUnit}>Day</span></div>
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
                <div className={styles.statValue}>2 <span className={styles.statUnit}>Days</span></div>
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
                <div className={styles.statValue}>142.5 <span className={styles.statUnit}>Hours</span></div>
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
                <Calendar size={14} className={styles.selectIcon} />
                <select className={styles.monthSelect}>
                  <option>September 2026</option>
                </select>
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
                  {attendanceData.map((record) => (
                    <tr key={record.id}>
                      <td>{record.date}</td>
                      <td>{record.day}</td>
                      <td>{record.checkIn}</td>
                      <td>{record.checkOut}</td>
                      <td>{record.workHours}</td>
                      <td>
                        <span className={`${styles.tableBadge} ${styles[record.status]}`}>
                          <span className={styles.badgeDot}></span>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
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

          {/* Recent Activity */}
          <div className={styles.recentActivity}>
            <div className={styles.activityHeader}>
              <h3>Recent Activity</h3>
              <a href="#" className={styles.viewAllLink}>View All</a>
            </div>

            <div className={styles.activityList}>
              <div className={styles.activityItem}>
                <div className={`${styles.activityIcon} ${styles.greenIconBg}`}>
                  <Clock size={16} className={styles.greenText} />
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>Checked In</p>
                  <p className={styles.activityTime}>Today, 09:12 AM</p>
                </div>
                <span className={styles.pillGreen}>On Time</span>
              </div>

              <div className={styles.activityItem}>
                <div className={`${styles.activityIcon} ${styles.orangeIconBg}`}>
                  <Clock size={16} className={styles.orangeText} />
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>Late Check-In</p>
                  <p className={styles.activityTime}>31 Aug 2026, 09:45 AM</p>
                </div>
                <span className={styles.pillOrange}>Late</span>
              </div>

              <div className={styles.activityItem}>
                <div className={`${styles.activityIcon} ${styles.redIconBg}`}>
                  <Clock size={16} className={styles.redText} />
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>Checked Out</p>
                  <p className={styles.activityTime}>29 Aug 2026, 05:50 PM</p>
                </div>
                <span className={styles.pillGray}>8h 40m</span>
              </div>

              <div className={styles.activityItem}>
                <div className={`${styles.activityIcon} ${styles.greenIconBg}`}>
                  <Clock size={16} className={styles.greenText} />
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>Checked In</p>
                  <p className={styles.activityTime}>29 Aug 2026, 09:10 AM</p>
                </div>
                <span className={styles.pillGreen}>On Time</span>
              </div>

              <div className={styles.activityItem}>
                <div className={`${styles.activityIcon} ${styles.redIconBg}`}>
                  <UserX size={16} className={styles.redText} />
                </div>
                <div className={styles.activityContent}>
                  <p className={styles.activityTitle}>Absent</p>
                  <p className={styles.activityTime}>30 Aug 2026</p>
                </div>
                <span className={styles.pillRed}>Absent</span>
              </div>
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

