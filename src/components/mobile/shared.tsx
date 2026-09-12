import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Person } from '../../types';
import { formatYears } from '../../utils/familyStats';

interface MobileHeaderProps {
  title: string;
  /** 传入则显示返回箭头 */
  onBack?: () => void;
  /** 传入则显示搜索图标，点击展开搜索栏 */
  onSearchSubmit?: (keyword: string) => void;
}

/** 移动端顶栏：谱 logo + 标题（+ 返回 / 搜索） */
export function MobileHeader({ title, onBack, onSearchSubmit }: MobileHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  return (
    <div className="shrink-0 border-b border-line bg-surface">
      <div className="flex h-14 items-center gap-2.5 px-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-[8px] text-body transition-colors hover:bg-bg"
            aria-label="返回"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-primary font-serif text-[15px] font-semibold text-white">
          谱
        </div>
        <span className="min-w-0 truncate font-serif text-[16px] font-semibold text-ink">
          {title}
        </span>
        {onSearchSubmit && (
          <button
            type="button"
            onClick={() => setSearchOpen(v => !v)}
            className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-bg"
            aria-label="搜索"
          >
            <Search size={17} />
          </button>
        )}
      </div>
      {searchOpen && onSearchSubmit && (
        <form
          className="px-4 pb-3"
          onSubmit={e => {
            e.preventDefault();
            onSearchSubmit(keyword);
          }}
        >
          <input
            autoFocus
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索成员姓名"
            className="h-9 w-full rounded-[9px] border border-line bg-surface px-3 text-[13px] text-ink placeholder:text-faint focus:border-primary focus:outline-none"
          />
        </form>
      )}
    </div>
  );
}

/** 成员列表卡：头像 + 姓名 + 生卒 + 箭头 */
export function MemberCard({ person, onClick }: { person: Person; onClick: () => void }) {
  const isMale = person.gender === 'male';
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[12px] border border-line bg-surface px-3.5 py-3 text-left transition-colors hover:bg-canvas"
    >
      <span
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-[16px] font-medium',
          isMale ? 'bg-male-tint text-primary' : 'bg-female-tint text-accent',
          person.isDeceased && 'opacity-70',
        ].join(' ')}
      >
        {person.name.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-[15px] font-medium text-ink">
          {person.name}
        </span>
        <span className="num block text-[12px] leading-4 text-faint">{formatYears(person)}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-faint" />
    </button>
  );
}
