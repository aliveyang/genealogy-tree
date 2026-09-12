import { FamilyData, Gender, LifeEvent, Marriage, Person, TemplateKind } from '../types';

/** 供界面展示的事件简写 */
const ev = (year: string, title: string): LifeEvent => ({ year, title });

/** 带补充说明的事件简写（设计稿「迁居 1998 年 · 绍兴至杭州」样式） */
const evd = (title: string, year: string, detail: string): LifeEvent => ({
  year,
  title,
  detail,
});

type SeedPerson = Omit<Person, 'id'> & { key: string };

const PEOPLE: SeedPerson[] = [
  {
    key: 'zsy',
    name: '张守义',
    gender: 'male',
    birthYear: '1932',
    deathYear: '2008',
    isDeceased: true,
    nativePlace: '浙江绍兴 · 柯桥',
    residence: '浙江绍兴 · 柯桥',
    occupation: '农民',
    events: [
      ev('1932', '生于绍兴柯桥'),
      ev('1956', '与王秀兰成婚'),
      ev('2008', '于柯桥故宅逝世'),
    ],
    bio: '本支宗谱第一代。一生务农于柯桥，勤俭持家，膝下二子一女，为张氏迁居绍兴后第三代守祖之人。',
  },
  {
    key: 'wxl',
    name: '王秀兰',
    gender: 'female',
    birthYear: '1935',
    deathYear: '2019',
    isDeceased: true,
    nativePlace: '浙江绍兴 · 安昌',
    residence: '浙江绍兴 · 柯桥',
    occupation: '家务',
    events: [ev('1935', '生于绍兴安昌'), ev('1956', '与张守义成婚')],
    bio: '持家有道，抚育三子，晚年随长子定居柯桥。',
  },
  {
    key: 'zmy',
    name: '张明远',
    gender: 'male',
    birthYear: '1958',
    nativePlace: '浙江绍兴 · 柯桥',
    residence: '浙江杭州 · 西湖区',
    occupation: '中学教师',
    events: [ev('1958', '生于绍兴柯桥'), ev('1982', '与李慧芳成婚'), ev('1990', '举家迁居杭州')],
    bio: '长子。1977 年恢复高考后首届考入师范，长期执教于杭州，主持本支宗谱的首轮整理。',
  },
  {
    key: 'lhf',
    name: '李慧芳',
    gender: 'female',
    birthYear: '1961',
    nativePlace: '浙江杭州 · 余杭',
    residence: '浙江杭州 · 西湖区',
    occupation: '会计',
    events: [ev('1961', '生于杭州余杭'), ev('1982', '与张明远成婚')],
    bio: '精于账目，宗谱历次修编的经费与文书多出其手。',
  },
  {
    key: 'zmh',
    name: '张明慧',
    gender: 'female',
    birthYear: '1962',
    nativePlace: '浙江绍兴 · 柯桥',
    residence: '浙江宁波 · 海曙区',
    occupation: '医生',
    events: [ev('1962', '生于绍兴柯桥'), ev('1986', '与陈国栋成婚')],
    bio: '次女。毕业于浙江医科大学，现居宁波。',
  },
  {
    key: 'cgd',
    name: '陈国栋',
    gender: 'male',
    birthYear: '1960',
    nativePlace: '浙江宁波 · 慈溪',
    residence: '浙江宁波 · 海曙区',
    occupation: '工程师',
    events: [ev('1960', '生于宁波慈溪'), ev('1986', '与张明慧成婚')],
    bio: '入赘张氏，与张明慧同为宁波一脉。',
  },
  {
    key: 'zsc',
    name: '张思成',
    gender: 'male',
    birthYear: '1985',
    birthDate: '1985 年 3 月 12 日',
    nativePlace: '浙江绍兴 · 柯桥',
    residence: '浙江杭州 · 西湖区',
    occupation: '产品设计师',
    events: [
      evd('迁居', '1998', '绍兴至杭州'),
      evd('毕业', '2012', '中国美术学院'),
      evd('立谱', '2024', '主修本支宗谱'),
    ],
    bio: '生于绍兴柯桥，幼年随父母迁居杭州。毕业于中国美术学院工业设计系，现从事产品设计工作，并主持编修本支宗谱。',
  },
  {
    key: 'zyq',
    name: '周雅琴',
    gender: 'female',
    birthYear: '1987',
    nativePlace: '浙江杭州 · 萧山',
    residence: '浙江杭州 · 西湖区',
    occupation: '小学教师',
    events: [ev('1987', '生于杭州萧山'), ev('2010', '与张思成成婚')],
    bio: '与张思成同为教育世家出身。',
  },
  {
    key: 'zsy2',
    name: '张思雨',
    gender: 'female',
    birthYear: '1988',
    nativePlace: '浙江宁波 · 海曙区',
    residence: '浙江宁波 · 海曙区',
    occupation: '护士',
    events: [ev('1988', '生于宁波海曙')],
    bio: '张明慧与陈国栋之女。',
  },
  {
    key: 'zyn',
    name: '张一诺',
    gender: 'female',
    birthYear: '2015',
    nativePlace: '浙江杭州 · 西湖区',
    residence: '浙江杭州 · 西湖区',
    occupation: '学生',
    events: [ev('2015', '生于杭州')],
  },
  {
    key: 'zyh',
    name: '张一珩',
    gender: 'male',
    birthYear: '2018',
    nativePlace: '浙江杭州 · 西湖区',
    residence: '浙江杭州 · 西湖区',
    occupation: '学生',
    events: [ev('2018', '生于杭州')],
  },
];

