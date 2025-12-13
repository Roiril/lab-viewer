"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ErrorToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export const ErrorToast = ({
  message,
  onClose,
  duration = 5000,
}: ErrorToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] animate-in slide-in-from-right-5 duration-300">
      <div className="bg-red-600/90 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-2xl border border-red-500/50 flex items-center gap-3 min-w-[300px] max-w-[500px]">
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-white/80 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

