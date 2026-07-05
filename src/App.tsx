import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, QrCode, Image as ImageIcon, Sparkles, Smartphone, Check, Heart, Shield } from 'lucide-react';
import { CapturedPhoto, ActiveTab } from './types';
import { getAllPhotosFromDB, deletePhotoFromDB } from './utils/db';
import CameraCapture from './components/CameraCapture';
import QRGenerator from './components/QRGenerator';
import Gallery from './components/Gallery';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('capture');
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Load photos on mount
  useEffect(() => {
    async function loadPhotos() {
      try {
        const storedPhotos = await getAllPhotosFromDB();
        setPhotos(storedPhotos);
      } catch (err) {
        console.error('Failed to load photos from IndexedDB:', err);
      }
    }
    loadPhotos();
  }, []);

  // Notification helper
  const triggerNotification = (message: string) => {
    setShowNotification(message);
    setTimeout(() => {
      setShowNotification(null);
    }, 3000);
  };

  // Handle new photo capture
  const handlePhotoSaved = (newPhoto: CapturedPhoto) => {
    setPhotos((prev) => [newPhoto, ...prev]);
    triggerNotification('Photo successfully saved to your Gallery!');
  };

  // Handle delete photo
  const handleDeletePhoto = async (id: string) => {
    try {
      await deletePhotoFromDB(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      triggerNotification('Photo deleted.');
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] selection:bg-white/10 selection:text-white font-sans transition-colors duration-200 pb-20">
      
      {/* Floating Success Alert Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] max-w-sm w-[90%] bg-[#0F0F0F] border border-white/10 text-white rounded-2xl shadow-2xl px-5 py-3.5 flex items-center space-x-3 backdrop-blur-md"
            id="toast-notification"
          >
            <div className="p-1.5 bg-emerald-500/25 text-emerald-400 rounded-lg">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold flex-1">{showNotification}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Header */}
      <header className="sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
              <div className="w-3 h-3 bg-black"></div>
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-wider text-white uppercase font-sans">
                SNAP-QR PRO
              </h1>
              <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase font-mono block leading-none mt-0.5">
                AUTOMATIC ENGINE v2.4.0
              </span>
            </div>
          </div>

          {/* Quick Counter / Latency Indicators */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-2">
              <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[9px] font-bold text-white/60 uppercase tracking-widest font-mono">
                GPS LOCK ACTIVE
              </span>
              <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[9px] font-bold text-green-400 uppercase tracking-widest font-mono">
                0ms Latency
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0F0F0F] border border-white/5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-white/70 font-mono tracking-widest">
                {photos.length} ARCHIVED
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-12 space-y-12">
        
        {/* Step Flow Banner & Nav Buttons */}
        <section className="flex flex-col items-center justify-center text-center space-y-6">
          <div className="max-w-xl space-y-3">
            <span className="text-[10px] tracking-[0.3em] font-black text-emerald-400 uppercase font-mono">
              HIGH-FIDELITY PIPELINE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extralight italic text-white tracking-tight font-serif">
              Instant Photo-to-QR Workflow
            </h2>
            <p className="text-white/50 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
              Capture snapshots immediately saved to your premium offline gallery, then encode values using the vector QR rendering core.
            </p>
          </div>

          {/* Flow Stepper Nav Buttons */}
          <div className="inline-flex p-1 bg-[#0F0F0F] border border-white/5 rounded-2xl shadow-2xl gap-1">
            <button
              onClick={() => setActiveTab('capture')}
              className={`px-5 sm:px-7 py-3 rounded-xl font-bold text-[11px] tracking-wider uppercase transition-all flex items-center space-x-2 ${
                activeTab === 'capture'
                  ? 'bg-white text-black shadow-lg border border-white/20'
                  : 'text-white/40 hover:text-white/80 font-medium'
              }`}
              id="tab-capture"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Step 01. Capture Feed</span>
            </button>

            <button
              onClick={() => setActiveTab('qr')}
              className={`px-5 sm:px-7 py-3 rounded-xl font-bold text-[11px] tracking-wider uppercase transition-all flex items-center space-x-2 ${
                activeTab === 'qr'
                  ? 'bg-white text-black shadow-lg border border-white/20'
                  : 'text-white/40 hover:text-white/80 font-medium'
              }`}
              id="tab-qr"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Step 02. QR Encode</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`px-5 sm:px-7 py-3 rounded-xl font-bold text-[11px] tracking-wider uppercase transition-all flex items-center space-x-2 ${
                activeTab === 'gallery'
                  ? 'bg-white text-black shadow-lg border border-white/20'
                  : 'text-white/40 hover:text-white/80 font-medium'
              }`}
              id="tab-gallery"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Step 03. Gallery</span>
            </button>
          </div>
        </section>

        {/* Tab Viewport Frame */}
        <section className="min-h-[420px]">
          <AnimatePresence mode="wait">
            {activeTab === 'capture' ? (
              <motion.div
                key="capture-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <CameraCapture
                  onPhotoSaved={handlePhotoSaved}
                  onRedirectToQR={() => setActiveTab('qr')}
                />
              </motion.div>
            ) : activeTab === 'qr' ? (
              <motion.div
                key="qr-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
              >
                <QRGenerator onBackToCapture={() => setActiveTab('capture')} />
              </motion.div>
            ) : (
              <motion.div
                key="gallery-pane"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8 animate-fade-in"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0F0F0F] border border-white/5 rounded-3xl p-6 shadow-xl">
                  <div>
                    <span className="text-[10px] tracking-[0.2em] font-bold text-white/40 uppercase font-mono block">
                      LOCAL DATABASE STORAGE
                    </span>
                    <h3 className="text-white font-light italic text-xl font-serif mt-1 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-white/50" /> Secure Sandbox Gallery
                    </h3>
                    <p className="text-white/45 text-xs mt-1 max-w-sm leading-relaxed">
                      Photos are synchronized entirely client-side using private IndexedDB blocks inside your sandbox environment.
                    </p>
                  </div>

                  {photos.length > 0 && (
                    <span className="text-[10px] font-bold font-mono tracking-wider text-white/60 border border-white/10 px-3.5 py-1.5 rounded-full bg-white/5">
                      {photos.length} FILE{photos.length > 1 ? 'S' : ''} DETECTED
                    </span>
                  )}
                </div>

                <Gallery photos={photos} onDeletePhoto={handleDeletePhoto} />
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {/* Footer metadata */}
      <footer className="border-t border-white/10 py-12 mt-20 text-center bg-black">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-mono">
            © 2026 SNAP-LINK SYSTEM — ENGINE v2.4.0
          </p>
          <div className="flex gap-6 items-center flex-wrap justify-center">
            <div className="flex items-center gap-2 text-[10px] text-white/50 tracking-widest font-mono">
              <Shield className="w-3.5 h-3.5 text-white/40" /> ENCRYPTION: AES-256
            </div>
            <div className="flex items-center gap-2 text-[10px] text-white/50 tracking-widest font-mono">
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" /> SANDBOX OFFLINE
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
