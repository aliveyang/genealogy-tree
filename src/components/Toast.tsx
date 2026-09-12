import { useEffect } from 'react';
import { Check } from 'lucide-react';

interface ToastProps {
  open: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

/** 底部居中提示条 300×44（深墨底 + 暖棕操作） */
export function Toast({ open, message, actionLabel, onAction, onClose }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-60 flex justify-center lg:bottom-6">
      <div className="pointer-events-auto flex h-11 w-[300px] max-w-[calc(100vw-32px)] items-center gap-2.5 rounded-[10px] bg-ink px-3.5 shadow-lg">
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#4E8C74] text-white">
          <Check size={11} />
        </span>
        <span className="flex-1 truncate text-[13px] text-white">{message}</span>
        {actionLabel && onAction && (
          <button type="button" onClick={onAction} className="shrink-0 text-[13px] text-[#C9A87C]">
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
