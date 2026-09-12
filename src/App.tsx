import { useEffect, useMemo, useRef, useState } from 'react';
import { useFamilyTree } from './hooks/useFamilyTree';
import { useIsMobile } from './hooks/useIsMobile';
import { FamilyTreeViewer } from './components/FamilyTreeViewer';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { DetailPanel } from './components/DetailPanel';
import { EmptyState } from './components/EmptyState';
import { MemberDrawer } from './components/MemberDrawer';
import { ImportDialog } from './components/ImportDialog';
import { MobileShell } from './components/mobile/MobileShell';
import { Toast } from './components/Toast';
import { ImportPhase, LifeEvent, MemberFormValue, PedigreeSummary, Person, TemplateKind } from './types';
import {
  branchCount,
  computeGenerations,
  generationCounts,
  generationLabel,
  personSubtitle,
} from './utils/familyStats';
import { getRelations } from './utils/relations';
import {
  ZHANG_FAMILY_NAME,
  ZHANG_FAMILY_REGION,
  ZHANG_MEMBER_COUNT,
} from './utils/sampleData';

const CHEN_PEOPLE = 8;
const UNTITLED_NAME = '未命名宗谱';

export default function App() {
  const {
    data,
    addPerson,
    updatePerson,
    addSpouse,
    addChildToPerson,
    addSibling,
    addParentPerson,
    removePerson,
    loadZhangFamily,
    loadTemplate,
    clearAll,
  } = useFamilyTree();

  const isMobile = useIsMobile();

  const [rootId, setRootId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [newPersonId, setNewPersonId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit' | null>(null);
  const [importPhase, setImportPhase] = useState<ImportPhase | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pedigreeId, setPedigreeId] = useState('zhang');
  const [navOpen, setNavOpen] = useState(false);
  const [searchFocus, setSearchFocus] = useState<{ id: string; nonce: number } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const focusNonceRef = useRef(0);

  const memberCount = Object.keys(data.people).length;
  const hasMembers = memberCount > 0;

  const gens = useMemo(() => computeGenerations(data), [data]);
  const genList = useMemo(() => generationCounts(gens), [gens]);
  const stats = useMemo(
    () => ({
      members: memberCount,
      generations: genList.length,
      branches: branchCount(data, gens),
    }),
    [data, gens, genList.length, memberCount]
  );

  // 侧栏「我的宗谱」：新建宗谱激活时置于顶部，张氏在非激活时显示静态口径
  const pedigrees: PedigreeSummary[] =
    pedigreeId === 'new'
      ? [
          { id: 'new', name: '新建宗谱', memberCount },
          { id: 'zhang', name: ZHANG_FAMILY_NAME, memberCount: ZHANG_MEMBER_COUNT },
          { id: 'chen', name: '陈氏族谱', memberCount: CHEN_PEOPLE },
        ]
      : [
          { id: 'zhang', name: ZHANG_FAMILY_NAME, memberCount },
          { id: 'chen', name: '陈氏族谱', memberCount: CHEN_PEOPLE },
        ];

  const docName = pedigreeId === 'zhang' ? `${ZHANG_FAMILY_NAME} · ${ZHANG_FAMILY_REGION}` : UNTITLED_NAME;
  const mobilePedigreeName = pedigreeId === 'zhang' ? ZHANG_FAMILY_NAME : UNTITLED_NAME;

  // 载入示例宗谱 / 保证 rootId 指向第一代
  useEffect(() => {
    loadZhangFamily();
  }, [loadZhangFamily]);

  useEffect(() => {
    if (!hasMembers) {
      setRootId(null);
      return;
    }
    if (rootId && data.people[rootId]) return;
    const first = genList[0]?.gen;
    const topId = Object.keys(data.people).find(id => gens.get(id) === first);
    setRootId(topId ?? Object.keys(data.people)[0] ?? null);
  }, [data, gens, genList, hasMembers, rootId]);

  const selectedPerson = selectedPersonId ? data.people[selectedPersonId] ?? null : null;
  const subtitle = selectedPersonId
    ? personSubtitle(data, selectedPersonId, gens)
    : '';
  const relations = useMemo(
    () =>
      selectedPersonId
        ? getRelations(data, selectedPersonId)
        : {
            父母: '未记录',
            配偶: '未记录',
            子女: '未记录',
            兄弟姐妹: '未记录',
            兄弟姐妹Label: '兄弟姐妹',
          },
    [data, selectedPersonId]
  );

  // 添加抽屉「以谁为参照」下拉选项
  const refOptions = useMemo(
    () =>
      Object.values(data.people).map(p => {
        const sub = personSubtitle(data, p.id, gens);
        return {
          id: p.id,
          name: p.name,
          gender: p.gender,
          label: sub ? `${p.name} · ${sub}` : p.name,
        };
      }),
    [data, gens]
  );

  /** 新增 / 编辑提交 */
  const handleSubmitMember = (value: MemberFormValue) => {
    const name = value.name.trim();
    if (!name) return;

    if (drawerMode === 'edit' && selectedPerson) {
      updatePerson(selectedPerson.id, {
        name,
        nativePlace: value.nativePlace || undefined,
        gender: value.gender,
        birthYear: value.birthYear || undefined,
        deathYear: value.deathYear || undefined,
        isDeceased: !!value.deathYear,
      });
      setDrawerMode(null);
      setToast(`已保存「${name}」的资料`);
      return;
    }

    let createdId: string | null = null;
    const refId = value.refId || selectedPersonId || rootId;
    const refPerson = refId ? data.people[refId] : undefined;

    if (!refId) {
      createdId = addPerson(name, value.gender);
      setRootId(createdId);
    } else if (value.relation === '子女') {
      createdId = addChildToPerson(refId, name, value.gender) ?? null;
    } else if (value.relation === '配偶') {
      createdId = addSpouse(refId, name) ?? null;
    } else if (value.relation === '兄弟姐妹') {
      // addSibling 内部已按长幼插入父母婚姻的 childrenIds，并返回新成员 id
      createdId = addSibling(refId, name, value.gender, 'younger');
    } else {
      // 父亲 / 母亲：另一位以「未知」占位
      createdId = addParentPerson(refId, name, value.gender);
    }

    if (createdId) {
      updatePerson(createdId, {
        nativePlace: value.nativePlace || undefined,
        birthYear: value.birthYear || undefined,
        deathYear: value.deathYear || undefined,
        isDeceased: !!value.deathYear,
        residence: refPerson?.residence,
      });
      setSelectedPersonId(createdId);
      setNewPersonId(createdId);
    }

    setDrawerMode(null);
    setToast(`已添加成员 · ${name}`);
  };

  /** 导入流程（演示桩） */
  const openImport = () => setImportPhase('loading');

  useEffect(() => {
    if (importPhase !== 'loading') return;
    const timer = window.setTimeout(() => setImportPhase('partial'), 2600);
    return () => window.clearTimeout(timer);
  }, [importPhase]);

  const handleImportConfirm = () => {
    loadZhangFamily();
    setPedigreeId('zhang');
    setImportPhase(null);
    setSelectedPersonId(null);
    setNewPersonId(null);
    setToast('已导入 197 位成员');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pedigreeId === 'zhang' ? ZHANG_FAMILY_NAME : UNTITLED_NAME}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('已导出宗谱数据');
  };

  /** 搜索：姓名命中直选；世代（第X代）命中取该代首位，并让画布居中 */
  const handleSearch = (keyword: string) => {
    const q = keyword.trim();
    if (!q) return;
    let hit: Person | undefined = Object.values(data.people).find(p => p.name.includes(q));
    if (!hit) {
      const genEntry = genList.find(({ gen }) => generationLabel(gen).includes(q));
      if (genEntry) {
        const id = Object.keys(data.people).find(id => gens.get(id) === genEntry.gen);
        if (id) hit = data.people[id];
      }
    }
    if (hit) {
      setSelectedPersonId(hit.id);
      setSearchFocus({ id: hit.id, nonce: ++focusNonceRef.current });
      setNavOpen(false);
    }
  };

  const handleCreatePedigree = () => {
    clearAll();
    setPedigreeId('new');
    setSelectedPersonId(null);
    setNewPersonId(null);
    setSearchFocus(null);
    setNavOpen(false);
  };

  const handleSelectPedigree = (id: string) => {
    if (id === pedigreeId) {
      setNavOpen(false);
      return;
    }
    if (id === 'zhang') {
      loadZhangFamily();
      setPedigreeId('zhang');
      setSelectedPersonId(null);
      setNewPersonId(null);
      setSearchFocus(null);
    } else if (id === 'chen') {
      // 演示数据未包含陈氏，避免误清空当前宗谱
      setToast('演示版本：陈氏族谱暂未收录数据');
    }
    setNavOpen(false);
  };

  const handleUseTemplate = (name: string) => {
    loadTemplate(name as TemplateKind);
    setSelectedPersonId(null);
    setNewPersonId(null);
    setSearchFocus(null);
    setToast(`已套用「${name}」模板`);
  };

  const handleAddEvent = (event: LifeEvent) => {
    if (!selectedPerson) return;
    updatePerson(selectedPerson.id, {
      events: [...(selectedPerson.events ?? []), event],
    });
    setToast(`已添加事件「${event.title}」`);
  };

  const openAddDrawer = () => setDrawerMode('add');

  const openEditDrawer = (id: string) => {
    setSelectedPersonId(id);
    setDrawerMode('edit');
  };

  const openAddRelativeFor = (id: string) => {
    setSelectedPersonId(id);
    setDrawerMode('add');
  };

  const treeViewer = (compact: boolean) => (
    <FamilyTreeViewer
      data={data}
      rootId={rootId}
      selectedPersonId={selectedPersonId}
      newPersonId={newPersonId}
      focus={searchFocus}
      onSelectPerson={id => {
        setSelectedPersonId(id);
        setNavOpen(false);
      }}
      compact={compact}
      memberCount={memberCount}
    />
  );

  if (isMobile) {
    return (
      <div className="flex h-full flex-col overflow-hidden bg-bg">
        <MobileShell
          pedigreeName={mobilePedigreeName}
          data={data}
          rootId={rootId}
          gens={gens}
          genList={genList}
          memberCount={memberCount}
          selectedPersonId={selectedPersonId}
          newPersonId={newPersonId}
          focus={searchFocus}
          onSelectPerson={id => {
            setSelectedPersonId(id);
            setNavOpen(false);
          }}
          onEditPerson={openEditDrawer}
          onAddRelative={openAddRelativeFor}
          onExport={handleExport}
        />

        <MemberDrawer
          open={drawerMode !== null}
          mode={drawerMode ?? 'add'}
          person={drawerMode === 'edit' ? selectedPerson : null}
          refOptions={refOptions}
          defaultRefId={selectedPersonId ?? rootId}
          relations={drawerMode === 'edit' ? relations : null}
          onClose={() => setDrawerMode(null)}
          onSubmit={handleSubmitMember}
        />

        <ImportDialog
          open={importPhase !== null}
          phase={importPhase ?? 'loading'}
          fileName="zhang-family.ged"
          onClose={() => setImportPhase(null)}
          onConfirm={handleImportConfirm}
          onRetry={() => setImportPhase('loading')}
          onSimulateError={() => setImportPhase('error')}
        />

        <Toast
          open={toast !== null}
          message={toast ?? ''}
          actionLabel={toast?.startsWith('已添加成员') ? '撤销' : undefined}
          onAction={() => {
            if (newPersonId) {
              removePerson(newPersonId);
              setSelectedPersonId(null);
              setToast('已撤销添加');
            }
            setNewPersonId(null);
          }}
          onClose={() => setToast(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-bg">
      <TopBar
        docName={docName}
        memberCount={memberCount}
        hasMembers={hasMembers}
        onAddMember={openAddDrawer}
        onExport={handleExport}
        onSearch={() => searchRef.current?.focus()}
        onToggleNav={() => setNavOpen(v => !v)}
      />

      <div className="flex min-h-0 flex-1">
        {/* 左侧导航：窄屏浮层 */}
        <div
          className={[
            'fixed inset-y-0 left-0 z-30 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0',
            navOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <Sidebar
            ref={searchRef}
            pedigrees={pedigrees}
            activePedigreeId={pedigreeId}
            generations={genList}
            stats={stats}
            hasMembers={hasMembers}
            onSearchSubmit={handleSearch}
            onSelectPedigree={handleSelectPedigree}
            onCreatePedigree={handleCreatePedigree}
          />
          {navOpen && (
            <div
              className="fixed inset-0 -z-10 bg-ink/30 lg:hidden"
              onClick={() => setNavOpen(false)}
            />
          )}
        </div>

        {/* 主区：族谱画布 / 空态 */}
        <main className="min-w-0 flex-1">
          {hasMembers && rootId ? (
            treeViewer(false)
          ) : (
            <EmptyState
              pedigreeName={pedigreeId === 'zhang' ? ZHANG_FAMILY_NAME : UNTITLED_NAME}
              onImport={openImport}
              onAddFirst={openAddDrawer}
              onUseTemplate={handleUseTemplate}
            />
          )}
        </main>

        {/* 右侧详情：xl 以下选中时浮层 */}
        <div
          className={[
            'shrink-0',
            selectedPerson
              ? 'fixed inset-y-0 right-0 z-30 shadow-2xl xl:static xl:z-auto xl:shadow-none'
              : 'hidden xl:block',
          ].join(' ')}
        >
          <DetailPanel
            person={selectedPerson}
            subtitle={subtitle}
            relations={relations}
            onEdit={() => setDrawerMode('edit')}
            onAddRelative={openAddDrawer}
            onAddEvent={handleAddEvent}
          />
        </div>
      </div>

      <MemberDrawer
        open={drawerMode !== null}
        mode={drawerMode ?? 'add'}
        person={drawerMode === 'edit' ? selectedPerson : null}
        refOptions={refOptions}
        defaultRefId={selectedPersonId ?? rootId}
        relations={drawerMode === 'edit' ? relations : null}
        onClose={() => setDrawerMode(null)}
        onSubmit={handleSubmitMember}
      />

      <ImportDialog
        open={importPhase !== null}
        phase={importPhase ?? 'loading'}
        fileName="zhang-family.ged"
        onClose={() => setImportPhase(null)}
        onConfirm={handleImportConfirm}
        onRetry={() => setImportPhase('loading')}
        onSimulateError={() => setImportPhase('error')}
      />

      <Toast
        open={toast !== null}
        message={toast ?? ''}
        actionLabel={toast?.startsWith('已添加成员') ? '撤销' : undefined}
        onAction={() => {
          if (newPersonId) {
            removePerson(newPersonId);
            setSelectedPersonId(null);
            setToast('已撤销添加');
          }
          setNewPersonId(null);
        }}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
