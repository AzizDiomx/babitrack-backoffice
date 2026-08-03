'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export interface NotificationState {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

interface NotificationModalProps {
  notification: NotificationState | null;
  onClose: () => void;
}

export default function NotificationModal({ notification, onClose }: NotificationModalProps) {
  useEffect(() => {
    if (!notification || !notification.isOpen) return;

    // Auto dismiss after 4 seconds for success/info
    if (notification.type === 'success' || notification.type === 'info') {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification || !notification.isOpen) return null;

  const { type, title, message } = notification;

  const getTheme = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200',
          iconBg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
          Icon: CheckCircle2,
          defaultTitle: 'Succès !',
          buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20',
        };
      case 'error':
        return {
          bg: 'bg-red-950/90 border-red-500/30 text-red-200',
          iconBg: 'bg-red-500/20 text-red-400 border border-red-500/30',
          Icon: XCircle,
          defaultTitle: 'Erreur',
          buttonClass: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/20',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/90 border-amber-500/30 text-amber-200',
          iconBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
          Icon: AlertTriangle,
          defaultTitle: 'Attention',
          buttonClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20',
        };
      case 'info':
      default:
        return {
          bg: 'bg-orange-950/90 border-orange-500/30 text-orange-200',
          iconBg: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
          Icon: Info,
          defaultTitle: 'Notification',
          buttonClass: 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/20',
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.Icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl border ${theme.bg} shadow-2xl p-6 relative backdrop-blur-xl space-y-4 animate-in zoom-in-95 duration-200`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.iconBg}`}>
            <IconComponent className="h-6 w-6" />
          </div>

          <div className="flex-1 pt-0.5">
            <h4 className="text-base font-bold text-white tracking-wide">
              {title || theme.defaultTitle}
            </h4>
            <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className={`rounded-xl px-5 py-2.5 text-xs font-bold transition cursor-pointer shadow-md ${theme.buttonClass}`}
          >
            D'accord
          </button>
        </div>
      </div>
    </div>
  );
}

export interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

interface ConfirmModalProps {
  confirmState: ConfirmState | null;
  onClose: () => void;
}

export function ConfirmModal({ confirmState, onClose }: ConfirmModalProps) {
  if (!confirmState || !confirmState.isOpen) return null;

  const { title, message, confirmLabel, cancelLabel, onConfirm } = confirmState;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl border border-red-500/30 bg-[#121212] shadow-2xl p-6 relative backdrop-blur-xl space-y-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="flex-1 pt-0.5">
            <h4 className="text-base font-bold text-white tracking-wide">
              {title}
            </h4>
            <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed font-medium">
              {message}
            </p>
          </div>
        </div>

        <div className="pt-3 flex justify-end gap-3 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
          >
            {cancelLabel || 'Annuler'}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-xl px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition cursor-pointer shadow-md shadow-red-600/20"
          >
            {confirmLabel || 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}
