import React from 'react';

const Loader = ({
  message = "Loading...",
  fullScreen = true,
  className = "",
}) => {
  if (fullScreen) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen bg-background flex-col ${className}`}
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        <p className="mt-4 text-lg text-textSecondary">{message}</p>
      </div>
    );
  }
  // Compact inline variant (no screen overlay/background)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary"></div>
      <p className="text-sm text-textSecondary">{message}</p>
    </div>
  );
};

export default Loader;