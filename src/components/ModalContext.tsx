import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertCircle, HelpCircle, X } from 'lucide-react';

interface ModalConfig {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ModalContextType {
  confirm: (config: Omit<ModalConfig, 'onConfirm' | 'onCancel'>) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ModalConfig | null>(null);
  const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>();

  const confirm = useCallback((modalConfig: Omit<ModalConfig, 'onConfirm' | 'onCancel'>) => {
    setIsOpen(true);
    setConfig({
      ...modalConfig,
      onConfirm: () => {
        setIsOpen(false);
        resolvePromise?.(true);
      },
      onCancel: () => {
        setIsOpen(false);
        resolvePromise?.(false);
      }
    });
    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, [resolvePromise]);

  const handleConfirm = () => {
    setIsOpen(false);
    resolvePromise?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolvePromise?.(false);
  };

  return (
    <ModalContext.Provider value={{ confirm }}>
      {children}
      
      {/* Modal Overlay */}
      {isOpen && config && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={handleCancel}></div>
          
          <div className="relative bg-white w-full max-w-md rounded-[40px] shadow-2xl border-4 border-white overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Icon */}
            <div className={`h-32 flex items-center justify-center ${
              config.type === 'danger' ? 'bg-rose-50 text-rose-500' : 
              config.type === 'warning' ? 'bg-amber-50 text-amber-500' : 
              'bg-blue-50 text-blue-500'
            }`}>
              {config.type === 'danger' ? <AlertCircle size={64} strokeWidth={2} /> : 
               config.type === 'warning' ? <AlertCircle size={64} strokeWidth={2} /> : 
               <HelpCircle size={64} strokeWidth={2} />}
            </div>

            <button 
              onClick={handleCancel}
              className="absolute top-6 right-6 p-2 bg-white/50 hover:bg-white rounded-2xl text-slate-400 transition-all"
            >
              <X size={20} strokeWidth={3} />
            </button>

            <div className="p-10 text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{config.title}</h3>
                <p className="text-slate-500 font-bold leading-relaxed">{config.message}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95 text-[10px]"
                >
                  {config.cancelLabel || 'ยกเลิก'}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-white transition-all active:scale-95 text-[10px] shadow-lg ${
                    config.type === 'danger' ? 'bg-rose-600 shadow-rose-200 hover:bg-rose-700' : 
                    config.type === 'warning' ? 'bg-amber-500 shadow-amber-200 hover:bg-amber-600' : 
                    'bg-blue-600 shadow-blue-200 hover:bg-blue-700'
                  }`}
                >
                  {config.confirmLabel || 'ยืนยัน'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
