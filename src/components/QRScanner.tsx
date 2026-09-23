import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Upload, AlertCircle, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { decodeQRFromImage } from '@/lib/qr-decoder';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import '@/styles/eventra-shared.css';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  fps?: number;
  qrboxSize?: number;
}

type ScanTab = 'camera' | 'upload';

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  fps = 10,
  qrboxSize = 250,
}) => {
  const [activeTab, setActiveTab] = useState<ScanTab>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // File upload state
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadSuccessCode, setUploadSuccessCode] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const mountId = 'html5qr-reader-viewport';

  // Stop current active camera stream
  const stopCamera = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
    }
    setIsScanning(false);
    setTorchOn(false);
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (cameraId?: string) => {
    setCameraError(null);
    setCameraStarting(true);

    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(mountId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        });
      }

      // Stop if currently scanning
      if (html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      // Query available cameras if not loaded
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          setCameras(devices);
          if (!cameraId && !selectedCameraId) {
            // Prefer environment (rear) camera on mobile
            const rear = devices.find(d => /back|rear|environment/i.test(d.label));
            const chosen = rear ? rear.id : devices[0].id;
            setSelectedCameraId(chosen);
            cameraId = chosen;
          }
        }
      } catch (e) {
        console.warn('Could not enumerate cameras:', e);
      }

      const cameraConfig = cameraId
        ? { deviceId: { exact: cameraId } }
        : { facingMode: 'environment' };

      await html5QrCodeRef.current.start(
        cameraConfig,
        {
          fps,
          qrbox: { width: qrboxSize, height: qrboxSize },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          onScanError?.(errorMessage);
        }
      );

      setIsScanning(true);

      // Check torch capabilities
      try {
        const capabilities = html5QrCodeRef.current.getRunningTrackCapabilities();
        if (capabilities && (capabilities as any).torch) {
          setHasTorch(true);
        }
      } catch {
        setHasTorch(false);
      }
    } catch (err: any) {
      console.error('Camera start error:', err);
      const msg = err?.message || String(err);
      if (/permission/i.test(msg)) {
        setCameraError('Camera permission denied. Please allow camera access in your browser or switch to image upload.');
      } else if (/not found|devices/i.test(msg)) {
        setCameraError('No camera found on this device. Please upload an image of the QR code instead.');
      } else {
        setCameraError('Unable to access camera. Please check camera permissions or upload a QR image.');
      }
    } finally {
      setCameraStarting(false);
    }
  }, [fps, onScanError, onScanSuccess, qrboxSize, selectedCameraId]);

  // Handle tab switching
  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera(selectedCameraId);
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
            html5QrCodeRef.current?.clear();
          });
        } else {
          html5QrCodeRef.current.clear();
        }
      }
    };
  }, []);

  // Torch toggle
  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return;
    try {
      const nextState = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any],
      });
      setTorchOn(nextState);
    } catch (e) {
      console.warn('Failed to toggle torch:', e);
    }
  };

  // Switch camera device
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCameraId(newId);
    startCamera(newId);
  };

  // Process uploaded image file
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (.png, .jpg, .jpeg, .webp).');
      return;
    }

    setUploadError(null);
    setUploadProcessing(true);
    setUploadSuccessCode(null);

    // Create preview
    const objUrl = URL.createObjectURL(file);
    setPreviewUrl(objUrl);

    try {
      const decoded = await decodeQRFromImage(file);
      setUploadSuccessCode(decoded);
      // Give visual feedback before triggering success handler
      setTimeout(() => {
        onScanSuccess(decoded);
      }, 500);
    } catch (err: any) {
      console.warn('QR file decode failed:', err);
      setUploadError(err?.message || 'Could not find a valid QR code in this image.');
    } finally {
      setUploadProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: 4,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        marginBottom: 16,
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('camera')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'camera' ? 'rgba(198,169,105,0.18)' : 'transparent',
            color: activeTab === 'camera' ? '#C6A969' : '#888',
          }}
        >
          <Camera size={14} /> Camera Scanner
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 8,
            border: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            background: activeTab === 'upload' ? 'rgba(198,169,105,0.18)' : 'transparent',
            color: activeTab === 'upload' ? '#C6A969' : '#888',
          }}
        >
          <Upload size={14} /> Upload Image
        </button>
      </div>

      {/* CAMERA TAB */}
      {activeTab === 'camera' && (
        <div style={{ position: 'relative', width: '100%', minHeight: 280, borderRadius: 16, overflow: 'hidden', background: '#0a0a0f', border: '1px solid rgba(198,169,105,0.2)' }}>
          {/* Viewport for Html5Qrcode video */}
          <div
            id={mountId}
            style={{
              width: '100%',
              minHeight: 280,
              display: cameraError ? 'none' : 'block',
            }}
          />

          {/* Camera loading state */}
          {cameraStarting && !cameraError && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(4px)',
              zIndex: 10,
            }}>
              <LoadingSpinner text="Starting camera..." />
            </div>
          )}

          {/* Camera error state */}
          {cameraError && (
            <div style={{
              padding: '2.5rem 1.5rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <AlertCircle size={22} color="#F87171" />
              </div>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.78rem', color: '#eaeaea', maxWidth: 360, lineHeight: 1.5, margin: 0,
              }}>
                {cameraError}
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => startCamera(selectedCameraId)}
                  className="ev-btn ev-btn-secondary"
                  style={{ gap: 6, fontSize: '0.75rem' }}
                >
                  <RefreshCw size={13} /> Retry Camera
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className="ev-btn ev-btn-primary"
                  style={{ gap: 6, fontSize: '0.75rem' }}
                >
                  <Upload size={13} /> Upload Image
                </button>
              </div>
            </div>
          )}

          {/* Camera Controls Bar */}
          {isScanning && !cameraError && (
            <div style={{
              position: 'absolute', bottom: 10, left: 10, right: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 12px', borderRadius: 10,
              background: 'rgba(10,10,15,0.75)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)',
              zIndex: 5,
            }}>
              {/* Camera Selector */}
              {cameras.length > 1 ? (
                <select
                  value={selectedCameraId}
                  onChange={handleCameraChange}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#C6A969',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.7rem',
                    outline: 'none',
                    cursor: 'pointer',
                    maxWidth: '65%',
                  }}
                >
                  {cameras.map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#111', color: '#eaeaea' }}>
                      {c.label || `Camera ${c.id.substring(0, 6)}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#666' }}>
                  Camera active
                </span>
              )}

              {/* Torch button */}
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px', borderRadius: 6,
                    background: torchOn ? 'rgba(198,169,105,0.25)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(198,169,105,0.3)',
                    color: torchOn ? '#C6A969' : '#888',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  <Zap size={11} /> {torchOn ? 'Flash On' : 'Flash'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* UPLOAD TAB */}
      {activeTab === 'upload' && (
        <div style={{ width: '100%' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploadProcessing && fileInputRef.current?.click()}
            style={{
              padding: '2.5rem 1.5rem',
              borderRadius: 16,
              background: dragOver ? 'rgba(198,169,105,0.06)' : 'rgba(26,26,26,0.4)',
              border: dragOver ? '2px dashed #C6A969' : '2px dashed rgba(198,169,105,0.3)',
              cursor: uploadProcessing ? 'wait' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: 14,
              transition: 'all 0.2s ease',
              position: 'relative',
              minHeight: 280,
            }}
          >
            {/* If currently processing */}
            {uploadProcessing && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <LoadingSpinner text="Scanning & enhancing QR code..." />
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: '#666', margin: 0 }}>
                  Supports both standard and dark-mode QR passes
                </p>
              </div>
            )}

            {/* If decoded successfully */}
            {!uploadProcessing && uploadSuccessCode && previewUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={previewUrl}
                    alt="Scanned QR"
                    style={{
                      maxHeight: 180,
                      maxWidth: '100%',
                      borderRadius: 12,
                      border: '2px solid #4ADE80',
                      boxShadow: '0 0 20px rgba(74,222,128,0.2)',
                    }}
                  />
                  <div style={{
                    position: 'absolute', top: -8, right: -8,
                    background: '#4ADE80', borderRadius: '50%',
                    padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 10px rgba(74,222,128,0.4)',
                  }}>
                    <CheckCircle2 size={16} color="#0a0a0f" />
                  </div>
                </div>

                <div style={{
                  padding: '6px 14px', borderRadius: 8,
                  background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#4ADE80',
                }}>
                  QR Code Detected!
                </div>
              </div>
            )}

            {/* If error state */}
            {!uploadProcessing && uploadError && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Uploaded QR"
                    style={{
                      maxHeight: 140,
                      maxWidth: '100%',
                      borderRadius: 10,
                      border: '1px solid rgba(248,113,113,0.3)',
                      opacity: 0.8,
                    }}
                  />
                )}
                <div style={{
                  padding: '8px 16px', borderRadius: 10,
                  background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.74rem', color: '#F87171',
                  maxWidth: 380, lineHeight: 1.5,
                }}>
                  {uploadError}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="ev-btn ev-btn-secondary"
                  style={{ gap: 6, fontSize: '0.75rem' }}
                >
                  <RefreshCw size={12} /> Choose Another Image
                </button>
              </div>
            )}

            {/* Initial idle state */}
            {!uploadProcessing && !uploadSuccessCode && !uploadError && (
              <>
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'rgba(198,169,105,0.08)', border: '1px solid rgba(198,169,105,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Upload size={24} color="#C6A969" />
                </div>
                <div>
                  <p style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.85rem', fontWeight: 600, color: '#eaeaea', margin: '0 0 6px',
                  }}>
                    Click to browse or drop QR image here
                  </p>
                  <p style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.7rem', color: '#666', margin: 0,
                  }}>
                    Supports PNG, JPG, WebP (standard & dark-mode passes)
                  </p>
                </div>
                <span className="ev-btn ev-btn-secondary" style={{ pointerEvents: 'none', fontSize: '0.75rem', marginTop: 4 }}>
                  Browse File
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