/** 婚姻：丈夫在前、妻子在后（男左女右） */
const MARRIAGES: { key: string; husband: string; wife: string; children: string[] }[] = [
  { key: 'm1', husband: 'zsy', wife: 'wxl', children: ['zmy', 'zmh'] },
  { key: 'm2', husband: 'zmy', wife: 'lhf', children: ['zsc'] },
  { key: 'm3', husband: 'cgd', wife: 'zmh', children: ['zsy2'] },
  { key: 'm4', husband: 'zsc', wife: 'zyq', children: ['zyn', 'zyh'] },
];

/**
 * 张氏宗谱示例数据：4 代 11 人、4 段婚姻。
 * 与设计稿主工作台一致（张守义 → 张明远 → 张思成 → 张一诺 / 张一珩 为直系）。
 */
export function buildZhangFamily(): FamilyData {
  const people: Record<string, Person> = {};
  const keyToId: Record<string, string> = {};

  PEOPLE.forEach(p => {
    const id = `zhang-${p.key}`;
    keyToId[p.key] = id;
    const { key: _key, ...rest } = p;
    void _key;
    people[id] = { ...rest, id };
  });

  const marriages: Record<string, ReturnType<typeof buildZhangFamily>['marriages'][string]> = {};
  MARRIAGES.forEach(m => {
    const id = `zhang-${m.key}`;
    marriages[id] = {
      id,
      husbandId: keyToId[m.husband],
      wifeId: keyToId[m.wife],
      childrenIds: m.children.map(k => keyToId[k]),
    };
  });

  return { people, marriages };
}

/** 宗谱档案名 */
export const ZHANG_FAMILY_NAME = '张氏宗谱';
export const ZHANG_FAMILY_REGION = '浙江绍兴';

/** 张氏示例成员数（侧栏在张氏宗谱非激活时显示的静态口径） */
export const ZHANG_MEMBER_COUNT = Object.keys(buildZhangFamily().people).length;

/**
 * 空态「从模板快速开始」的三份小型示例数据。
 * 子女一律挂婚姻（婚姻一等实体）、夫妻男左女右；id 按规范使用 crypto.randomUUID()。
 */
export function buildTemplate(kind: TemplateKind): FamilyData {
  const uid = () => crypto.randomUUID();
  const people: Record<string, Person> = {};
  const marriages: Record<string, Marriage> = {};
  const link = (husbandId: string, wifeId: string, childrenIds: string[]) => {
    const mId = uid();
    marriages[mId] = { id: mId, husbandId, wifeId, childrenIds };
  };

  if (kind === '三代同堂') {
    // 祖辈 → 父辈夫妻 → 一子一女
    const gf = uid();
    const gm = uid();
    const f = uid();
    const m = uid();
    const s = uid();
    const d = uid();
    people[gf] = { id: gf, name: '张德厚', gender: 'male', birthYear: '1940' };
    people[gm] = { id: gm, name: '吴桂芳', gender: 'female', birthYear: '1943' };
    people[f] = { id: f, name: '张绍棠', gender: 'male', birthYear: '1968' };
    people[m] = { id: m, name: '郑秀云', gender: 'female', birthYear: '1970' };
    people[s] = { id: s, name: '张嘉树', gender: 'male', birthYear: '1996' };
    people[d] = { id: d, name: '张嘉禾', gender: 'female', birthYear: '1999' };
    link(gf, gm, [f]);
    link(f, m, [s, d]);
  } else if (kind === '单系直系') {
    // 每代单传的直系链
    const g1 = uid();
    const g1w = uid();
    const g2 = uid();
    const g2w = uid();
    const g3 = uid();
    people[g1] = { id: g1, name: '张德厚', gender: 'male', birthYear: '1940' };
    people[g1w] = { id: g1w, name: '吴桂芳', gender: 'female', birthYear: '1942' };
    people[g2] = { id: g2, name: '张绍棠', gender: 'male', birthYear: '1968' };
    people[g2w] = { id: g2w, name: '郑秀云', gender: 'female', birthYear: '1970' };
    people[g3] = { id: g3, name: '张嘉树', gender: 'male', birthYear: '1996' };
    link(g1, g1w, [g2]);
    link(g2, g2w, [g3]);
  } else {
    // 双亲与子女：一对夫妻带三个子女
    const f = uid();
    const m = uid();
    const s = uid();
    const d = uid();
    const y = uid();
    people[f] = { id: f, name: '张绍棠', gender: 'male', birthYear: '1968' };
    people[m] = { id: m, name: '郑秀云', gender: 'female', birthYear: '1970' };
    people[s] = { id: s, name: '张嘉树', gender: 'male', birthYear: '1996' };
    people[d] = { id: d, name: '张嘉禾', gender: 'female', birthYear: '1999' };
    people[y] = { id: y, name: '张嘉木', gender: 'male', birthYear: '2003' };
    link(f, m, [s, d, y]);
  }

  return { people, marriages };
}
