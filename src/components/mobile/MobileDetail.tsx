import { ChevronLeft } from 'lucide-react';
import { Person } from '../../types';
import type { RelationRows } from '../../utils/relations';

interface MobileDetailProps {
  person: Person;
  subtitle: string;
  relations: RelationRows;
  onBack: () => void;
  onEdit: () => void;
  onAddRelative: () => void;
}

function InfoRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-[6px]">
      <span className="shrink-0 text-[13px] leading-5 text-faint">{label}</span>
      <span className={`text-right text-[13px] leading-5 ${muted ? 'text-faint' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}

/** 移动端成员详情页：头像卡 + 基本信息 + 亲属关系 + 底部操作 */
export function MobileDetail({
  person,
  subtitle,
  relations,
  onBack,
  onEdit,
  onAddRelative,
}: MobileDetailProps) {
  const tags = [
    { text: person.birthYear ? `${person.birthYear} 年生` : '生年未录', tone: 'green' as const },
    { text: person.isDeceased ? '已故' : '在世', tone: 'brown' as const },
    { text: person.nativePlace ?? '籍贯未录', tone: 'gray' as const },
  ];

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="shrink-0 border-b border-line bg-surface">
        <div className="flex h-14 items-center gap-1 px-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-[8px] text-body transition-colors hover:bg-bg"
            aria-label="返回"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="font-serif text-[16px] font-semibold text-ink">成员详情</span>
          <button
            type="button"
            onClick={onEdit}
            className="ml-auto h-8 rounded-[8px] bg-primary-soft px-3 text-[13px] font-medium text-primary transition-colors hover:bg-primary-tint"
          >
            编辑
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {/* 人物卡 */}
        <div className="mt-4 flex flex-col items-center rounded-[14px] border border-line bg-surface px-4 py-6">
          <div
            className={[
              'flex h-16 w-16 items-center justify-center rounded-full font-serif text-[26px] font-semibold',
              person.gender === 'male' ? 'bg-male-tint text-primary' : 'bg-female-tint text-accent',
              person.isDeceased && 'opacity-70',
            ].join(' ')}
          >
            {person.name.slice(0, 1)}
          </div>
          <div className="mt-2.5 font-serif text-[22px] font-semibold text-ink">{person.name}</div>
          {subtitle && <div className="mt-1 text-[13px] text-muted">{subtitle}</div>}
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {tags.map(tag => (
              <span
                key={tag.text}
                className={[
                  'h-6 rounded-full px-2.5 text-[11px] leading-6',
                  tag.tone === 'green'
                    ? 'bg-primary-tint text-primary'
                    : tag.tone === 'brown'
                      ? 'bg-accent-soft text-accent'
                      : 'bg-bg text-muted',
                ].join(' ')}
              >
                {tag.text}
              </span>
            ))}
          </div>
        </div>

        {/* 基本信息 */}
        <div className="mt-3 rounded-[14px] border border-line bg-surface px-4 py-3.5">
          <h3 className="mb-1.5 text-[12px] font-medium text-faint">基本信息</h3>
          <InfoRow
            label="出生"
            value={person.birthDate ?? (person.birthYear ? `${person.birthYear} 年` : '未录')}
          />
          <InfoRow label="现居" value={person.residence ?? '未录'} muted={!person.residence} />
          <InfoRow label="职业" value={person.occupation ?? '未录'} muted={!person.occupation} />
        </div>

        {/* 亲属关系 */}
        <div className="mt-3 rounded-[14px] border border-line bg-surface px-4 py-3.5">
          <h3 className="mb-1.5 text-[12px] font-medium text-faint">亲属关系</h3>
          <InfoRow label="父母" value={relations.父母} muted={relations.父母 === '未记录'} />
          <InfoRow label="配偶" value={relations.配偶} muted={relations.配偶 === '未记录'} />
          <InfoRow label="子女" value={relations.子女} muted={relations.子女 === '未记录'} />
        </div>
      </div>

      {/* 底部操作 */}
      <div className="grid shrink-0 grid-cols-2 gap-2.5 border-t border-line bg-surface p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onAddRelative}
          className="h-11 rounded-[10px] border border-line bg-surface text-[14px] text-body transition-colors hover:bg-bg"
        >
          添加亲属
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="h-11 rounded-[10px] bg-primary text-[14px] text-white transition-colors hover:bg-primary/90"
        >
          编辑资料
        </button>
      </div>
    </div>
  );
}
