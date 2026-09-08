'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-sky-500 text-white px-5 py-3.5 flex items-center justify-between">
          <h3 className="font-bold text-base tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white hover:bg-sky-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
