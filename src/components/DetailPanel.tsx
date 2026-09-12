import { UserRound } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { LifeEvent, Person } from '../types';
import type { RelationRows } from '../utils/relations';

interface DetailPanelProps {
  person: Person | null;
  subtitle: string;
  relations: RelationRows;
  onEdit: () => void;
  onAddRelative: () => void;
  /** 生平事件「添加」提交（未传则不显示入口） */
  onAddEvent?: (event: LifeEvent) => void;
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-[5px]">
      <span className="shrink-0 text-[13px] leading-5 text-faint">{label}</span>
      <span
        className={[
          'text-right text-[13px] leading-5',
          muted ? 'text-faint' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="px-5 py-4">
      <h3 className="mb-2 text-[12px] leading-4 font-medium text-faint">{title}</h3>
      {children}
    </section>
  );
}

/** 右侧详情面板 294 */
export function DetailPanel({
  person,
  subtitle,
  relations,
  onEdit,
  onAddRelative,
  onAddEvent,
}: DetailPanelProps) {
  const [eventTitle, setEventTitle] = useState('');
  const [eventYear, setEventYear] = useState('');
  const [addingEvent, setAddingEvent] = useState(false);

  if (!person) {
    return (
      <aside className="flex h-full w-[294px] shrink-0 flex-col items-center justify-center border-l border-line bg-surface px-8 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-bg text-faint">
          <UserRound size={22} />
        </div>
        <p className="mb-1 text-[14px] text-body">未选中成员</p>
        <p className="text-[12px] leading-5 text-faint">
          在左侧画布点选一位成员，查看并编辑其详细资料。
        </p>
      </aside>
    );
  }

  const tags = [
    { text: person.birthYear ? `${person.birthYear} 年生` : '生年未录', tone: 'green' as const },
    { text: person.isDeceased ? '已故' : '在世', tone: 'brown' as const },
    { text: person.nativePlace || '籍贯未录', tone: 'gray' as const },
  ];

  return (
    <aside className="flex h-full w-[294px] shrink-0 flex-col border-l border-line bg-surface">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* 人物头部 */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={[
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-serif text-[20px] font-semibold',
                person.gender === 'male' ? 'bg-primary-tint text-primary' : 'bg-female-tint text-accent',
              ].join(' ')}
            >
              {person.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="truncate font-serif text-[21px] leading-7 font-semibold text-ink">
                {person.name}
              </div>
              {subtitle && <div className="text-[12px] leading-4 text-faint">{subtitle}</div>}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
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

        <div className="mx-5 h-px bg-line" />

        <Section title="基本信息">
          <Row
            label="出生"
            value={person.birthDate ?? (person.birthYear ? `${person.birthYear} 年` : '未录')}
          />
          <Row label="籍贯" value={person.nativePlace ?? '未录'} />
          <Row label="现居" value={person.residence ?? '未录'} />
          <Row label="职业" value={person.occupation ?? '未录'} />
        </Section>

        <div className="mx-5 h-px bg-line" />

        <Section title="亲属关系">
          <Row label="父母" value={relations.父母} muted={relations.父母 === '未记录'} />
          <Row label="配偶" value={relations.配偶} muted={relations.配偶 === '未记录'} />
          <Row label="子女" value={relations.子女} muted={relations.子女 === '未记录'} />
          <Row
            label={relations.兄弟姐妹Label}
            value={relations.兄弟姐妹}
            muted={relations.兄弟姐妹 === '未记录'}
          />
        </Section>

        <div className="mx-5 h-px bg-line" />

        <Section title="生平事件">
          {person.events && person.events.length > 0 ? (
            person.events.map(e => (
              <Row
                key={`${e.year}-${e.title}`}
                label={e.title}
                value={`${e.year} 年${e.detail ? ` · ${e.detail}` : ''}`}
              />
            ))
          ) : (
            <div className="py-[3px]">
              {addingEvent ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={eventTitle}
                      onChange={e => setEventTitle(e.target.value)}
                      placeholder="事件名，如 迁居"
                      className="h-8 min-w-0 flex-1 rounded-[8px] border border-line bg-surface px-2.5 text-[12px] text-ink placeholder:text-faint focus:border-primary focus:outline-none"
                    />
                    <input
                      value={eventYear}
                      onChange={e => setEventYear(e.target.value)}
                      placeholder="年份"
                      className="num h-8 w-[72px] shrink-0 rounded-[8px] border border-line bg-surface px-2.5 text-[12px] text-ink placeholder:text-faint focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAddingEvent(false);
                        setEventTitle('');
                        setEventYear('');
                      }}
                      className="h-8 flex-1 rounded-[8px] border border-line bg-surface text-[12px] text-body transition-colors hover:bg-bg"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      disabled={!eventTitle.trim() || !eventYear.trim()}
                      onClick={() => {
                        onAddEvent?.({ year: eventYear.trim(), title: eventTitle.trim() });
                        setAddingEvent(false);
                        setEventTitle('');
                        setEventYear('');
                      }}
                      className="h-8 flex-1 rounded-[8px] bg-primary text-[12px] text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      添加
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] leading-5 text-faint">暂无生平事件</span>
                  {onAddEvent && (
                    <button
                      type="button"
                      onClick={() => setAddingEvent(true)}
                      className="text-[12px] text-primary"
                    >
                      添加
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </Section>

        <div className="mx-5 h-px bg-line" />

        <Section title="生平简述">
          <p className="text-[13px] leading-[22px] text-body">
            {person.bio || '尚未填写生平简述。'}
          </p>
        </Section>
      </div>

      {/* 详情操作 */}
      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-line p-5">
        <button
          type="button"
          onClick={onEdit}
          className="h-10 rounded-[9px] border border-line bg-surface text-[13px] text-body transition-colors hover:bg-bg"
        >
          编辑资料
        </button>
        <button
          type="button"
          onClick={onAddRelative}
          className="h-10 rounded-[9px] bg-primary text-[13px] text-white transition-colors hover:bg-primary/90"
        >
          添加亲属
        </button>
      </div>
    </aside>
  );
}
