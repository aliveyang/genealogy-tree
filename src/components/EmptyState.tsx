import { Network, Plus, Upload } from 'lucide-react';

interface EmptyStateProps {
  /** 当前宗谱名，用于说明文案（如「未命名宗谱」） */
  pedigreeName: string;
  onImport: () => void;
  onAddFirst: () => void;
  onUseTemplate: (template: string) => void;
}

const TEMPLATES = ['三代同堂', '单系直系', '双亲与子女'];

/** 空态 · 尚未保存（居中 440 卡片） */
export function EmptyState({ pedigreeName, onImport, onAddFirst, onUseTemplate }: EmptyStateProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-canvas px-6">
      <div className="w-[440px] rounded-[16px] border border-line bg-surface px-7 py-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Network size={26} />
        </div>

        <h2 className="mb-2 font-serif text-[20px] leading-7 font-semibold text-ink">
          还没有成员
        </h2>
        <p className="mx-auto mb-6 max-w-[340px] text-[13px] leading-5 text-muted">
          为「{pedigreeName}」添加第一位成员，或直接从已有的 GEDCOM 文件导入家族数据。
        </p>

        <div className="mb-5 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onImport}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[9px] border border-line bg-surface text-[13px] text-body transition-colors hover:bg-bg"
          >
            <Upload size={15} />
            导入 GEDCOM
          </button>
          <button
            type="button"
            onClick={onAddFirst}
            className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[9px] bg-primary text-[13px] text-white transition-colors hover:bg-primary/90"
          >
            <Plus size={15} />
            添加第一位成员
          </button>
        </div>

        <div className="text-[12px] leading-4 text-faint">或从模板快速开始</div>
        <div className="mt-2.5 flex items-center justify-center gap-2">
          {TEMPLATES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => onUseTemplate(t)}
              className="h-7 rounded-full border border-line bg-surface px-3 text-[12px] leading-7 text-body transition-colors hover:bg-bg"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
