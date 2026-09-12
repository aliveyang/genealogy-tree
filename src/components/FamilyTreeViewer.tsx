import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  NodeTypes,
  NodeChange,
  applyNodeChanges,
  useReactFlow,
  useStore,
  ViewportPortal,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Crosshair, Minus, Plus } from 'lucide-react';
import { FamilyData } from '../types';
import { generateLayout, NODE_HEIGHT, NODE_WIDTH } from '../utils/layoutEngine';
import { computeGenerations, directLine, generationLabel } from '../utils/familyStats';
import { PersonNode } from './PersonNode';
import { MarriageNode } from './MarriageNode';

const nodeTypes: NodeTypes = {
  personNode: PersonNode,
  marriageNode: MarriageNode,
};

interface FamilyTreeViewerProps {
  data: FamilyData;
  rootId: string | null;
  selectedPersonId: string | null;
  newPersonId?: string | null;
  onSelectPerson: (id: string | null) => void;
  /** 搜索命中后请求画布居中到某成员；nonce 变化触发一次 */
  focus?: { id: string; nonce: number } | null;
  /** 移动端变体：隐藏工具条与图例，改为直系切换 pill + 浮动缩放，节点为紧凑名条 */
  compact?: boolean;
  /** compact 模式下「查看全部 N 人」的人数 */
  memberCount?: number;
}

type ViewMode = 'all' | 'direct';

function Legend() {
  return (
    <div className="pointer-events-none absolute bottom-6 left-6 rounded-[10px] border border-line bg-surface px-3.5 py-3">
      <div className="mb-2 text-[12px] leading-4 font-medium text-muted">图例</div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="h-[2px] w-5 rounded-full bg-primary" />
          <span className="text-[11px] leading-4 text-muted">实线 · 夫妻有子女</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-[2px] w-5 rounded-full"
            style={{ backgroundImage: 'repeating-linear-gradient(to right, #2E5C4E 0 3px, transparent 3px 6px)' }}
          />
          <span className="text-[11px] leading-4 text-muted">虚线 · 夫妻无子女</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-4 w-5 items-center justify-center">
            <span className="h-[6px] w-[6px] rounded-full bg-primary" />
          </span>
          <span className="text-[11px] leading-4 text-muted">圆点 · 婚姻关系</span>
        </div>
      </div>
    </div>
  );
}

