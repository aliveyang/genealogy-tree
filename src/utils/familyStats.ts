import { FamilyData } from '../types';

const CN_NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const RANK = ['长', '次', '三', '四', '五', '六', '七', '八', '九', '十'];

export function toChineseNumber(n: number): string {
  if (n <= 10) return CN_NUM[n];
  if (n < 20) return `十${CN_NUM[n - 10]}`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${CN_NUM[tens]}十${ones ? CN_NUM[ones] : ''}`;
}

/**
 * 每个人所属世代（第一代 = 1）。
 * 根 = 无父母婚姻，且配偶也无父母（外娶/入赘者不是根，由配偶回填世代）；
 * 再沿「父母 → 子女」BFS 下推，配偶间互相补齐。
 */
export function computeGenerations(data: FamilyData): Map<string, number> {
  const parentMarriage = new Map<string, string>();
  Object.values(data.marriages).forEach(m => {
    m.childrenIds.forEach(childId => parentMarriage.set(childId, m.id));
  });

  const spouseOf = new Map<string, string>();
  Object.values(data.marriages).forEach(m => {
    if (data.people[m.husbandId] && data.people[m.wifeId]) {
      spouseOf.set(m.husbandId, m.wifeId);
      spouseOf.set(m.wifeId, m.husbandId);
    }
  });

  const gens = new Map<string, number>();

  // 血脉根：本人无父母，且配偶也不在任何婚姻的子女列中
  Object.keys(data.people).forEach(id => {
    if (parentMarriage.has(id)) return;
    const spouseId = spouseOf.get(id);
    if (spouseId && parentMarriage.has(spouseId)) return;
    gens.set(id, 1);
  });

  // 不动点迭代：父母世代 → 子女世代 +1，配偶互相回填
  let changed = true;
  while (changed) {
    changed = false;
    Object.values(data.marriages).forEach(m => {
      const gs = gens.get(m.husbandId);
      const gw = gens.get(m.wifeId);
      const pg = gs ?? gw;
      if (pg === undefined) return;
      if (gs === undefined && data.people[m.husbandId]) {
        gens.set(m.husbandId, pg);
        changed = true;
      }
      if (gw === undefined && data.people[m.wifeId]) {
        gens.set(m.wifeId, pg);
        changed = true;
      }
      m.childrenIds.forEach(childId => {
        if (!gens.has(childId) && data.people[childId]) {
          gens.set(childId, pg + 1);
          changed = true;
        }
      });
    });
  }

  // 兜底：数据成环等异常时，至少给未覆盖的人一个世代
  Object.keys(data.people).forEach(id => {
    if (!gens.has(id)) gens.set(id, 1);
  });

  return gens;
}

/** 「第三代」 */
export function generationLabel(gen: number): string {
  return `第${toChineseNumber(gen)}代`;
}

/** 「长子 / 次女」——按同胞出生顺序排行，性别后缀取本人性别 */
export function siblingRankTitle(data: FamilyData, personId: string): string | null {
  const marriage = Object.values(data.marriages).find(m => m.childrenIds.includes(personId));
  if (!marriage) return null;
  const index = marriage.childrenIds.indexOf(personId);
  if (index < 0) return null;
  const person = data.people[personId];
  if (!person) return null;
  const rank = RANK[Math.min(index, RANK.length - 1)];
  return `${rank}${person.gender === 'male' ? '子' : '女'}`;
}

/** 详情面板头部的备注，如「第三代 · 长子」 */
export function personSubtitle(data: FamilyData, personId: string, gens: Map<string, number>): string {
  const gen = gens.get(personId);
  const parts: string[] = [];
  if (gen) parts.push(generationLabel(gen));
  const rank = siblingRankTitle(data, personId);
  if (rank) parts.push(rank);
  return parts.join(' · ');
}

/** 各世代人数，按世代升序 */
export function generationCounts(gens: Map<string, number>): { gen: number; count: number }[] {
  const map = new Map<number, number>();
  gens.forEach(g => map.set(g, (map.get(g) ?? 0) + 1));
  return [...map.entries()]
    .map(([gen, count]) => ({ gen, count }))
    .sort((a, b) => a.gen - b.gen);
}

/**
 * 支系：同一世代中「育有子女的家庭」数量的最大值。
 * 张氏示例数据第二代有 2 个家庭各自育有子女，故为 2 支。
 */
export function branchCount(data: FamilyData, gens: Map<string, number>): number {
  const perGen = new Map<number, number>();
  Object.values(data.marriages).forEach(m => {
    if (m.childrenIds.length === 0) return;
    const gen = gens.get(m.husbandId) ?? gens.get(m.wifeId);
    if (gen === undefined) return;
    perGen.set(gen, (perGen.get(gen) ?? 0) + 1);
  });
  let max = 0;
  perGen.forEach(v => {
    if (v > max) max = v;
  });
  return max;
}

/** 直系链：从最顶层祖先到指定成员的 id 链（移动端世系速览用） */
export function directLine(data: FamilyData, personId: string): string[] {
  const line: string[] = [];
  let current: string | undefined = personId;
  const guard = new Set<string>();

  while (current && !guard.has(current)) {
    guard.add(current);
    if (data.people[current]) line.unshift(current);
    const parentMarriage = Object.values(data.marriages).find(m =>
      m.childrenIds.includes(current as string)
    );
    if (!parentMarriage) break;
    current = data.people[parentMarriage.husbandId] ? parentMarriage.husbandId : parentMarriage.wifeId;
  }

  return line;
}
