import { Download, Menu, Plus, Search } from 'lucide-react';

interface TopBarProps {
  /** 文档名，如「张氏宗谱 · 浙江绍兴」/「未命名宗谱」 */
  docName: string;
  memberCount: number;
  hasMembers: boolean;
  onAddMember: () => void;
  onExport: () => void;
  onSearch: () => void;
  onToggleNav: () => void;
}

/** 顶栏 64 —— 品牌 / 文档名 / 保存状态 / 操作区 */
export function TopBar({
  docName,
  memberCount,
  hasMembers,
  onAddMember,
  onExport,
  onSearch,
  onToggleNav,
}: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleNav}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-bg lg:hidden"
          aria-label="打开导航"
        >
          <Menu size={18} />
        </button>

        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-primary font-serif text-[15px] font-semibold text-white">
          谱
        </div>
        <span className="font-serif text-[15px] leading-none font-semibold text-ink">宗谱</span>
        <span className="h-5 w-px bg-line" />
        <span className="text-[13px] text-ink">{docName}</span>
        <span className="text-[12px] text-faint">
          {hasMembers ? `已自动保存 · ${memberCount} 人` : '尚未保存'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSearch}
          className="flex h-8 w-8 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-bg"
          aria-label="搜索"
        >
          <Search size={16} />
        </button>
        <button
          type="button"
          onClick={onExport}
          className="flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] text-body transition-colors hover:bg-bg"
        >
          <Download size={15} />
          <span className="hidden sm:inline">导出</span>
        </button>
        {hasMembers && (
          <button
            type="button"
            onClick={onAddMember}
            className="flex h-8 items-center gap-1.5 rounded-[8px] bg-primary px-3 text-[13px] text-white transition-colors hover:bg-primary/90"
          >
            <Plus size={15} />
            添加成员
          </button>
        )}
        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-bg text-[12px] text-muted">
          张
        </div>
      </div>
    </header>
  );
}
