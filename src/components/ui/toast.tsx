"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType, duration = 5000) => {
      const id = Math.random().toString(36).substring(7);
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, duration?: number) => addToast(message, "success", duration),
    [addToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => addToast(message, "error", duration),
    [addToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => addToast(message, "warning", duration),
    [addToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => addToast(message, "info", duration),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Toast container component
function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        maxWidth: "400px",
        width: "100%",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

// Individual toast item
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 200);
  };

  const getStyles = () => {
    const baseStyles: React.CSSProperties = {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      padding: "16px",
      borderRadius: "12px",
      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
      pointerEvents: "auto",
      opacity: isExiting ? 0 : 1,
      transform: isExiting ? "translateX(100%)" : "translateX(0)",
      transition: "all 0.2s ease-out",
    };

    switch (toast.type) {
      case "success":
        return {
          ...baseStyles,
          backgroundColor: "#10B981",
          color: "#fff",
        };
      case "error":
        return {
          ...baseStyles,
          backgroundColor: "#EF4444",
          color: "#fff",
        };
      case "warning":
        return {
          ...baseStyles,
          backgroundColor: "#F59E0B",
          color: "#fff",
        };
      case "info":
        return {
          ...baseStyles,
          backgroundColor: "#3B82F6",
          color: "#fff",
        };
      default:
        return baseStyles;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return "ri-check-line";
      case "error":
        return "ri-close-circle-line";
      case "warning":
        return "ri-alert-line";
      case "info":
        return "ri-information-line";
      default:
        return "ri-notification-line";
    }
  };

  return (
    <div style={getStyles()}>
      <i className={getIcon()} style={{ fontSize: "20px", flexShrink: 0 }}></i>
      <p style={{ margin: 0, flex: 1, fontSize: "14px", lineHeight: "1.5" }}>
        {toast.message}
      </p>
      <button
        onClick={handleClose}
        style={{
          background: "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          padding: "0",
          opacity: 0.7,
          transition: "opacity 0.2s",
          flexShrink: 0,
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
      >
        <i className="ri-close-line" style={{ fontSize: "18px" }}></i>
      </button>
    </div>
  );
}

// Export a simple toast function for use without context (for backwards compatibility)
let globalAddToast: ((message: string, type: ToastType, duration?: number) => void) | null = null;

export function setGlobalToast(addToast: typeof globalAddToast) {
  globalAddToast = addToast;
}

export const toast = {
  success: (message: string, duration?: number) => globalAddToast?.(message, "success", duration),
  error: (message: string, duration?: number) => globalAddToast?.(message, "error", duration),
  warning: (message: string, duration?: number) => globalAddToast?.(message, "warning", duration),
  info: (message: string, duration?: number) => globalAddToast?.(message, "info", duration),
};

