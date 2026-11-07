'use client';

// src/app/dashboard/Attendance/components/VerificationSteps.tsx
import React from 'react';
import { Check, Loader2, X } from 'lucide-react';
import styles from '../mark/mark.module.css';
import { ACTION_META, AttendanceAction } from '@/app/data/employeeData';

export type Stage = 'idle' | 'starting' | 'live' | 'review' | 'verifying' | 'matching' | 'success' | 'failed' | 'error';
interface Props {
  stage: Stage;
  action: AttendanceAction;
}

type StepState = 'todo' | 'active' | 'done' | 'failed';

export default function VerificationSteps({ stage, action }: Props) {
  const meta = ACTION_META[action];

  const steps: { title: string; body: string; state: StepState }[] = [
    {
      title: 'Capture Photo',
      body: 'Allow camera access and take a clear photo of your face.',
      state:
        stage === 'idle' || stage === 'error'
          ? 'todo'
          : stage === 'starting' || stage === 'live'
          ? 'active'
          : 'done',
    },
    {
      title: 'Verify',
      body: 'Your photo is matched with your employee record.',
      state:
        stage === 'verifying' || stage === 'matching'
          ? 'active'
          : stage === 'success'
          ? 'done'
          : stage === 'failed'
          ? 'failed'
          : 'todo',
    },
    {
      title: 'Attendance Marked',
      body: `You'll see a confirmation once you are ${meta.verb}.`,
      state: stage === 'success' ? 'done' : 'todo',
    },
  ];

  return (
    <ol className={styles.steps}>
      {steps.map((step, i) => (
        <li key={step.title} className={`${styles.step} ${styles[`step_${step.state}`]}`}>
          <span className={styles.stepMarker}>
            {step.state === 'done' ? (
              <Check size={15} />
            ) : step.state === 'failed' ? (
              <X size={15} />
            ) : step.state === 'active' ? (
              <Loader2 size={15} className={styles.spin} />
            ) : (
              i + 1
            )}
          </span>
          <div>
            <p className={styles.stepTitle}>{step.title}</p>
            <p className={styles.stepBody}>{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
