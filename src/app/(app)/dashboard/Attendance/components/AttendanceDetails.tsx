'use client';

import React from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Smartphone,
  Download,
  Share2
} from 'lucide-react';
import styles from '../details.module.css';

interface AttendanceRecord {
  id: string;
  date: string;
  day: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  status: 'present' | 'absent' | 'late' | 'leave' | 'holiday';
}

interface Props {
  record: AttendanceRecord | { status: 'present' | 'absent' | 'late'; count: string; label: string };
  onClose: () => void;
}

const AttendanceDetails: React.FC<Props> = ({ record, onClose }) => {
  const isSummaryCard = 'label' in record;
  const status = record.status;

  const getStatusColor = (st: string): string => {
    switch (st) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      case 'leave': return '#8b5cf6';
      case 'holiday': return '#3b82f6';
      default: return '#e5e7eb';
    }
  };

  const getStatusIcon = (st: string) => {
    switch (st) {
      case 'present': return <CheckCircle size={32} />;
      case 'absent': return <XCircle size={32} />;
      case 'late': return <AlertCircle size={32} />;
      case 'leave': return <Calendar size={32} />;
      case 'holiday': return <Calendar size={32} />;
      default: return null;
    }
  };

  return (
    <div className={styles.detailsModal} onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className={styles.detailsHeader} style={{ borderLeftColor: getStatusColor(status) }}>
        <div className={styles.headerContent}>
          <div className={styles.statusIconLarge} style={{ color: getStatusColor(status) }}>
            {getStatusIcon(status)}
          </div>
          <div className={styles.headerInfo}>
            <h2 style={{ color: getStatusColor(status), textTransform: 'capitalize' }}>
              {isSummaryCard ? `${record.label} Summary (${record.count})` : record.status}
            </h2>
            <p>{isSummaryCard ? 'September 2026 Overview' : `${record.date} • ${record.day}`}</p>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>
      </div>

      {/* Content */}
      <div className={styles.detailsContent}>
        {!isSummaryCard ? (
          <div className={styles.section}>
            <h3>Time Details</h3>
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <Clock size={16} />
                  <span>Check In</span>
                </div>
                <p className={styles.detailValue}>{(record as AttendanceRecord).checkIn || '-'}</p>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <Clock size={16} />
                  <span>Check Out</span>
                </div>
                <p className={styles.detailValue}>{(record as AttendanceRecord).checkOut || '-'}</p>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <Clock size={16} />
                  <span>Work Hours</span>
                </div>
                <p className={styles.detailValue}>{(record as AttendanceRecord).workHours || '-'}</p>
              </div>

              <div className={styles.detailItem}>
                <div className={styles.detailLabel}>
                  <Calendar size={16} />
                  <span>Date</span>
                </div>
                <p className={styles.detailValue}>{(record as AttendanceRecord).date}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.section}>
            <h3>{record.label} Overview</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Calendar size={18} />
                <div>
                  <p className={styles.infoLabel}>Total Count</p>
                  <p className={styles.infoValue}>{record.count}</p>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Clock size={18} />
                <div>
                  <p className={styles.infoLabel}>Month</p>
                  <p className={styles.infoValue}>September 2026</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Info */}
        <div className={styles.section}>
          <h3>Status Breakdown</h3>
          <div className={styles.statusInfo} style={{ borderLeftColor: getStatusColor(status) }}>
            <div className={styles.statusBadge} style={{ backgroundColor: getStatusColor(status) }}>
              <span style={{ textTransform: 'capitalize' }}>{status}</span>
            </div>
            <div className={styles.statusDescription}>
              {status === 'present' && (
                <>
                  <p className={styles.statusMessage}>✓ Full Attendance Maintained</p>
                  <p className={styles.statusDetail}>Checked in on time and successfully logged work hours.</p>
                </>
              )}
              {status === 'absent' && (
                <>
                  <p className={styles.statusMessage}>✗ Absence Logged</p>
                  <p className={styles.statusDetail}>No check-in activity recorded for this period.</p>
                </>
              )}
              {status === 'late' && (
                <>
                  <p className={styles.statusMessage}>⚠ Late Check-In</p>
                  <p className={styles.statusDetail}>Arrived after standard working schedule.</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Location & Meta Info */}
        <div className={styles.section}>
          <h3>System Metadata</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <MapPin size={18} />
              <div>
                <p className={styles.infoLabel}>Location</p>
                <p className={styles.infoValue}>Headquarters Office</p>
              </div>
            </div>
            <div className={styles.infoItem}>
              <Smartphone size={18} />
              <div>
                <p className={styles.infoLabel}>Device</p>
                <p className={styles.infoValue}>Web Client</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className={styles.detailsFooter}>
        <button className={styles.actionBtn}>
          <Download size={18} />
          <span>Export Summary</span>
        </button>
        <button className={styles.actionBtn}>
          <Share2 size={18} />
          <span>Share</span>
        </button>
        <button className={styles.closeActionBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default AttendanceDetails;