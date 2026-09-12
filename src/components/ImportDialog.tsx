import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2, Upload } from 'lucide-react';
import { ImportPhase } from '../types';

interface ImportDialogProps {
  open: boolean;
  phase: ImportPhase;
  fileName: string;
  onClose: () => void;
  onConfirm: () => void;
  onRetry: () => void;
  onSimulateError: () => void;
}

const SKIPPED = [
  { line: '#128', reason: '缺少「姓名」字段' },
  { line: '#147', reason: '缺少「姓名」字段' },
  { line: '#163', reason: '出生日期无法识别 · 1962/02' },
];

/** 演示口径：与设计稿一致的虚构总量 */
const TOTAL_RECORDS = 200;
const TOTAL_PEOPLE = 197;
const TOTAL_MARRIAGES = 84;

/** 进度对应的三阶段：解析结构 → 建立关系 → 生成布局 */
const STAGES = ['正在解析文件结构…', '正在建立亲属关系…', '正在生成族谱布局…'];
const CHECKLIST = ['解析文件结构', '建立亲属关系', '生成族谱布局'];

function stageOf(progress: number): number {
  if (progress < 40) return 0;
  if (progress < 75) return 1;
  return 2;
}

/** 导入 GEDCOM —— 进行中 / 失败 / 部分成功 */
export function ImportDialog({
  open,
  phase,
  fileName,
  onClose,
  onConfirm,
  onRetry,
  onSimulateError,
}: ImportDialogProps) {
  const [progress, setProgress] = useState(12);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!open || phase !== 'loading') return;
    setProgress(12);
    const timer = window.setInterval(() => {
      setProgress(p => (p >= 96 ? p : p + 6));
    }, 260);
    return () => window.clearInterval(timer);
  }, [open, phase]);

  useEffect(() => {
    if (!open) setCompleted(new Set());
  }, [open]);

  if (!open) return null;

  const isError = phase === 'error';
  const isPartial = phase === 'partial';
  const stage = stageOf(progress);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} />

      <div className="relative w-[480px] max-w-full rounded-[16px] bg-surface p-7 shadow-2xl">
        {/* 图标 */}
        <div
          className={[
            'mb-4 flex h-14 w-14 items-center justify-center rounded-full',
            isError ? 'bg-danger-soft text-danger' : isPartial ? 'bg-accent-soft text-accent' : 'bg-primary-tint text-primary',
          ].join(' ')}
        >
          {isError || isPartial ? <AlertTriangle size={26} /> : <Upload size={24} />}
        </div>

        <h2 className="mb-2 font-serif text-[19px] leading-7 font-semibold text-ink">
          {phase === 'loading' && '导入 GEDCOM 文件'}
          {isError && '导入失败'}
          {isPartial && '导入完成，3 条记录已跳过'}
        </h2>

        <p className="mb-5 text-[13px] leading-5 text-muted">
          {phase === 'loading' && '正在读取文件并建立亲属关系，请勿关闭页面。'}
          {isError &&
            '文件编码无法识别，已解析 0 条记录。请确认文件为 UTF-8 或 GBK 编码后重新导入。'}
          {isPartial &&
            `共读取 ${TOTAL_RECORDS} 条记录，已成功建立 ${TOTAL_PEOPLE} 位成员、${TOTAL_MARRIAGES} 段婚姻。以下 3 条缺少必需字段或格式无法识别，暂未加入宗谱，可在导入后手动补全。`}
        </p>

        {/* 进行中：文件卡 + 进度 + 检查清单 */}
        {phase === 'loading' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 rounded-[10px] border border-line bg-bg px-3.5 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-accent-soft text-accent">
                <Upload size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-ink">{fileName}</div>
                <div className="num text-[11px] text-faint">2.4 MB · GEDCOM 5.5.1</div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px] text-muted">{STAGES[stage]}</span>
                <span className="num text-[12px] text-ink">{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="num mt-1.5 text-[11px] text-faint">
                已解析 {Math.round((progress / 100) * TOTAL_PEOPLE)} 人 ·{' '}
                {Math.round((progress / 100) * TOTAL_MARRIAGES)} 段婚姻
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {CHECKLIST.map((label, index) => {
                const done = index < stage;
                const active = index === stage;
                return (
                  <div key={label} className="flex items-center gap-2">
                    {done ? (
                      <Check size={14} className="text-primary" />
                    ) : active ? (
                      <Loader2 size={13} className="animate-spin text-accent" />
                    ) : (
                      <span className="h-[13px] w-[13px] rounded-full border border-line" />
                    )}
                    <span className="text-[12px] text-body">{label}</span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onSimulateError}
              className="self-start text-[11px] text-faint underline underline-offset-2"
            >
              （演示）模拟编码错误
            </button>
          </div>
        )}

        {/* 失败：错误详情 */}
        {isError && (
          <div className="rounded-[8px] bg-canvas px-3 py-2.5">
            <div className="mb-1 text-[11px] font-medium text-faint">错误详情</div>
            <div className="num text-[11px] leading-4 text-muted">
              ERR_ENCODING_UNSUPPORTED · line 1 · charset=unknown
            </div>
          </div>
        )}

        {/* 部分成功：已跳过记录 */}
        {isPartial && (
          <div className="rounded-[8px] bg-canvas px-3.5 py-3">
            <div className="mb-2 text-[11px] font-medium text-faint">已跳过记录 · 3 条</div>
            <div className="flex flex-col gap-2.5">
              {SKIPPED.map((item, index) => (
                <div key={item.line} className="flex items-center gap-2">
                  <span className="num w-9 shrink-0 text-[11px] text-faint">{item.line}</span>
                  <span className="flex-1 text-[12px] text-body">{item.reason}</span>
                  {completed.has(index) ? (
                    <span className="text-[11px] text-faint">已补全</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCompleted(prev => new Set(prev).add(index))}
                      className="text-[11px] text-primary"
                    >
                      补全
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 底部操作：进行中仅有取消，失败/部分成功为双按钮 */}
        {phase === 'loading' ? (
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[9px] border border-line bg-surface px-5 text-[13px] text-body transition-colors hover:bg-bg"
            >
              取消导入
            </button>
          </div>
        ) : (
          <div className="mt-6 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-10 flex-1 rounded-[9px] border border-line bg-surface text-[13px] text-body transition-colors hover:bg-bg"
            >
              {isPartial ? '放弃导入' : '放弃'}
            </button>
            <button
              type="button"
              onClick={isError ? onRetry : onConfirm}
              className="h-10 flex-1 rounded-[9px] bg-primary text-[13px] text-white transition-colors hover:bg-primary/90"
            >
              {isError ? '重新选择文件' : '导入 197 人'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
