import { Handle, Position } from '@xyflow/react';
import { Person } from '../types';
import clsx from 'clsx';

interface PersonNodeProps {
  data: {
    person: Person;
    isSelected?: boolean;
    isNew?: boolean;
    /** 移动端紧凑名条：仅姓名 */
    compact?: boolean;
  };
}

/** 生卒文案：1932–2008 / 1958 年生 */
export function formatYears(person: Person): string {
  if (person.birthYear && person.deathYear) return `${person.birthYear}–${person.deathYear}`;
  if (person.birthYear) return `${person.birthYear} 年生`;
  if (person.deathYear) return `卒于 ${person.deathYear}`;
  return '生卒未录';
}

const handles = (
  <>
    <Handle id="top" type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />
    <Handle id="bottom" type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />
    <Handle id="left" type="target" position={Position.Left} className="!h-1 !w-1 !border-0 !bg-transparent" />
    <Handle id="right" type="source" position={Position.Right} className="!h-1 !w-1 !border-0 !bg-transparent" />
  </>
);

export function PersonNode({ data }: PersonNodeProps) {
  const { person, isSelected, isNew, compact } = data;

  // 移动端画布：仅姓名的紧凑名条
  if (compact) {
    return (
      <div
        className={clsx(
          'relative box-border flex h-9 w-full items-center justify-center rounded-[8px] px-3',
          isSelected ? 'border-2 border-primary bg-primary-soft' : 'border border-line bg-surface'
        )}
      >
        {isNew && (
          <span className="absolute -top-[9px] left-2 rounded-[9px] bg-primary px-2 py-[2px] text-[10px] leading-[14px] font-medium text-white">
            新添加
          </span>
        )}
        <span className="truncate font-serif text-[13px] font-medium text-ink">
          {person.name}
        </span>
        {handles}
      </div>
    );
  }

  const isMale = person.gender === 'male';

  return (
    <div
      className={clsx(
        'relative box-border flex h-[74px] w-[160px] items-center gap-[10px] rounded-[10px] bg-surface px-3',
        isSelected ? 'border-2 border-primary bg-primary-soft' : 'border border-line'
      )}
    >
      {/* 新成员标记 */}
      {isNew && (
        <span className="absolute -top-[9px] left-2 rounded-[9px] bg-primary px-2 py-[2px] text-[10px] leading-[14px] font-medium text-white">
          新添加
        </span>
      )}

      {/* 头像底 34 */}
      <div
        className={clsx(
          'flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[17px] font-serif text-[15px] font-medium',
          isMale ? 'bg-male-tint text-primary' : 'bg-female-tint text-accent',
          person.isDeceased && 'opacity-70'
        )}
      >
        {person.name.slice(0, 1)}
      </div>

      {/* 文字区 */}
      <div className="min-w-0 flex-1">
        <div className="truncate font-serif text-[15px] leading-[20px] font-medium text-ink">
          {person.name}
        </div>
        <div className="num truncate text-[11px] leading-[16px] text-faint">
          {formatYears(person)}
        </div>
      </div>

      {handles}
    </div>
  );
}
