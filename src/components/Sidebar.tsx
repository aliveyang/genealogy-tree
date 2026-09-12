import { forwardRef } from 'react';
import { Plus, Search } from 'lucide-react';
import { PedigreeSummary } from '../types';
import { generationLabel } from '../utils/familyStats';

interface SidebarProps {
  pedigrees: PedigreeSummary[];
  activePedigreeId: string;
  generations: { gen: number; count: number }[];
  stats: { members: number; generations: number; branches: number };
  hasMembers: boolean;
  onSearchSubmit: (keyword: string) => void;
  onSelectPedigree: (id: string) => void;
  onCreatePedigree: () => void;
}

/** 左侧导航 240 —— 我的宗谱 / 世代导航 / 宗谱概况 */
export const Sidebar = forwardRef<HTMLInputElement, SidebarProps>(function Sidebar(
  {
    pedigrees,
    activePedigreeId,
    generations,
    stats,
    hasMembers,
    onSearchSubmit,
    onSelectPedigree,
    onCreatePedigree,
  },
  ref
) {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-3.5">
        {/* 搜索框 */}
        <form
          className="flex h-8 shrink-0 items-center gap-2 rounded-[9px] border border-line bg-surface px-2.5"
          onSubmit={e => {
            e.preventDefault();
            const input = e.currentTarget.querySelector('input');
            onSearchSubmit(input?.value ?? '');
          }}
        >
          <Search size={14} className="shrink-0 text-faint" />
          <input
            ref={ref}
            placeholder="搜索姓名 / 世代"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink placeholder:text-faint focus:outline-none"
            onKeyDown={e => {
              // 直接在输入框处理回车，不依赖浏览器隐式提交（部分环境不触发）
              if (e.key !== 'Enter') return;
              e.preventDefault();
              onSearchSubmit(e.currentTarget.value);
            }}
          />
          {/* 隐性提交入口（sr-only 保证可渲染）：单输入框表单回车时稳定触发 submit */}
          <button type="submit" className="sr-only" aria-hidden="true" tabIndex={-1} />
        </form>

        {/* 我的宗谱 */}
        <section>
          <h3 className="mb-1.5 px-1 text-[12px] leading-4 font-medium text-faint">我的宗谱</h3>
          <div className="flex flex-col gap-0.5">
            {pedigrees.map(p => {
              const active = p.id === activePedigreeId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectPedigree(p.id)}
                  className={[
                    'relative flex h-[34px] items-center justify-between rounded-[8px] px-2.5 text-left transition-colors',
                    active ? 'bg-primary-soft' : 'hover:bg-bg',
                  ].join(' ')}
                >
                  {active && (
                    <span className="absolute top-1/2 left-0 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <span
                    className={[
                      'truncate text-[13px]',
                      active ? 'font-medium text-primary' : 'text-body',
                    ].join(' ')}
                  >
                    {p.name}
                  </span>
                  <span className="num shrink-0 text-[11px] text-faint">{p.memberCount} 人</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={onCreatePedigree}
              className="mt-1 flex h-[32px] items-center gap-1.5 rounded-[8px] border border-dashed border-line px-2.5 text-[13px] text-muted transition-colors hover:bg-bg"
            >
              <Plus size={14} />
              新建宗谱
            </button>
          </div>
        </section>

        {/* 世代导航（空宗谱时隐藏） */}
        {hasMembers && (
          <section>
            <h3 className="mb-1.5 px-1 text-[12px] leading-4 font-medium text-faint">世代导航</h3>
            <div className="flex flex-col gap-0.5">
              {generations.map(({ gen, count }) => (
                <div
                  key={gen}
                  className="flex h-[30px] items-center justify-between rounded-[8px] px-2.5 transition-colors hover:bg-bg"
                >
                  <span className="text-[13px] text-body">{generationLabel(gen)}</span>
                  <span className="num text-[11px] text-faint">{count} 位</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="min-h-2 flex-1" />

        {/* 宗谱概况 */}
        <section className="shrink-0 rounded-[10px] border border-line bg-surface p-3.5">
          <h3 className="mb-2.5 text-[12px] leading-4 font-medium text-faint">宗谱概况</h3>
          <div className="flex items-start justify-between">
            {[
              { value: stats.members, label: '成员' },
              { value: stats.generations, label: '世代' },
              { value: stats.branches, label: '支系' },
            ].map(item => (
              <div key={item.label} className="flex flex-1 flex-col items-center gap-1">
                <span className="num font-serif text-[20px] leading-6 font-semibold text-ink">
                  {item.value}
                </span>
                <span className="text-[11px] leading-4 text-faint">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
});
