import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Trash2, Calendar, ZoomIn, X, ImageIcon, Trash } from 'lucide-react';
import { CapturedPhoto } from '../types';

interface GalleryProps {
  photos: CapturedPhoto[];
  onDeletePhoto: (id: string) => void;
}

export default function Gallery({ photos, onDeletePhoto }: GalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<CapturedPhoto | null>(null);

  const handleDownload = (photo: CapturedPhoto) => {
    const link = document.createElement('a');
    link.href = photo.dataUrl;
    link.download = `snap_${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full">
      {photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-[#0F0F0F] border border-white/5 rounded-3xl text-center">
          <div className="p-5 bg-white/5 border border-white/10 rounded-full mb-4">
            <ImageIcon className="w-8 h-8 text-white/40" />
          </div>
          <h3 className="font-medium text-white text-base tracking-wide uppercase font-sans">No captures yet</h3>
          <p className="text-white/40 text-xs max-w-xs mt-1.5 leading-relaxed">
            Snapshots will automatically persist here. Try triggering the live simulator viewfinder above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="group relative bg-[#0F0F0F] border border-white/5 rounded-2xl overflow-hidden shadow-xl hover:border-white/15 transition-all flex flex-col justify-between"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-square overflow-hidden bg-black cursor-pointer" onClick={() => setSelectedPhoto(photo)}>
                  <img
                    src={photo.dataUrl}
                    alt={photo.label || 'Captured snapshot'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {/* Action overlays on hover */}
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPhoto(photo);
                      }}
                      className="p-2.5 bg-white/10 border border-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                      title="Inspect frame"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(photo);
                      }}
                      className="p-2.5 bg-white/10 border border-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePhoto(photo.id);
                      }}
                      className="p-2.5 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 rounded-xl text-red-400 transition-all"
                      title="Discard"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metadata card footer */}
                <div className="p-4 bg-[#0a0a0a]">
                  <span className="block font-medium text-white/95 text-xs truncate">
                    {photo.label || `Frame ${index + 1}`}
                  </span>
                  <span className="flex items-center gap-1 text-[9px] text-white/35 font-mono uppercase tracking-widest mt-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Lightbox / Big View Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[100] backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative max-w-4xl w-full max-h-[85vh] flex flex-col bg-[#0F0F0F] rounded-3xl overflow-hidden border border-white/5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header/toolbar */}
              <div className="px-6 py-4 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between text-white">
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-sm tracking-wide uppercase">
                    {selectedPhoto.label || 'Captured Snapshot Frame'}
                  </span>
                  <span className="text-[10px] text-white/40 font-mono tracking-widest mt-0.5">
                    {new Date(selectedPhoto.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(selectedPhoto)}
                    className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all"
                    title="Download Frame"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      onDeletePhoto(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }}
                    className="p-2.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl text-red-400 transition-all"
                    title="Discard Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal large image view */}
              <div className="flex-1 bg-black flex items-center justify-center overflow-hidden p-6">
                <img
                  src={selectedPhoto.dataUrl}
                  alt={selectedPhoto.label || 'Large snapshot'}
                  className="max-w-full max-h-[55vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
