import { useState } from 'react';
import { Download, Network, User, Users } from 'lucide-react';
import { FamilyData } from '../../types';
import { generationLabel, personSubtitle } from '../../utils/familyStats';
import { getRelations } from '../../utils/relations';
import { MobileCanvas } from './MobileCanvas';
import { MobileDetail } from './MobileDetail';
import { MobileOverview } from './MobileOverview';
import { MemberCard, MobileHeader } from './shared';

type TabKey = 'tree' | 'members' | 'mine';

interface MobileShellProps {
  pedigreeName: string;
  data: FamilyData;
  rootId: string | null;
  gens: Map<string, number>;
  genList: { gen: number; count: number }[];
  memberCount: number;
  selectedPersonId: string | null;
  newPersonId: string | null;
  focus: { id: string; nonce: number } | null;
  onSelectPerson: (id: string | null) => void;
  onEditPerson: (id: string) => void;
  onAddRelative: (id: string) => void;
  onExport: () => void;
}

const TABS: { key: TabKey; label: string; icon: typeof Network }[] = [
  { key: 'tree', label: '族谱', icon: Network },
  { key: 'members', label: '成员', icon: Users },
  { key: 'mine', label: '我的', icon: User },
];

/** 成员 Tab：按世代分组的全量列表 */
function MobileMembers({
  data,
  gens,
  genList,
  onOpenDetail,
}: {
  data: FamilyData;
  gens: Map<string, number>;
  genList: { gen: number; count: number }[];
  onOpenDetail: (id: string) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const q = keyword.trim();

  const groups = genList
    .map(({ gen }) => ({
      gen,
      people: Object.values(data.people).filter(
        p => gens.get(p.id) === gen && (!q || p.name.includes(q))
      ),
    }))
    .filter(g => g.people.length > 0);

  return (
    <div className="h-full overflow-y-auto bg-canvas">
      <MobileHeader title="成员" onSearchSubmit={setKeyword} />
      <div className="flex flex-col gap-4 px-4 pb-6 pt-3">
        {groups.map(g => (
          <section key={g.gen}>
            <h3 className="mb-2 text-[12px] text-faint">
              {generationLabel(g.gen)} · {g.people.length} 位
            </h3>
            <div className="flex flex-col gap-2.5">
              {g.people.map(p => (
                <MemberCard key={p.id} person={p} onClick={() => onOpenDetail(p.id)} />
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <div className="py-10 text-center text-[13px] text-faint">未找到成员</div>
        )}
      </div>
    </div>
  );
}

/** 我的 Tab：账号占位 + 导出入口 */
function MobileMine({
  pedigreeName,
  onExport,
}: {
  pedigreeName: string;
  onExport: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto bg-canvas">
      <MobileHeader title="我的" />
      <div className="px-4 pt-4">
        <div className="flex flex-col items-center rounded-[14px] border border-line bg-surface px-4 py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft font-serif text-[20px] font-semibold text-accent">
            张
          </div>
          <div className="mt-2 font-serif text-[16px] font-semibold text-ink">宗谱管理员</div>
          <div className="mt-0.5 text-[12px] text-faint">当前宗谱：{pedigreeName}</div>
        </div>
        <div className="mt-3 overflow-hidden rounded-[14px] border border-line bg-surface">
          <button
            type="button"
            onClick={onExport}
            className="flex w-full items-center gap-2.5 px-4 py-3.5 text-left text-[14px] text-body transition-colors hover:bg-bg"
          >
            <Download size={16} className="text-muted" />
            导出宗谱数据
          </button>
        </div>
        <p className="px-1 pt-3 text-center text-[11px] text-faint">
          宗谱 · 演示版本，数据仅保存在当前页面
        </p>
      </div>
    </div>
  );
}

/** 移动端应用壳：底部三 Tab（族谱 / 成员 / 我的）+ 成员详情页 */
export function MobileShell({
  pedigreeName,
  data,
  rootId,
  gens,
  genList,
  memberCount,
  selectedPersonId,
  newPersonId,
  focus,
  onSelectPerson,
  onEditPerson,
  onAddRelative,
  onExport,
}: MobileShellProps) {
  const [tab, setTab] = useState<TabKey>('tree');
  const [canvasOpen, setCanvasOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const openDetail = (id: string) => {
    onSelectPerson(id);
    setDetailId(id);
  };

  // 详情页：占满全屏，底部为操作栏而非 Tab 栏
  if (detailId && data.people[detailId]) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-bg">
        <MobileDetail
          person={data.people[detailId]}
          subtitle={personSubtitle(data, detailId, gens)}
          relations={getRelations(data, detailId)}
          onBack={() => setDetailId(null)}
          onEdit={() => onEditPerson(detailId)}
          onAddRelative={() => onAddRelative(detailId)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg">
      <div className="min-h-0 flex-1">
        {tab === 'tree' &&
          (canvasOpen ? (
            <MobileCanvas
              pedigreeName={pedigreeName}
              data={data}
              rootId={rootId}
              selectedPersonId={selectedPersonId}
              newPersonId={newPersonId}
              focus={focus}
              memberCount={memberCount}
              onSelectPerson={onSelectPerson}
              onOpenDetail={openDetail}
              onBack={() => setCanvasOpen(false)}
            />
          ) : (
            <MobileOverview
              pedigreeName={pedigreeName}
              data={data}
              rootId={rootId}
              gens={gens}
              genList={genList}
              memberCount={memberCount}
              selectedPersonId={selectedPersonId}
              onOpenDetail={openDetail}
              onOpenCanvas={() => setCanvasOpen(true)}
              onOpenMembers={() => setTab('members')}
            />
          ))}
        {tab === 'members' && (
          <MobileMembers data={data} gens={gens} genList={genList} onOpenDetail={openDetail} />
        )}
        {tab === 'mine' && <MobileMine pedigreeName={pedigreeName} onExport={onExport} />}
      </div>

      {/* 底部 Tab 栏 */}
      <div className="flex h-[56px] shrink-0 items-stretch border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className="flex flex-1 flex-col items-center justify-center gap-0.5"
            >
              <Icon size={20} className={active ? 'text-primary' : 'text-faint'} />
              <span
                className={[
                  'text-[11px]',
                  active ? 'font-medium text-primary' : 'text-faint',
                ].join(' ')}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
