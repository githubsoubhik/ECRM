'use client';

import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import styles from '../TaskManagement.module.css';

type PageItem = number | 'gap-start' | 'gap-end';

function getPageItems(page: number, count: number): PageItem[] {
  if (count <= 5) return Array.from({ length: count }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, 4, 'gap-end', count];
  if (page >= count - 2) return [1, 'gap-start', count - 3, count - 2, count - 1, count];
  return [1, 'gap-start', page - 1, page, page + 1, 'gap-end', count];
}

interface PagerProps {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

export default function Pager({ page, pageCount, onChange }: PagerProps) {
  return (
    <nav className={styles.pager} aria-label="Task pages">
      <button
        type="button"
        className={styles.pageBtn}
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeftRounded fontSize="small" />
      </button>

      {getPageItems(page, pageCount).map((item) =>
        typeof item === 'number' ? (
          <button
            type="button"
            key={item}
            className={`${styles.pageBtn} ${item === page ? styles.pageActive : ''}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ) : (
          <span key={item} className={styles.pageGap}>
            …
          </span>
        ),
      )}

      <button
        type="button"
        className={styles.pageBtn}
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRightRounded fontSize="small" />
      </button>
    </nav>
  );
}
