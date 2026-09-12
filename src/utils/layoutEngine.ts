import { FamilyData } from '../types';
import { Node, Edge } from '@xyflow/react';
import dagre from 'dagre';

/** 设计稿尺寸：成员卡片 160×74，婚姻圆点 6×6 */
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 74;
export const MARRIAGE_NODE_SIZE = 6;

/** 夫妻两卡片之间的间距（婚姻圆点居中） */
const COUPLE_GAP = 24;
/** 不同家庭单元之间的水平间距 / 世代间距（对应设计稿的列距与行距） */
const NODE_SEP = 30;
const RANK_SEP = 86;

const COLOR_MARRIAGE = '#2E5C4E';
const COLOR_CONNECTOR = '#C4B49B';

export interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

/** 世代连线用 smoothstep，需 borderRadius；Edge 基础类型未声明该字段 */
type LayoutEdge = Edge & { pathOptions?: { borderRadius?: number } };

/**
 * 家庭单元：夫妻合并为一个 dagre 节点（男左女右），未婚者为单人单元。
 * dagre 不支持 minlen:0 的同层约束（实测夫妻会被排成上下两层），
 * 因此先合并、布局后再展开为两张卡片。
 */
interface FamilyUnit {
  key: string;
  /** 单元内成员 id，合并顺序保证丈夫在前、妻子在后 */
  ids: string[];
  width: number;
  height: number;
}

/**
 * 生成 React Flow 的 nodes / edges。
 * - 夫妻合并为单元参与 dagre 布局，保证同代且水平相邻（男左女右）；
 * - 婚姻圆点在布局后按夫妻中点手工定位，与两卡片水平居中对齐（设计稿做法）；
 * - 连线语义：实线 = 夫妻有子女，虚线 = 夫妻无子女。
 */
export function generateLayout(
  data: FamilyData,
  rootId: string | null,
  selectedPersonId: string | null = null
): LayoutResult {
  if (!rootId || !data.people[rootId]) {
    return { nodes: [], edges: [] };
  }

  // 1. 划分家庭单元：每段婚姻把夫妻并入同一单元
  const unitOf = new Map<string, string>();
  const units = new Map<string, FamilyUnit>();
  Object.keys(data.people).forEach(id => {
    unitOf.set(id, id);
    units.set(id, { key: id, ids: [id], width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  Object.values(data.marriages).forEach(m => {
    const hu = m.husbandId;
    const wi = m.wifeId;
    if (!data.people[hu] || !data.people[wi]) return;
    const huKey = unitOf.get(hu);
    const wiKey = unitOf.get(wi);
    if (!huKey || !wiKey || huKey === wiKey) return;
    const a = units.get(huKey);
    const b = units.get(wiKey);
    if (!a || !b) return;
    units.set(huKey, {
      key: huKey,
      ids: [...a.ids, ...b.ids],
      width: a.width + b.width + COUPLE_GAP,
      height: Math.max(a.height, b.height),
    });
    units.delete(wiKey);
    b.ids.forEach(id => unitOf.set(id, huKey));
  });

  // 2. dagre 布局（单元级）
  const g = new dagre.graphlib.Graph({ directed: true, multigraph: false });
  g.setGraph({ rankdir: 'TB', nodesep: NODE_SEP, ranksep: RANK_SEP });
  g.setDefaultEdgeLabel(() => ({}));
  units.forEach(u => g.setNode(u.key, { width: u.width, height: u.height }));

  const seenEdges = new Set<string>();
  Object.values(data.marriages).forEach(m => {
    const parentUnit = unitOf.get(m.husbandId) ?? unitOf.get(m.wifeId);
    if (!parentUnit) return;
    m.childrenIds.forEach(childId => {
      if (!data.people[childId]) return;
      const childUnit = unitOf.get(childId);
      if (!childUnit || childUnit === parentUnit) return;
      const edgeKey = `${parentUnit}->${childUnit}`;
      if (seenEdges.has(edgeKey)) return;
      seenEdges.add(edgeKey);
      g.setEdge(parentUnit, childUnit, { weight: 2 });
    });
  });

  dagre.layout(g);

  const centerOf = (key: string) => g.node(key) as { x: number; y: number } | undefined;

  const nodes: Node[] = [];
  const edges: LayoutEdge[] = [];
  /** personId → 卡片中心坐标 */
  const centerByPerson = new Map<string, { x: number; y: number }>();

  // 3. 展开单元为人物节点：男左女右
  units.forEach(u => {
    const pos = centerOf(u.key);
    if (!pos) return;
    const halfSpread = u.width / 2 - NODE_WIDTH / 2;
    u.ids.forEach((id, i) => {
      const offset = u.ids.length === 1 ? 0 : (i === 0 ? -halfSpread : halfSpread);
      centerByPerson.set(id, { x: pos.x + offset, y: pos.y });
      const person = data.people[id];
      if (!person) return;
      nodes.push({
        id,
        type: 'personNode',
        position: { x: pos.x + offset - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
        data: { person, isSelected: id === selectedPersonId },
      });
    });
  });

  // 4. 婚姻圆点 + 夫妻连线 / 世代连线
  Object.values(data.marriages).forEach(m => {
    const husband = centerByPerson.get(m.husbandId);
    const wife = centerByPerson.get(m.wifeId);
    if (!husband || !wife) return;

    const hasChildren = m.childrenIds.length > 0;
    const dotX = (husband.x + wife.x) / 2 - MARRIAGE_NODE_SIZE / 2;
    const dotY = (husband.y + wife.y) / 2 - MARRIAGE_NODE_SIZE / 2;

    nodes.push({
      id: m.id,
      type: 'marriageNode',
      position: { x: dotX, y: dotY },
      data: { marriage: m, hasChildren },
      draggable: false,
      selectable: false,
    });

    // 夫妻连线：丈夫 → 妻子一条整线（圆点节点叠绘于线之上，拆成两段会因
    // 6px 圆点的 handle 偏移在中段留下空洞，视觉上误显为虚线）；无子女为虚线
    edges.push({
      id: `e-${m.husbandId}-${m.wifeId}`,
      source: m.husbandId,
      target: m.wifeId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'straight',
      style: {
        stroke: COLOR_MARRIAGE,
        strokeWidth: 2,
        strokeDasharray: hasChildren ? undefined : '3 3',
      },
      selectable: false,
    });

    // 世代连线：圆点 → 子女，折线
    m.childrenIds.forEach(childId => {
      if (!data.people[childId]) return;
      edges.push({
        id: `e-${m.id}-${childId}`,
        source: m.id,
        target: childId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        pathOptions: { borderRadius: 4 },
        style: { stroke: COLOR_CONNECTOR, strokeWidth: 2 },
        selectable: false,
      });
    });
  });

  return { nodes, edges };
}
