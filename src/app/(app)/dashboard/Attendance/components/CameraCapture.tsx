'use client';

// src/app/dashboard/Attendance/components/CameraCapture.tsx
// Works with laptop webcams and phone cameras (front/back switch included).
// In auto mode the camera keeps sampling frames and captures by itself once the
// frame is good for SCAN_STREAK samples in a row.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Check, RefreshCw, RotateCcw, ScanFace, ShieldAlert, Video } from 'lucide-react';
import styles from '../mark/mark.module.css';
import {
  ACTION_META,
  AttendanceAction,
  CaptureMetrics,
  SCAN_INTERVAL_MS,
  SCAN_RETRY_MS,
  SCAN_STREAK,
  LIVENESS_MIN_MOTION,
  frameQuality,
} from '@/app/data/employeeData';
import { Stage } from './VerificationSteps';

export interface CaptureResult {
  dataUrl: string;
  metrics: CaptureMetrics;
}

interface Props {
  stage: Stage;
  action: AttendanceAction;
  photo: string | null;
  autoStart?: boolean;
  autoScan: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onStageChange: (stage: Stage) => void;
  onCapture: (capture: CaptureResult) => void;
  onToggleAutoScan: () => void;
  onSubmit: () => void;   // NEW: user confirms the captured photo
  onRetake: () => void;   // NEW: user wants to take another picture
}

type Facing = 'user' | 'environment';

