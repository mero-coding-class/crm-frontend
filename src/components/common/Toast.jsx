import React, { useEffect, useRef } from "react";
import "./Toast.css";

const Toast = ({ message, type = "success", onClose, duration = 6000 }) => {
  // Keep latest onClose without causing timer to reset on each render
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Start a single timer on mount; call the latest onClose from ref
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        onCloseRef.current && onCloseRef.current();
      } catch {}
    }, duration);
    return () => clearTimeout(timer);
    // Intentionally run once on mount to avoid resets by parent re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";

  return (
    <div
      className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded shadow-lg z-50 animate-fade-in-down`}
    >
      {message}
    </div>
  );
};

export default Toast;
