import { FamilyData } from '../types';

const EMPTY = '未记录';

const nameOf = (data: FamilyData, id?: string) => (id ? data.people[id]?.name : undefined);

export interface RelationRows {
  父母: string;
  配偶: string;
  子女: string;
  兄弟姐妹: string;
  /**
   * 兄弟姐妹行的称谓标签：按自身与同胞的性别、长幼（childrenIds 顺序为代理）
   * 推出「兄妹 / 姐弟 / 兄弟 / 姐妹」，无同胞时回退「兄弟姐妹」。
   */
  兄弟姐妹Label: string;
}

/**
 * 设计稿口径：张思成（兄 + 幼妹）显示「兄妹」，张一鸣（两姐 + 自身弟）显示「姐弟」——
 * 即年长者在前：长男幼男「兄弟」、长女幼女「姐妹」、长男幼女「兄妹」、长女幼男「姐弟」。
 */
function siblingLabel(
  data: FamilyData,
  personId: string,
  parentMarriage: { childrenIds: string[] }
): string {
  const self = data.people[personId];
  const firstSiblingId = parentMarriage.childrenIds.find(id => id !== personId);
  const first = firstSiblingId ? data.people[firstSiblingId] : undefined;
  if (!self || !first) return '兄弟姐妹';

  const selfIdx = parentMarriage.childrenIds.indexOf(personId);
  const firstIdx = parentMarriage.childrenIds.indexOf(firstSiblingId!);
  const elderIsSibling = firstIdx < selfIdx;
  const elderMale = elderIsSibling ? first.gender === 'male' : self.gender === 'male';
  const youngerMale = elderIsSibling ? self.gender === 'male' : first.gender === 'male';

  if (elderMale && youngerMale) return '兄弟';
  if (!elderMale && !youngerMale) return '姐妹';
  return elderMale ? '兄妹' : '姐弟';
}

/** 详情面板「亲属关系」四行的展示值 */
export function getRelations(data: FamilyData, personId: string): RelationRows {
  const parentMarriage = Object.values(data.marriages).find(m => m.childrenIds.includes(personId));
  const ownMarriage = Object.values(data.marriages).find(
    m => m.husbandId === personId || m.wifeId === personId
  );

  // 父母
  let 父母 = EMPTY;
  if (parentMarriage) {
    const father = nameOf(data, parentMarriage.husbandId);
    const mother = nameOf(data, parentMarriage.wifeId);
    const parts = [father, mother].filter(Boolean);
    if (parts.length) 父母 = parts.join(' · ');
  }

  // 配偶
  let 配偶 = EMPTY;
  if (ownMarriage) {
    const spouseId =
      ownMarriage.husbandId === personId ? ownMarriage.wifeId : ownMarriage.husbandId;
    const spouse = nameOf(data, spouseId);
    if (spouse) 配偶 = spouse;
  }

  // 子女
  let 子女 = EMPTY;
  if (ownMarriage) {
    const children = ownMarriage.childrenIds
      .map(id => nameOf(data, id))
      .filter(Boolean) as string[];
    if (children.length) 子女 = children.join(' · ');
  }

  // 兄弟姐妹
  let 兄弟姐妹 = EMPTY;
  if (parentMarriage) {
    const siblings = parentMarriage.childrenIds
      .filter(id => id !== personId)
      .map(id => nameOf(data, id))
      .filter(Boolean) as string[];
    if (siblings.length) 兄弟姐妹 = siblings.join(' · ');
  }

  return {
    父母,
    配偶,
    子女,
    兄弟姐妹,
    兄弟姐妹Label: parentMarriage ? siblingLabel(data, personId, parentMarriage) : '兄弟姐妹',
  };
}
