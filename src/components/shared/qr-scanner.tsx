"use client";

import { useEffect, useRef } from "react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (errorMessage: string) => void;
}

export function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const containerId = "qr-scanner-container";

  useEffect(() => {
    // Check if scanner is already initialized to prevent double rendering in React 18+ StrictMode
    if (!scannerRef.current) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true,
        supportedScanTypes: [
          Html5QrcodeScanType.SCAN_TYPE_CAMERA,
          Html5QrcodeScanType.SCAN_TYPE_FILE,
        ],
      };

      const scanner = new Html5QrcodeScanner(containerId, config, false);
      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // Pause scanning after success to prevent multiple triggers
          if (scannerRef.current) {
            try {
              scannerRef.current.pause(true);
            } catch (e) {
              console.warn("Failed to pause scanner", e);
            }
          }
          onScanSuccess(decodedText);
        },
        (errorMessage) => {
          if (onScanError) {
            // Filter out common "not found" errors which happen on every frame
            if (!errorMessage.includes("NotFound")) {
              onScanError(errorMessage);
            }
          }
        }
      );
    }

    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current
          .clear()
          .catch((err) => console.error("Failed to clear html5-qrcode scanner", err));
        scannerRef.current = null;
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <div id={containerId} className="w-full" />
      <style dangerouslySetInnerHTML={{__html: `
        #${containerId} {
          border: none !important;
        }
        #${containerId} button {
          background-color: var(--color-primary);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin: 8px;
          transition: opacity 0.2s;
        }
        #${containerId} button:hover {
          opacity: 0.9;
        }
        #${containerId} a {
          color: var(--color-primary);
        }
        #${containerId} select {
          padding: 8px;
          border-radius: 8px;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text);
          margin-bottom: 8px;
        }
      `}} />
    </div>
  );
}
