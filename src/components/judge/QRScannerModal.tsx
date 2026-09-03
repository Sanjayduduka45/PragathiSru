import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  X,
  AlertCircle,
  ScanLine,
  Keyboard,
  RefreshCw,
  CheckCircle2,
  SwitchCamera,
} from 'lucide-react';
import { Modal } from '../ui/Modal';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (registrationId: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const [manualId, setManualId] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanning, setScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Extract PRAGATHI registration ID from scanned QR payload (PRAGATHI26|{registrationId}) or direct input
  const extractRegistrationId = (text: string): string | null => {
    if (!text) return null;
    const clean = text.trim();

    // 1. Exact pipe-delimited payload: PRAGATHI26|PRAGATHI26-XXXXXX
    if (clean.includes('|')) {
      const parts = clean.split('|').map((p) => p.trim());
      for (const part of parts) {
        const match = part.match(/^PRAGATHI(?:26)?-[A-Z0-9]{4,12}$/i);
        if (match) {
          return match[0].toUpperCase();
        }
      }
    }

    // 2. Standard pattern PRAGATHI26-XXXXXX or PRAGATHI-XXXXXX
    const match = clean.match(/PRAGATHI(?:26)?-[A-Z0-9]{4,12}/i);
    if (match) {
      return match[0].toUpperCase();
    }

    // 3. Direct domain code fallback (e.g., CSAI01, CIV01, EEE01)
    if (/^[A-Z0-9]{4,10}$/i.test(clean)) {
      return `PRAGATHI26-${clean.toUpperCase()}`;
    }

    return null;
  };

  // Stop camera stream safely
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);
    setScanning(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
      }

      // Check BarcodeDetector API support
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code'],
        });

        const scanFrame = async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const rawValue = barcodes[0].rawValue;
                const regId = extractRegistrationId(rawValue);
                if (regId) {
                  stopCamera();
                  onScanSuccess(regId);
                  return;
                }
              }
            } catch {
              // frame detection pass
            }
          }
          animationFrameRef.current = requestAnimationFrame(scanFrame);
        };

        animationFrameRef.current = requestAnimationFrame(scanFrame);
      } else {
        // Fallback info for browsers without native BarcodeDetector
        console.info('[QRScanner] BarcodeDetector not natively available. Manual input ready.');
      }
    } catch (err: any) {
      console.warn('[QRScanner] Camera stream error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings or use manual ID entry below.'
          : err.message || 'Unable to access camera.'
      );
      setHasCamera(false);
      setActiveTab('manual');
    }
  }, [facingMode, onScanSuccess, stopCamera]);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, startCamera, stopCamera]);

  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const regId = extractRegistrationId(manualId);
    if (!regId) {
      setCameraError('Invalid Registration ID format. Expected format: PRAGATHI26-XXXXXX');
      return;
    }
    stopCamera();
    onScanSuccess(regId);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Scan Project QR Code">
      <div className="space-y-4">
        {/* Tab switchers: Camera / Manual */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white text-[#004182] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Camera Scanner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white text-[#004182] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            Enter ID Manually
          </button>
        </div>

        {/* CAMERA VIEW */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            {cameraError ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-2">
                <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" />
                <p className="text-xs font-semibold text-rose-800">{cameraError}</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-rose-700 border border-rose-300 px-3 py-1.5 rounded-xl hover:bg-rose-50"
                >
                  <Keyboard className="w-3.5 h-3.5" /> Switch to Manual Entry
                </button>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />

                {/* Viewfinder Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-dashed border-blue-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-400 shadow-[0_0_8px_#60a5fa] animate-pulse" />
                    <div className="absolute -bottom-7 inset-x-0 text-center">
                      <span className="text-[11px] font-bold text-white bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-white/20">
                        Align Project QR Code
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flip camera button */}
                <button
                  type="button"
                  onClick={handleToggleCamera}
                  className="absolute bottom-3 right-3 p-2.5 rounded-full bg-slate-900/75 hover:bg-slate-900 text-white transition-colors cursor-pointer border border-white/20"
                  title="Switch Camera (Front/Rear)"
                >
                  <SwitchCamera className="w-4 h-4" />
                </button>
              </div>
            )}

            <p className="text-[11px] text-slate-500 text-center">
              Point your device camera at the project QR badge affixed to the team stall.
            </p>
          </div>
        )}

        {/* MANUAL ENTRY VIEW */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Registration ID / Team Code
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. PRAGATHI26-XXXXXX"
                value={manualId}
                onChange={(e) => {
                  setManualId(e.target.value);
                  setCameraError(null);
                }}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-[#004182] focus:ring-2 focus:ring-blue-100 bg-slate-50/50"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Enter the unique PRAGATHI26 registration code displayed on the team's project poster or ID badge.
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-[#004182] hover:bg-[#003366] text-white font-bold py-3 px-4 rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Find & Evaluate Project
            </button>
          </form>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};
