import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-4 max-w-md w-full sm:w-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              flex items-center gap-4 p-5 rounded-[24px] shadow-2xl border-2 animate-in slide-in-from-right-10 fade-in duration-300
              ${toast.type === 'success' ? 'bg-white border-emerald-100 text-emerald-800' : 
                toast.type === 'error' ? 'bg-white border-rose-100 text-rose-800' : 
                toast.type === 'warning' ? 'bg-white border-amber-100 text-amber-800' :
                'bg-white border-blue-100 text-blue-800'}
            `}
          >
            <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center
              ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 
                toast.type === 'error' ? 'bg-rose-50 text-rose-500' : 
                toast.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                'bg-blue-50 text-blue-500'}
            `}>
              {toast.type === 'success' ? <CheckCircle2 size={24} strokeWidth={2.5} /> : 
               toast.type === 'error' ? <XCircle size={24} strokeWidth={2.5} /> : 
               toast.type === 'warning' ? <AlertTriangle size={24} strokeWidth={2.5} /> :
               <Info size={24} strokeWidth={2.5} />}
            </div>
            <p className="font-bold text-sm leading-tight flex-grow">{toast.message}</p>
            <button 
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-slate-50 rounded-lg transition-colors text-slate-400"
            >
              <X size={18} strokeWidth={3} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
