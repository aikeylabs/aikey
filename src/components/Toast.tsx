import React, { useEffect } from 'react';
import './Toast.css';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 2000 }) => {
  console.log('[Toast] Rendering with message:', message);

  useEffect(() => {
    console.log('[Toast] Setting timer for', duration, 'ms');
    const timer = setTimeout(() => {
      console.log('[Toast] Timer expired, calling onClose');
      onClose();
    }, duration);

    return () => {
      console.log('[Toast] Cleanup - clearing timer');
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  return (
    <div className="toast">
      <span>{message}</span>
    </div>
  );
};
