import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { motion } from 'motion/react';

interface DeleteConfirmModalProps {
  title: string;
  description: string;
  language: Language;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  title,
  description,
  language,
  onConfirm,
  onCancel,
}) => {
  const t = translations[language];

  return (
    <div
      id="delete-confirm-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#0e0e1c] border border-red-500/30 rounded-[28px] p-5 md:p-6 shadow-[0_10px_40px_rgba(239,68,68,0.2)] flex flex-col gap-4 text-center"
      >
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
          <Trash2 className="w-6 h-6 stroke-[2]" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
          <p className="text-xs text-white/60 leading-relaxed">{description}</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            id="cancel-delete-btn"
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
          >
            {t.cancelBtn}
          </button>
          <button
            id="confirm-delete-btn"
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 px-4 rounded-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-xs font-bold text-white shadow-lg shadow-red-950/50 transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.deleteBtn}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
