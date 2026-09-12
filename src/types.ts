export type Gender = 'male' | 'female';

/** 生平事件（详情面板「生平事件」分组的一行） */
export interface LifeEvent {
  year: string;
  title: string;
  /** 补充说明，如「绍兴至杭州」 */
  detail?: string;
}

export interface Person {
  id: string;
  name: string;
  gender: Gender;
  birthYear?: string;
  /** 完整出生日期展示文案（如「1985 年 3 月 12 日」），仅供示例数据展示 */
  birthDate?: string;
  deathYear?: string;
  isDeceased?: boolean;
  /** 籍贯 */
  nativePlace?: string;
  /** 现居地 */
  residence?: string;
  /** 职业 */
  occupation?: string;
  /** 生平简述 */
  bio?: string;
  /** 生平事件，按时间正序 */
  events?: LifeEvent[];
}

/**
 * For a genealogy tree, it's often better to represent "Marriage" as a first-class entity
 * to connect parents to children.
 */
export interface Marriage {
  id: string;
  husbandId: string;
  wifeId: string;
  childrenIds: string[];
}

export interface FamilyData {
  people: Record<string, Person>;
  marriages: Record<string, Marriage>;
  // We can derive "siblings" by people who share the same marriage/parents
}

/** 左侧「我的宗谱」列表项 */
export interface PedigreeSummary {
  id: string;
  name: string;
  memberCount: number;
}

/** 添加成员抽屉的表单值 */
export interface MemberFormValue {
  name: string;
  nativePlace: string;
  gender: Gender;
  birthYear: string;
  deathYear: string;
  /** 以谁为参照的成员 id，仅新增态使用 */
  refId: string;
  /** 与参照人的关系类型，仅新增态使用 */
  relation: RelationType;
}

export type RelationType = '父亲' | '母亲' | '配偶' | '子女' | '兄弟姐妹';

/** 空态「从模板快速开始」的三个模板 */
export type TemplateKind = '三代同堂' | '单系直系' | '双亲与子女';

/** GEDCOM 导入流程的三个阶段，对应设计稿三张屏 */
export type ImportPhase = 'loading' | 'error' | 'partial';