export default function CameraCapture({
  stage, action, photo, autoStart, autoScan, disabled, disabledReason,
  onStageChange, onCapture, onToggleAutoScan, onSubmit, onRetake,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const streakRef = useRef(0);
  const firedRef = useRef(false);
  const prevFrameRef = useRef<Float32Array | null>(null); // last sampled frame, for the liveness check
  const motionHistRef = useRef<number[]>([]);
  const lastMotionRef = useRef(-1);

  const [facing, setFacing] = useState<Facing>('user');
  const [deviceIds, setDeviceIds] = useState<string[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState('Looking for a face…');
  const [progress, setProgress] = useState(0);
  const [liveReady, setLiveReady] = useState(false); // true once the feed proves it is live

  const meta = ACTION_META[action];
  const live = stage === 'live';

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(
    async (opts?: { facing?: Facing; deviceId?: string }) => {
      setError(null);
      streakRef.current = 0;
      firedRef.current = false;
      prevFrameRef.current = null;
      motionHistRef.current = [];
      lastMotionRef.current = -1;
      setLiveReady(false);
      setProgress(0);
      onStageChange('starting');

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setError('This browser cannot open a camera. Use a modern browser over HTTPS (or localhost).');
        onStageChange('error');
        return;
      }

      try {
        stopCamera();
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: opts?.deviceId
            ? { deviceId: { exact: opts.deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: opts?.facing ?? facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        // Device labels are only available after permission is granted.
        const devices = await navigator.mediaDevices.enumerateDevices();
        setDeviceIds(devices.filter((d) => d.kind === 'videoinput').map((d) => d.deviceId).filter(Boolean));

        onStageChange('live');
      } catch (err) {
        const name = (err as DOMException)?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setError('Camera permission was blocked. Allow camera access in your browser settings, then try again.');
        } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
          setError('No camera was found on this device.');
        } else if (name === 'NotReadableError') {
          setError('Another app is already using the camera. Close it and try again.');
        } else {
          setError('The camera could not be started. Please try again.');
        }
        onStageChange('error');
      }
    },
    [facing, onStageChange, stopCamera]
  );

  // Full-resolution still, used for the actual record.
  const captureFrame = useCallback((): CaptureResult | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;

    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (facing === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1); // un-mirror the selfie view
    }
    ctx.drawImage(video, 0, 0, w, h);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      metrics: { ...measure(ctx, w, h), motion: lastMotionRef.current },
    };
  }, [facing]);

  // Small, cheap frame used for the live quality + liveness check.
  const sampleMetrics = useCallback((): CaptureMetrics | null => {
    const video = videoRef.current;
    const canvas = scanCanvasRef.current;
    if (!video || !canvas || !video.videoWidth) return null;

    const w = 240;
    const h = Math.round((video.videoHeight / video.videoWidth) * w) || 180;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D | null;
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, w, h);
    const base = measure(ctx, w, h);

    // Liveness: how much did the picture change since the previous sample?
    const data = ctx.getImageData(0, 0, w, h).data;
    const step = 4 * 6;
    const gray = new Float32Array(Math.ceil(data.length / step));
    let k = 0;
    for (let i = 0; i < data.length; i += step) {
      gray[k++] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    const prev = prevFrameRef.current;
    let motion = -1;
    if (prev && prev.length === gray.length) {
      let diff = 0;
      for (let j = 0; j < gray.length; j++) diff += Math.abs(gray[j] - prev[j]);

      const hist = motionHistRef.current;
      hist.push(diff / gray.length);
      if (hist.length > 6) hist.shift();
      motion = hist.reduce((sum, v) => sum + v, 0) / hist.length;
    }
    prevFrameRef.current = gray;
    lastMotionRef.current = motion;

    return { ...base, motion };
  }, []);

  const shoot = useCallback(() => {
    if (firedRef.current) return;
    const result = captureFrame();
    if (!result) return;
    firedRef.current = true;
    onCapture(result);
  }, [captureFrame, onCapture]);

  /* ---------------- Live sampling + auto scan ---------------- */
  // Runs whenever the camera is live: it proves the feed is live and, in auto
  // mode, captures by itself once the frame is good SCAN_STREAK times in a row.
  useEffect(() => {
    if (stage !== 'live') {
      streakRef.current = 0;
      return;
    }

    const id = setInterval(() => {
      const metrics = sampleMetrics();
      if (!metrics) return;

      const quality = frameQuality(metrics);
      setHint(quality.hint);
      setLiveReady(metrics.motion >= LIVENESS_MIN_MOTION);

      if (!autoScan) return;

      if (!quality.ok) {
        streakRef.current = 0;
        setProgress(0);
        return;
      }

      streakRef.current += 1;
      setProgress(Math.min(100, (streakRef.current / SCAN_STREAK) * 100));

      if (streakRef.current >= SCAN_STREAK) {
        clearInterval(id);
        shoot();
      }
    }, SCAN_INTERVAL_MS);

    return () => clearInterval(id);
  }, [stage, autoScan, sampleMetrics, shoot]);

  // After a failed match, auto mode reopens the camera and keeps scanning.
  useEffect(() => {
    if (!autoScan || stage !== 'failed' || disabled) return;
    const t = setTimeout(() => void startCamera(), SCAN_RETRY_MS);
    return () => clearTimeout(t);
  }, [autoScan, stage, disabled, startCamera]);

  // Auto-open when the dashboard sends the user here with ?action=...
  useEffect(() => {
    if (autoStart && !disabled && stage === 'idle') {
  setTimeout(() => void startCamera(), 0);
}

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, disabled]);

  // Release the camera once the flow leaves the live stage.
  useEffect(() => {
    if (
      stage === 'idle' ||
      stage === 'review' ||
      stage === 'verifying' ||
      stage === 'matching' ||
      stage === 'success' ||
      stage === 'failed'
    )
      stopCamera();
  }, [stage, stopCamera]);

  useEffect(() => stopCamera, [stopCamera]);

  const switchCamera = () => {
    if (deviceIds.length > 1) {
      const next = (deviceIndex + 1) % deviceIds.length;
      setDeviceIndex(next);
      void startCamera({ deviceId: deviceIds[next] });
      return;
    }
    const nextFacing: Facing = facing === 'user' ? 'environment' : 'user';
    setFacing(nextFacing);
    void startCamera({ facing: nextFacing });
  };

  // NEW: throw away the captured photo and open the camera again
 const retake = () => {
  onRetake();
  onStageChange('idle');
  firedRef.current = false;
  setTimeout(() => void startCamera(), 0);
};
  const showVideo = stage === 'starting' || stage === 'live';
  const showPhoto = Boolean(photo) && stage !== 'live' && stage !== 'starting';

  return (
    <div className={styles.cameraCard}>
      <div className={`${styles.stageBox} ${live ? styles.stageBoxLive : ''}`}>
        <video
          ref={videoRef}
          className={`${styles.video} ${facing === 'user' ? styles.mirrored : ''} ${showVideo ? '' : styles.hidden}`}
          playsInline
          muted
          autoPlay
        />

        {showPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo as string} alt="Captured attendance photo" className={styles.snapshot} />
        )}

        {!showVideo && !showPhoto && (
          <div className={styles.placeholder}>
            {error ? <ShieldAlert size={30} /> : disabled ? <CameraOff size={30} /> : <Video size={30} />}
            <p className={styles.placeholderTitle}>
              {error ? 'Camera unavailable' : disabled ? disabledReason : 'Camera is off'}
            </p>
            <p className={styles.placeholderSub}>
              {error ?? (disabled ? 'Pick another action above to continue.' : `Start the camera to ${meta.label.toLowerCase()}.`)}
            </p>
          </div>
        )}

        {live && (
          <>
            <span className={styles.liveBadge}>
              <span className={styles.liveDot} />
              {autoScan ? 'Scanning' : 'Live'}
            </span>
            <span className={`${styles.bracket} ${styles.bracketTL}`} />
            <span className={`${styles.bracket} ${styles.bracketTR}`} />
            <span className={`${styles.bracket} ${styles.bracketBL}`} />
            <span className={`${styles.bracket} ${styles.bracketBR}`} />

            {autoScan && (
              <>
                <span className={styles.scanSweep} />
                <div className={styles.scanHud}>
                  <p className={styles.scanHudText}>{hint}</p>
                  <span className={styles.scanMeter}>
                    <span className={styles.scanMeterFill} style={{ width: `${progress}%` }} />
                  </span>
                </div>
              </>
            )}
          </>
        )}

        {(stage === 'verifying' || stage === 'matching') && (
          <div className={styles.scanOverlay}>
            <span className={styles.scanLine} />
            <p className={styles.scanText}>
              {stage === 'verifying' ? 'Detecting your face…' : 'Matching with employee records…'}
            </p>
          </div>
        )}

        {stage === 'success' && <div className={styles.successRing} aria-hidden />}

        {/* Buttons sit on the camera screen, like a real camera app */}
        <div className={`${styles.cameraControls} ${styles.onScreenControls}`}>
          {stage === 'idle' || stage === 'error' ? (
            <button
              type="button"
              className={styles.captureBtn}
              onClick={() => void startCamera()}
              disabled={disabled}
              style={{ ['--action' as string]: meta.color }}
            >
              {autoScan ? <ScanFace size={22} /> : <Camera size={22} />}
              <span className={styles.srOnly}>{autoScan ? 'Start scanning' : 'Open camera'}</span>
            </button>
          ) : (
            <>
              {/* Left: flip while live, "take another picture" after a capture */}
              {stage === 'review' || stage === 'failed' ? (
                <button
                  type="button"
                  className={styles.roundBtn}
                  onClick={retake}
                  aria-label="Take another picture"
                  title="Take another picture"
                >
                  <RotateCcw size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.roundBtn}
                  onClick={switchCamera}
                  disabled={stage !== 'live'}
                  aria-label="Flip camera"
                  title="Flip camera"
                >
                  <RefreshCw size={18} />
                </button>
              )}

              {/* Middle: capture. Disabled once a photo is waiting for Submit */}
              <button
                type="button"
                className={styles.captureBtn}
                onClick={shoot}
                disabled={stage !== 'live' || !liveReady}
                aria-label="Capture photo"
                title={liveReady ? 'Capture photo' : 'Waiting for a live camera feed'}
                style={{ ['--action' as string]: meta.color }}
              >
                <Camera size={22} />
                <span className={styles.srOnly}>Capture photo</span>
              </button>

              {/* Right: stop the camera. Disabled once a photo is waiting for Submit */}
              <button
                type="button"
                className={styles.roundBtn}
                onClick={() => {
                  stopCamera();
                  onStageChange('idle');
                }}
                disabled={stage !== 'live'}
                aria-label="Stop camera"
                title="Stop camera"
              >
                <CameraOff size={18} />
              </button>
            </>
          )}
        </div>

        {/* Submit bar, shown while the captured photo is on screen */}
        {stage === 'review' && (
          <div className={styles.reviewBar}>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={onSubmit}
              style={{ ['--action' as string]: meta.color }}
            >
              <Check size={20} />
              Submit
            </button>
          </div>
        )}
      </div>

      <p className={styles.cameraHint}>
        {disabled
          ? disabledReason
          : stage === 'live' && !liveReady
          ? hint
          : stage === 'live'
          ? autoScan
            ? 'Hold your face in the frame — it captures on its own'
            : 'Click the camera button to capture your photo'
          : stage === 'review'
          ? 'Happy with this photo? Tap Submit, or ↺ to take another'
          : stage === 'verifying' || stage === 'matching'
          ? 'Verifying, please hold on…'
          : stage === 'success'
          ? 'Attendance marked successfully'
          : stage === 'failed'
          ? autoScan
            ? 'Restarting the scan…'
            : 'Retake the photo to try again'
          : autoScan
          ? 'Start the scanner and look at the camera'
          : 'Click the camera button to start'}
      </p>

      <button type="button" className={styles.scanToggle} onClick={onToggleAutoScan} aria-pressed={autoScan}>
        <ScanFace size={15} />
        Auto scan: {autoScan ? 'On' : 'Off'}
      </button>

      <canvas ref={canvasRef} className={styles.hidden} />
      <canvas ref={scanCanvasRef} className={styles.hidden} />
    </div>
  );
}

// Simple frame quality check used by the live scanner and the demo verifier.
function measure(ctx: CanvasRenderingContext2D, w: number, h: number): Omit<CaptureMetrics, 'motion'> {
  const sample = ctx.getImageData(0, 0, w, h);
  const data = sample.data;
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4 * 8) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += lum;
    sumSq += lum * lum;
    count++;
  }

  const brightness = count ? sum / count : 0;
  const variance = count ? Math.max(0, sumSq / count - brightness * brightness) : 0;

  const cw = Math.max(1, Math.floor(w / 3));
  const ch = Math.max(1, Math.floor(h / 3));
  const center = ctx.getImageData(Math.floor(w / 3), Math.floor(h / 3), cw, ch).data;
  let cSum = 0;
  let cCount = 0;
  for (let i = 0; i < center.length; i += 4 * 4) {
    cSum += 0.299 * center[i] + 0.587 * center[i + 1] + 0.114 * center[i + 2];
    cCount++;
  }

  return {
    brightness,
    contrast: Math.sqrt(variance),
    centerBrightness: cCount ? cSum / cCount : 0,
  };
}  