
import React, { useState, useEffect } from 'react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Allow time for fade-out animation before dismissing
        setTimeout(onDismiss, 300);
      }, 3000); // Show toast for 3 seconds

      return () => clearTimeout(timer);
    }
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg border border-gray-700 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
};

export default Toast;
