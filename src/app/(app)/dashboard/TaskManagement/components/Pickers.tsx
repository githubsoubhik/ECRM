'use client';

import { useState, type MouseEvent } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { MultiSectionDigitalClock } from '@mui/x-date-pickers/MultiSectionDigitalClock';
import CalendarTodayOutlined from '@mui/icons-material/CalendarTodayOutlined';
import AccessTimeRounded from '@mui/icons-material/AccessTimeRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import { DATE_LABEL_FORMAT } from '@/app/data/taskManagementData';
import styles from './Pickers.module.css';

const calendarSx = {
  width: 312,
  height: 'auto',
  maxHeight: 360,
  '& .MuiPickersCalendarHeader-label': { fontWeight: 600, fontSize: 15 },
  '& .MuiDayCalendar-weekDayLabel': { color: '#5B6280', fontWeight: 500 },
  '& .MuiPickersDay-root': { fontSize: 13, borderRadius: '8px' },
  '& .MuiPickersDay-root.Mui-selected': { backgroundColor: '#12372F', fontWeight: 600 },
  '& .MuiPickersDay-root.Mui-selected:hover': { backgroundColor: '#0B2620' },
  '& .MuiPickersDay-today:not(.Mui-selected)': { borderColor: '#12372F' },
  '& .MuiPickersYear-yearButton.Mui-selected': { backgroundColor: '#12372F' },
};

interface DateSelectProps {
  value: Dayjs | null;
  onChange: (value: Dayjs) => void;
  placeholder?: string;
  showChevron?: boolean;
  error?: boolean;
  minDate?: Dayjs;
  ariaLabel?: string;
}

/** A select-looking trigger that opens the MUI X DateCalendar in a popover. */
export function DateSelect({
  value,
  onChange,
  placeholder = 'Select Date',
  showChevron = false,
  error = false,
  minDate,
  ariaLabel = 'Select date',
}: DateSelectProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState<Dayjs | null>(value);

  const open = (e: MouseEvent<HTMLElement>) => {
    setDraft(value);
    setAnchor(e.currentTarget);
  };
  const close = () => setAnchor(null);

  return (
    <>
      <ButtonBase
        className={`${styles.trigger} ${error ? styles.triggerError : ''} ${anchor ? styles.triggerActive : ''}`}
        onClick={open}
        aria-haspopup="dialog"
        aria-label={ariaLabel}
      >
        <CalendarTodayOutlined className={styles.lead} />
        <span className={value ? styles.value : styles.placeholder}>
          {value ? value.format(DATE_LABEL_FORMAT) : placeholder}
        </span>
        {showChevron && <KeyboardArrowDownRounded className={styles.chevron} />}
      </ButtonBase>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { className: styles.popPaper } }}
      >
        <DateCalendar
          value={draft}
          minDate={minDate}
          sx={calendarSx}
          onChange={(next, selectionState) => {
            if (!next) return;
            setDraft(next);
            if (selectionState === 'finish') {
              onChange(next);
              close();
            }
          }}
        />
        <div className={styles.popFooter}>
          <Button
            size="small"
            onClick={() => {
              onChange(dayjs());
              close();
            }}
          >
            Today
          </Button>
          <Button size="small" color="inherit" onClick={close}>
            Close
          </Button>
        </div>
      </Popover>
    </>
  );
}

interface TimeSelectProps {
  value: Dayjs | null;
  onChange: (value: Dayjs) => void;
  placeholder?: string;
  error?: boolean;
}

/** A select-looking trigger that opens the MUI X MultiSectionDigitalClock in a popover. */
export function TimeSelect({ value, onChange, placeholder = 'Select Time', error = false }: TimeSelectProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState<Dayjs | null>(value);

  const open = (e: MouseEvent<HTMLElement>) => {
    setDraft(value ?? dayjs().hour(11).minute(0));
    setAnchor(e.currentTarget);
  };
  const close = () => setAnchor(null);

  return (
    <>
      <ButtonBase
        className={`${styles.trigger} ${error ? styles.triggerError : ''} ${anchor ? styles.triggerActive : ''}`}
        onClick={open}
        aria-haspopup="dialog"
        aria-label="Select time"
      >
        <AccessTimeRounded className={styles.lead} />
        <span className={value ? styles.value : styles.placeholder}>
          {value ? value.format('hh:mm A') : placeholder}
        </span>
      </ButtonBase>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { className: styles.popPaper } }}
      >
        <MultiSectionDigitalClock
          value={draft}
          timeSteps={{ hours: 1, minutes: 5 }}
          onChange={(next) => next && setDraft(next)}
          sx={{
            '& .MuiMultiSectionDigitalClockSection-item.Mui-selected': { backgroundColor: '#12372F' },
            '& .MuiMultiSectionDigitalClockSection-item.Mui-selected:hover': { backgroundColor: '#0B2620' },
          }}
        />
        <div className={styles.popFooter}>
          <Button size="small" color="inherit" onClick={close}>
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => {
              if (draft) onChange(draft);
              close();
            }}
          >
            Done
          </Button>
        </div>
      </Popover>
    </>
  );
}
