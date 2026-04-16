import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import type { QrcodeErrorCallback, QrcodeSuccessCallback } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  fps?: number;
  qrboxSize?: number;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onScanError,
  fps = 10,
  qrboxSize = 250,
}) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const mountId = 'html5qr-reader';

  useEffect(() => {
    if (scannerRef.current) return;

    const successCallback: QrcodeSuccessCallback = (decodedText) => {
      onScanSuccess(decodedText);
    };

    const errorCallback: QrcodeErrorCallback = (errorMessage) => {
      onScanError?.(errorMessage);
    };

    const scanner = new Html5QrcodeScanner(
      mountId,
      {
        fps,
        qrbox: { width: qrboxSize, height: qrboxSize },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      },
      false
    );

    scanner.render(successCallback, errorCallback);
    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div id={mountId} className="w-full" />
    </div>
  );
};
