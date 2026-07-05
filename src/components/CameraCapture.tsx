import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, RefreshCw, Sparkles, AlertTriangle, ArrowRight, Upload, Image as ImageIcon } from 'lucide-react';
import { CapturedPhoto } from '../types';
import { savePhotoToDB } from '../utils/db';

interface CameraCaptureProps {
  onPhotoSaved: (photo: CapturedPhoto) => void;
  onRedirectToQR: () => void;
}

export default function CameraCapture({ onPhotoSaved, onRedirectToQR }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraState, setCameraState] = useState<'loading' | 'active' | 'error' | 'fallback'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  // Initialize camera
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isActive = true;

    async function startCamera() {
      setCameraState('loading');
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        
        if (!isActive) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        activeStream = mediaStream;
        setStream(mediaStream);
        setCameraState('active');
      } catch (err: any) {
        if (!isActive) return;
        console.error('Error starting camera:', err);
        setErrorMessage(
          err.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access in your browser or iframe settings.'
            : 'Could not access your camera. Make sure no other app is using it.'
        );
        setCameraState('error');
      }
    }

    startCamera();

    return () => {
      isActive = false;
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Bind the media stream to the video element whenever it is mounted and active
  useEffect(() => {
    if (cameraState === 'active' && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraState]);

  // Web Audio Shutter Sound
  const playShutterSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  };

  // Capture functionality
  const handleCapture = async () => {
    if (cameraState === 'active' && videoRef.current && canvasRef.current) {
      setIsFlashing(true);
      playShutterSound();

      setTimeout(() => setIsFlashing(false), 200);

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const inputWidth = video.videoWidth || 640;
        const inputHeight = video.videoHeight || 480;
        
        // Target aspect ratio is 3:4 (portrait)
        const targetAspectRatio = 3 / 4;
        
        let sWidth = inputWidth;
        let sHeight = inputHeight;
        let sx = 0;
        let sy = 0;
        
        if (inputWidth / inputHeight > targetAspectRatio) {
          // Input is wider than 3:4 (landscape or wide screen) - crop the sides
          sWidth = inputHeight * targetAspectRatio;
          sx = (inputWidth - sWidth) / 2;
        } else {
          // Input is taller than 3:4 (extra tall portrait) - crop top and bottom
          sHeight = inputWidth / targetAspectRatio;
          sy = (inputHeight - sHeight) / 2;
        }
        
        // Set canvas dimensions to the high-resolution portrait cropped size
        canvas.width = sWidth;
        canvas.height = sHeight;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw horizontal flip if using front camera
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        
        // Crop-draw video to canvas
        ctx.drawImage(video, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
        
        if (facingMode === 'user') {
          ctx.setTransform(1, 0, 0, 1, 0, 0); // reset matrix
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        savePhoto(dataUrl);
      }
    } else if (cameraState === 'fallback') {
      // Simulate random photo capture in case of mockup mode
      setIsFlashing(true);
      playShutterSound();
      setTimeout(() => setIsFlashing(false), 200);

      const mockDataUrl = `https://picsum.photos/seed/${Math.random()}/480/640`;
      savePhoto(mockDataUrl);
    }
  };

  // Keep a reference to latest handleCapture to avoid event listener lag or re-binding
  const handleCaptureRef = useRef(handleCapture);
  useEffect(() => {
    handleCaptureRef.current = handleCapture;
  }, [handleCapture]);

  // Volume Down hardware key listener
  useEffect(() => {
    const handleVolumeKey = (e: KeyboardEvent) => {
      if (e.key === 'VolumeDown' || e.keyCode === 25 || e.keyCode === 182) {
        e.preventDefault();
        handleCaptureRef.current();
      }
    };

    window.addEventListener('keydown', handleVolumeKey, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleVolumeKey);
    };
  }, []);

  const savePhoto = async (dataUrl: string) => {
    const newPhoto: CapturedPhoto = {
      id: crypto.randomUUID(),
      dataUrl,
      timestamp: Date.now(),
      label: `Capture #${new Date().toLocaleTimeString()}`,
    };

    setCapturedPreview(dataUrl);

    try {
      await savePhotoToDB(newPhoto);
      onPhotoSaved(newPhoto);
      onRedirectToQR();
    } catch (err) {
      console.error('Failed to save to gallery:', err);
    }
  };

  // Fallback local file upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          savePhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startFallbackMode = () => {
    setCameraState('fallback');
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="w-full max-w-md bg-[#0F0F0F] border border-white/5 rounded-3xl overflow-hidden relative shadow-2xl">
        {/* Header bar of the Capture component */}
        <div className="px-8 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white tracking-wide text-xs uppercase font-sans">
              {cameraState === 'fallback' ? 'Demo Mode: Simulator Active' : 'Step 01 Feed'}
            </span>
          </div>
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-mono">LIVE PREVIEW</span>
        </div>

        {/* Viewfinder Frame */}
        <div className="relative aspect-[3/4] bg-black flex items-center justify-center overflow-hidden">
          {/* Real Video Stream */}
          {cameraState === 'active' && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              id="camera-viewfinder"
            />
          )}

          {/* Fallback Simulator View */}
          {cameraState === 'fallback' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-tr from-[#0c0c0e] via-[#050505] to-[#121814] p-6 text-center">
              <Sparkles className="w-10 h-10 text-emerald-400 mb-3 animate-pulse" />
              <p className="text-white font-medium text-base tracking-wide uppercase">Virtual Camera Ready</p>
              <p className="text-white/40 text-xs max-w-xs mt-1.5 leading-relaxed">
                Since browser iframe constraints may block physical hardware access, our High-Fidelity Simulator has been enabled.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <button
                  onClick={handleCapture}
                  className="px-4 py-2 bg-white text-black hover:bg-[#E5E5E5] rounded-xl font-bold text-[10px] tracking-wider uppercase transition-colors flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" /> Simulate Snapshot
                </button>
                <label className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-[10px] tracking-wider uppercase transition-colors flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> Upload Photo File
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Loading view */}
          {cameraState === 'loading' && (
            <div className="flex flex-col items-center justify-center text-white/40">
              <RefreshCw className="w-8 h-8 animate-spin mb-4 text-white" />
              <span className="text-xs font-semibold tracking-wider uppercase font-mono">Initializing viewports...</span>
            </div>
          )}

          {/* Error View */}
          {cameraState === 'error' && (
            <div className="p-8 text-center flex flex-col items-center justify-center max-w-md bg-[#050505]">
              <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
              <h3 className="font-semibold text-white text-sm tracking-wider uppercase font-sans">Camera Stream Blocked</h3>
              <p className="text-white/40 text-xs mt-2 leading-relaxed">
                {errorMessage}
              </p>
              <div className="mt-6 flex flex-col gap-2 w-full">
                <button
                  onClick={startFallbackMode}
                  className="w-full px-4 py-3 bg-white text-black hover:bg-[#E5E5E5] rounded-xl font-bold text-[10px] tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Start Camera Simulator
                </button>
                <label className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-[10px] tracking-wider uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" /> Upload Local Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Corner Viewfinder Guides */}
          {cameraState !== 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-56 h-56 border border-white/10 rounded-lg relative opacity-40">
                <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-white"></div>
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-white"></div>
                <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-white"></div>
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-white"></div>
              </div>
            </div>
          )}

          {/* Offscreen Canvas for Snapshot extraction */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Camera Shutter Flash Overlay */}
          <AnimatePresence>
            {isFlashing && (
              <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-white z-50 pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Control and Shutter Bar */}
        {cameraState !== 'error' && cameraState !== 'loading' && (
          <div className="p-8 bg-[#0a0a0a] border-t border-white/5 flex flex-col items-center gap-6">
            <div className="flex items-center gap-8">
              {/* Switch camera button */}
              <button
                onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                className="w-12 h-12 rounded-full border border-white/10 hover:border-white/20 flex flex-col items-center justify-center text-white/50 hover:text-white transition-all active:scale-90"
                title="Switch Camera (Front/Rear)"
                id="switch-camera-btn"
              >
                <RefreshCw className="w-3.5 h-3.5 mb-0.5" />
                <span className="text-[8px] font-bold tracking-wider font-mono">
                  {facingMode === 'user' ? 'FRNT' : 'REAR'}
                </span>
              </button>

              {/* High precision trigger */}
              <button
                onClick={handleCapture}
                className="w-20 h-20 rounded-full border-4 border-white/25 p-1 bg-transparent hover:border-white/40 transition-all active:scale-95 flex items-center justify-center"
                id="shutter-trigger"
              >
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border border-black/10 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-black" />
                  </div>
                </div>
              </button>

              {/* Custom manual loader disguised as high-end trigger configuration */}
              <label className="w-12 h-12 rounded-full border border-white/10 hover:border-white/20 flex items-center justify-center text-white/50 hover:text-white cursor-pointer transition-colors" title="Select File to Raw Ingress">
                <span className="text-[9px] font-bold tracking-widest font-mono">RAW</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Premium Capsule Metadata Indicator */}
            <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              <p className="text-[9px] font-bold tracking-widest text-white/80 uppercase font-mono">AUTOMATIC SYNC TO SANDBOX GALLERY ENABLED</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
