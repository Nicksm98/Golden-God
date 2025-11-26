"use client";

import { useEffect, useState } from "react";
import type { Toast, ToastType } from "@/lib/types";

let toastListeners: ((toast: Toast) => void)[] = [];

export function showToast(message: string, type: ToastType = "info") {
  const toast: Toast = {
    id: Date.now().toString(),
    message,
    type,
  };
  toastListeners.forEach((listener) => listener(toast));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (toast: Toast) => {
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    };

    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "error":
        return "bg-red-500 border-red-600";
      case "success":
        return "bg-green-500 border-green-600";
      case "warning":
        return "bg-yellow-500 border-yellow-600";
      default:
        return "bg-blue-500 border-blue-600";
    }
  };

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case "error":
        return "❌";
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="fixed top-4 right-4 z-150 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            ${getToastStyles(toast.type)}
            text-white px-6 py-4 rounded-lg shadow-xl border-2
            pointer-events-auto slide-in-bottom
            max-w-sm flex items-center gap-3
          `}
        >
          <span className="text-2xl">{getToastIcon(toast.type)}</span>
          <p className="font-semibold flex-1">{toast.message}</p>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-white hover:text-gray-200 font-bold text-xl leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
