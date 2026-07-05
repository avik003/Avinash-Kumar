import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Download, Copy, Check, Sparkles, RefreshCw, ArrowLeft } from 'lucide-react';
import QRCode from 'qrcode';

interface QRGeneratorProps {
  onBackToCapture: () => void;
}

export default function QRGenerator({ onBackToCapture }: QRGeneratorProps) {
  const [textInput, setTextInput] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [qrSize, setQrSize] = useState<number>(350);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus on mount to make it "ready to type" instantly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Live render QR Code whenever input text changes
  useEffect(() => {
    let active = true;

    async function generateQR() {
      if (!textInput.trim()) {
        setQrCodeUrl('');
        return;
      }

      setIsGenerating(true);

      try {
        const url = await QRCode.toDataURL(textInput, {
          width: qrSize,
          margin: 3,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        });

        if (active) {
          setQrCodeUrl(url);
        }
      } catch (err) {
        console.error('Error generating QR code:', err);
      } finally {
        if (active) {
          setIsGenerating(false);
        }
      }
    }

    const delayDebounce = setTimeout(() => {
      generateQR();
    }, 100);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [textInput, qrSize]);

  // Download functionality
  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    const cleanLabel = textInput.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20) || 'qr_code';
    link.download = `snapqr_${cleanLabel}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy to clipboard
  const handleCopyToClipboard = async () => {
    if (!qrCodeUrl) return;
    try {
      const res = await fetch(qrCodeUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      try {
        await navigator.clipboard.writeText(textInput);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Failed to copy to clipboard:', e);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-[#0F0F0F] border border-white/5 rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative">
      <div className="space-y-6">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <span className="text-[10px] tracking-[0.2em] font-bold text-white/40 uppercase font-mono">Step 02</span>
            <h2 className="text-xl font-light italic mt-1 font-serif text-white">
              Instant QR Encode
            </h2>
          </div>
          <span className="text-[10px] bg-white/10 border border-white/10 text-white/80 font-bold tracking-widest uppercase px-3 py-1 rounded-full font-mono">
            Online mapper
          </span>
        </div>

        {/* Typing Area */}
        <div className="space-y-3">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold font-mono">
            Input Data Source
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type or paste a link, email, text or any note..."
              className="w-full min-h-[100px] p-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors focus:ring-1 focus:ring-white/20 text-sm leading-relaxed resize-y"
              id="qr-content-input"
            />
            {textInput && (
              <button
                onClick={() => setTextInput('')}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors text-xs font-semibold uppercase tracking-wider font-mono"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Real-time QR Code viewport - rendered right below typing area */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <label className="block text-[10px] uppercase tracking-widest text-white/40 font-bold font-mono text-center">
            Generated Live QR Code
          </label>
          
          <div className="flex flex-col items-center justify-center p-6 bg-white/5 border border-white/5 rounded-2xl">
            <AnimatePresence mode="wait">
              {qrCodeUrl ? (
                <motion.div
                  key={qrCodeUrl}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative group flex flex-col items-center gap-4 w-full"
                >
                  {/* High contrast QR box */}
                  <div className="p-4 bg-white rounded-2xl shadow-inner flex items-center justify-center w-48 h-48 relative">
                    <img
                      src={qrCodeUrl}
                      alt="Active QR Code"
                      className="w-full h-full object-contain rounded-lg"
                    />
                    {isGenerating && (
                      <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center backdrop-blur-xs">
                        <RefreshCw className="w-6 h-6 animate-spin text-black" />
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-white/35 font-mono tracking-wider uppercase">
                    Scan with any mobile device
                  </span>

                  {/* Actions right under QR Code */}
                  <div className="w-full max-w-sm flex gap-3 mt-2">
                    <button
                      onClick={handleCopyToClipboard}
                      className={`flex-1 py-3 border text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                        copied
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                      }`}
                      id="copy-qr-btn"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Image
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownload}
                      className="flex-1 bg-white hover:bg-[#E5E5E5] text-black font-bold py-3 rounded-xl transition-colors uppercase text-[11px] tracking-wider flex items-center justify-center gap-1.5 shadow-md"
                      id="download-qr-btn"
                    >
                      <Download className="w-3.5 h-3.5" /> Export File
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-white/20 mx-auto mb-3 animate-pulse" />
                  <p className="text-white/40 text-xs font-mono uppercase tracking-wider">Waiting for typing input...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Double Stat Helper Box */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono">Format</span>
            <span className="text-xs font-semibold text-white/90 mt-0.5">High Density PNG</span>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono">Resolution</span>
            <span className="text-xs font-semibold text-white/90 mt-0.5">Custom SVG Vector</span>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="pt-6 mt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onBackToCapture}
          className="w-full sm:w-auto px-4 py-2 text-white/40 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:translate-x-[-2px] transition-transform uppercase tracking-wider"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Camera
        </button>

        <span className="text-[10px] text-white/35 font-mono tracking-wider uppercase hidden sm:inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-white/40" /> Vectorized rendering core
        </span>
      </div>
    </div>
  );
}