function ViewerInner({
  data,
  rootId,
  selectedPersonId,
  newPersonId,
  onSelectPerson,
  focus,
  compact = false,
  memberCount = 0,
}: FamilyTreeViewerProps) {
  const [nodes, setNodes] = useState<ReturnType<typeof generateLayout>['nodes']>([]);
  const [edges, setEdges] = useState<ReturnType<typeof generateLayout>['edges']>([]);
  const [mode, setMode] = useState<ViewMode>('all');
  const { fitView, zoomIn, zoomOut, setCenter, getZoom } = useReactFlow();
  const zoom = useStore(s => s.transform[2]);
  const lastFocusRef = useRef<number>(-1);

  // 仅直系：只保留根成员（或当前选中成员）所在的直系链及其配偶
  const visibleData = useMemo(() => {
    if (mode === 'all') return data;
    const focusId = selectedPersonId ?? rootId;
    if (!focusId) return data;

    // 直系链（含自身）+ 链上每人的父母与配偶
    const line = directLine(data, focusId);
    const keep = new Set<string>(line);
    line.forEach(id => {
      const parentMarriage = Object.values(data.marriages).find(m =>
        m.childrenIds.includes(id)
      );
      if (parentMarriage) {
        keep.add(parentMarriage.husbandId);
        keep.add(parentMarriage.wifeId);
      }
    });

    // 直系链上每个人的配偶
    [...keep].forEach(id => {
      const marriage = Object.values(data.marriages).find(
        m => m.husbandId === id || m.wifeId === id
      );
      if (marriage) {
        keep.add(marriage.husbandId);
        keep.add(marriage.wifeId);
      }
    });

    const people = Object.fromEntries(
      Object.values(data.people)
        .filter(p => keep.has(p.id))
        .map(p => [p.id, p])
    );
    const marriages = Object.fromEntries(
      Object.values(data.marriages)
        .filter(m => people[m.husbandId] && people[m.wifeId])
        .map(m => [m.id, m])
    );
    return { people, marriages } as FamilyData;
  }, [data, mode, rootId, selectedPersonId]);

  useEffect(() => {
    const { nodes: nextNodes, edges: nextEdges } = generateLayout(
      visibleData,
      rootId && visibleData.people[rootId] ? rootId : (Object.keys(visibleData.people)[0] ?? null),
      selectedPersonId
    );
    setNodes(
      nextNodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          isSelected: n.id === selectedPersonId,
          isNew: n.id === newPersonId,
          compact,
        },
      }))
    );
    setEdges(nextEdges);
  }, [visibleData, rootId, selectedPersonId, newPersonId, compact]);

  useEffect(() => {
    const timer = window.setTimeout(() => fitView({ padding: 0.18, duration: 320 }), 60);
    return () => window.clearTimeout(timer);
  }, [nodes.length, fitView]);

  // 搜索命中：居中到目标节点（每个 nonce 只执行一次）
  useEffect(() => {
    if (!focus || focus.nonce === lastFocusRef.current) return;
    const node = nodes.find(n => n.id === focus.id);
    if (!node) return;
    lastFocusRef.current = focus.nonce;
    const width = node.measured?.width ?? NODE_WIDTH;
    const height = node.measured?.height ?? NODE_HEIGHT;
    setCenter(node.position.x + width / 2, node.position.y + height / 2, {
      zoom: getZoom(),
      duration: 360,
    });
  }, [focus, nodes, setCenter, getZoom]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds) as typeof nds),
    []
  );

  // 移动端画布左侧的世代刻度：每代取最上方节点的纵坐标，横向统一对齐到全局最左列
  const gens = useMemo(() => computeGenerations(data), [data]);
  const genGutter = useMemo(() => {
    if (!compact) return [];
    let globalMinX = Infinity;
    const topY = new Map<number, number>();
    nodes.forEach(n => {
      if (n.type !== 'personNode') return;
      const gen = gens.get(n.id);
      if (gen === undefined) return;
      globalMinX = Math.min(globalMinX, n.position.x);
      const y = topY.get(gen);
      if (y === undefined || n.position.y < y) topY.set(gen, n.position.y);
    });
    if (!Number.isFinite(globalMinX)) return [];
    return [...topY.entries()]
      .map(([gen, y]) => ({ gen, y: y + NODE_HEIGHT / 2, x: globalMinX - 16 }))
      .sort((a, b) => a.gen - b.gen);
  }, [compact, nodes, gens]);

  if (!rootId || Object.keys(data.people).length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-canvas text-[13px] text-faint">
        族谱为空
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-canvas">
      {/* 画布工具条 52（桌面） */}
      {!compact && (
        <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-line bg-canvas px-4">
          <div className="flex items-center rounded-[9px] border border-line bg-surface p-[3px]">
            {(
              [
                ['all', '全部展开'],
                ['direct', '仅直系'],
              ] as [ViewMode, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className={[
                  'h-[26px] rounded-[7px] px-3 text-[12px] leading-[26px] transition-colors',
                  mode === value
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-bg',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => fitView({ padding: 0.18, duration: 320 })}
              className="ml-1 h-[26px] rounded-[7px] px-3 text-[12px] leading-[26px] text-muted transition-colors hover:bg-bg"
            >
              自动排列
            </button>
          </div>

          <div className="flex items-center rounded-[9px] border border-line bg-surface">
            <button
              type="button"
              onClick={() => zoomOut({ duration: 160 })}
              className="h-[30px] w-[30px] text-[16px] leading-none text-muted transition-colors hover:text-ink"
              aria-label="缩小"
            >
              −
            </button>
            <span className="num w-[46px] text-center text-[12px] text-muted">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => zoomIn({ duration: 160 })}
              className="h-[30px] w-[30px] text-[16px] leading-none text-muted transition-colors hover:text-ink"
              aria-label="放大"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* 族谱画布 */}
      <div className="relative min-h-0 flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.3}
          maxZoom={1.8}
          nodesDraggable
          elementsSelectable
          onNodesChange={onNodesChange}
          onNodeClick={(_, node) => {
            if (node.type === 'personNode') onSelectPerson(node.id);
          }}
          onPaneClick={() => onSelectPerson(null)}
          proOptions={{ hideAttribution: true }}
        >
          {/* 移动端：跟随画布平移缩放的世代刻度标签 */}
          {compact && (
            <ViewportPortal>
              {genGutter.map(({ gen, x, y }) => (
                <div
                  key={gen}
                  className="num pointer-events-none absolute top-0 left-0 text-[11px] whitespace-nowrap text-faint"
                  style={{ transform: `translate(${x}px, ${y}px) translate(-100%, -50%)` }}
                >
                  {generationLabel(gen)}
                </div>
              ))}
            </ViewportPortal>
          )}
        </ReactFlow>

        {/* 移动端：直系切换 pill + 浮动缩放 */}
        {compact ? (
          <>
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-1.5 pl-4 shadow-sm">
              <span className="text-[12px] text-ink">
                {mode === 'direct' ? '直系视图' : '全部视图'}
              </span>
              <button
                type="button"
                onClick={() => setMode(mode === 'direct' ? 'all' : 'direct')}
                className="rounded-full bg-primary-soft px-2.5 py-1 text-[12px] text-primary"
              >
                {mode === 'direct' ? `查看全部 ${memberCount} 人` : '仅看直系'}
              </button>
            </div>
            <div className="absolute right-4 bottom-4 z-10 flex items-center gap-0.5 rounded-full border border-line bg-surface p-1 shadow-md">
              <button
                type="button"
                onClick={() => zoomOut({ duration: 160 })}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-bg"
                aria-label="缩小"
              >
                <Minus size={15} />
              </button>
              <button
                type="button"
                onClick={() => zoomIn({ duration: 160 })}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-bg"
                aria-label="放大"
              >
                <Plus size={15} />
              </button>
              <button
                type="button"
                onClick={() => fitView({ padding: 0.18, duration: 320 })}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-bg"
                aria-label="复位视图"
              >
                <Crosshair size={15} />
              </button>
            </div>
          </>
        ) : (
          <Legend />
        )}
      </div>
    </div>
  );
}

export function FamilyTreeViewer(props: FamilyTreeViewerProps) {
  return (
    <ReactFlowProvider>
      <ViewerInner {...props} />
    </ReactFlowProvider>
  );
}
