"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { AlertCircle, HelpCircle, X } from "lucide-react";

type DialogType = "alert" | "confirm";

interface DialogConfig {
  id: string;
  type: DialogType;
  message: string;
  resolve: (value: boolean) => void;
}

interface DialogContextType {
  showAlert: (message: string) => Promise<boolean>;
  showConfirm: (message: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialogs, setDialogs] = useState<DialogConfig[]>([]);

  const showAlert = (message: string) => {
    return new Promise<boolean>((resolve) => {
      setDialogs((prev) => [
        ...prev,
        { id: Math.random().toString(), type: "alert", message, resolve },
      ]);
    });
  };

  const showConfirm = (message: string) => {
    return new Promise<boolean>((resolve) => {
      setDialogs((prev) => [
        ...prev,
        { id: Math.random().toString(), type: "confirm", message, resolve },
      ]);
    });
  };

  const closeDialog = (id: string, result: boolean) => {
    setDialogs((prev) => {
      const dialog = prev.find((d) => d.id === id);
      if (dialog) {
        dialog.resolve(result);
      }
      return prev.filter((d) => d.id !== id);
    });
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {dialogs.map((dialog) => (
        <div key={dialog.id} className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-pop border border-gray-100">
            <div className="p-6 flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${dialog.type === 'alert' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
                {dialog.type === 'alert' ? <AlertCircle size={32} /> : <HelpCircle size={32} />}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {dialog.type === 'alert' ? '알림' : '확인'}
              </h3>
              <p className="text-gray-500 font-medium whitespace-pre-wrap">{dialog.message}</p>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              {dialog.type === 'confirm' && (
                <Button 
                  variant="ghost" 
                  className="flex-1 rounded-xl py-3 border border-gray-200 bg-white"
                  onClick={() => closeDialog(dialog.id, false)}
                >
                  취소
                </Button>
              )}
              <Button 
                variant="primary" 
                className={`flex-1 rounded-xl py-3 shadow-sm ${dialog.type === 'alert' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-red-500 hover:bg-red-600'}`}
                onClick={() => closeDialog(dialog.id, true)}
              >
                확인
              </Button>
            </div>
          </div>
        </div>
      ))}
    </DialogContext.Provider>
  );
}
