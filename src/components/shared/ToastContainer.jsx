import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../contexts/AppContext';

const icons = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

const colors = {
  success: 'rgba(0,184,148,0.15)',
  error: 'rgba(229,9,20,0.15)',
  info: 'rgba(108,92,231,0.15)',
  warning: 'rgba(253,203,110,0.15)',
};

const borderColors = {
  success: 'rgba(0,184,148,0.4)',
  error: 'rgba(229,9,20,0.4)',
  info: 'rgba(108,92,231,0.4)',
  warning: 'rgba(253,203,110,0.4)',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl max-w-sm"
            style={{
              background: colors[toast.type] || colors.info,
              border: `1px solid ${borderColors[toast.type] || borderColors.info}`,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            initial={{ opacity: 0, y: 20, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => removeToast(toast.id)}
          >
            <span className="text-lg flex-shrink-0">{icons[toast.type] || icons.info}</span>
            <p className="text-sm text-white font-medium flex-1">{toast.message}</p>
            <button className="text-white/40 hover:text-white/80 transition-colors text-xs flex-shrink-0">✕</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
