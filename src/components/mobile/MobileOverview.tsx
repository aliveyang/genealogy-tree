import { Fragment, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { FamilyData } from '../../types';
import { directLine, generationLabel } from '../../utils/familyStats';
import { MemberCard, MobileHeader } from './shared';

interface MobileOverviewProps {
  pedigreeName: string;
  data: FamilyData;
  rootId: string | null;
  gens: Map<string, number>;
  genList: { gen: number; count: number }[];
  memberCount: number;
  selectedPersonId: string | null;
  onOpenDetail: (id: string) => void;
  onOpenCanvas: () => void;
  onOpenMembers: () => void;
}

/** 移动端「族谱」Tab 总览：世代筛选成员列表 + 世系速览 */
export function MobileOverview({
  pedigreeName,
  data,
  rootId,
  gens,
  genList,
  memberCount,
  selectedPersonId,
  onOpenDetail,
  onOpenCanvas,
  onOpenMembers,
}: MobileOverviewProps) {
  const [keyword, setKeyword] = useState('');
  const [genPick, setGenPick] = useState<number | null>(null);
  const activeGen = genPick ?? genList[0]?.gen ?? null;
  const q = keyword.trim();

  const list = Object.values(data.people).filter(p => {
    if (activeGen !== null && gens.get(p.id) !== activeGen) return false;
    return !q || p.name.includes(q);
  });

  // 世系速览：优先当前选中者；未选中时取最深一代的首位成员，保证链路完整
  const deepestGen = genList[genList.length - 1]?.gen;
  const deepestLeaf = deepestGen
    ? Object.values(data.people).find(p => gens.get(p.id) === deepestGen)?.id
    : undefined;
  const focusId = selectedPersonId ?? deepestLeaf ?? rootId;
  const line = focusId ? directLine(data, focusId) : [];
  const lineRootName = line.length ? (data.people[line[0]]?.name ?? '') : '';

  return (
    <div className="h-full overflow-y-auto bg-canvas">
      <MobileHeader title="宗谱" onSearchSubmit={setKeyword} />
      <div className="px-4 pb-6">
        <div className="flex items-baseline justify-between pt-4">
          <h1 className="min-w-0 truncate font-serif text-[22px] font-semibold text-ink">
            {pedigreeName}
          </h1>
          <span className="num shrink-0 text-[12px] text-muted">
            {memberCount} 位成员 · {genList.length} 代
          </span>
        </div>

        {/* 世代筛选 chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {genList.map(({ gen }) => (
            <button
              key={gen}
              type="button"
              onClick={() => setGenPick(gen)}
              className={[
                'h-9 shrink-0 rounded-full px-4 text-[13px] transition-colors',
                gen === activeGen
                  ? 'bg-primary font-medium text-white'
                  : 'border border-line bg-surface text-body',
              ].join(' ')}
            >
              {generationLabel(gen)}
            </button>
          ))}
        </div>

        {/* 成员列表 */}
        <div className="mt-3 flex flex-col gap-2.5">
          {list.map(p => (
            <MemberCard key={p.id} person={p} onClick={() => onOpenDetail(p.id)} />
          ))}
          {list.length === 0 && (
            <div className="py-10 text-center text-[13px] text-faint">该世代暂无成员</div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenMembers}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-[12px] border border-line bg-surface text-[14px] font-medium text-ink transition-colors hover:bg-bg"
        >
          查看全部 {memberCount} 位成员
        </button>

        {/* 世系速览 */}
        {line.length > 0 && (
          <div className="mt-3 rounded-[12px] border border-line bg-surface p-3.5">
            <div className="text-[13px] font-medium text-ink">
              世系速览 <span className="font-normal text-faint">· {lineRootName}支</span>
            </div>
            <div className="mt-2.5 flex items-center gap-1 overflow-x-auto pb-0.5">
              {line.map((id, i) => (
                <Fragment key={id}>
                  {i > 0 && <ChevronRight size={13} className="shrink-0 text-faint" />}
                  <button
                    type="button"
                    onClick={() => onOpenDetail(id)}
                    className={[
                      'shrink-0 rounded-[8px] px-2.5 py-1.5 text-[13px] transition-colors',
                      i === line.length - 1
                        ? 'bg-primary-soft font-medium text-primary'
                        : 'bg-bg text-body',
                    ].join(' ')}
                  >
                    {data.people[id]?.name}
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onOpenCanvas}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-[12px] border border-line bg-surface text-[14px] font-medium text-ink transition-colors hover:bg-bg"
        >
          查看族谱图
        </button>
      </div>
    </div>
  );
}
