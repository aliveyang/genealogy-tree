# 族谱构建（Genealogy Tree Builder）

一个支持动态添加成员、辈分自动排布、男左女右布局的族谱关联展示软件，支持直系亲属、配偶及其兄弟姐妹的完整关系展示。

纯前端单页应用：无后端、无账号体系，数据仅保存在当前页面内存中（刷新即失），可随时导出 JSON 备份。

## 功能特性

- **族谱画布**：基于 dagre 自上而下排布世代，夫妻合并为家庭单元，同一婚姻中丈夫居左、妻子居右（男左女右）；支持缩放、平移、拖拽微调与「自动排列」复位。
- **成员管理**：以任意成员为参照添加父亲 / 母亲 / 配偶 / 子女 / 兄弟姐妹；为无配偶者添加子女会自动创建「未知配偶」占位，为无父母者添加兄弟姐妹会自动创建「未知父母」。
- **详情面板**：基本信息、亲属关系（父母 / 配偶 / 子女 / 兄弟姐妹，同胞标签按性别长幼自动区分为兄弟 / 姐妹 / 兄妹 / 姐弟）、生平事件与生平简述。
- **视图切换**：「全部展开」与「仅直系」两种视图；搜索支持姓名命中或世代命中（如输入「第三代」）并居中定位。
- **统计侧栏**：成员总数、世代分布、支系数量，以及「我的宗谱」列表。
- **示例与模板**：内置张氏宗谱示例（4 代 11 人）；空态提供「三代同堂 / 单系直系 / 双亲与子女」三个快速模板。
- **导入 / 导出**：GEDCOM 导入为演示流程（进行中 / 失败 / 部分成功三阶段模拟）；宗谱数据可导出为 JSON 文件。
- **移动端适配**：小于 lg 断点自动切换为底部三 Tab（族谱 / 成员 / 我的）、紧凑名条画布与成员详情页。

## 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | React 19 + TypeScript 5.8（strict） |
| 构建 | Vite 6 |
| 样式 | Tailwind CSS v4 |
| 画布 | @xyflow/react 12 + dagre |

## 快速开始

```bash
npm install
npm run dev       # 开发服务器，http://localhost:3000
```

| 命令 | 说明 |
|---|---|
| `npm run dev` | 本地开发（端口 3000） |
| `npm run build` | 生产构建，产物输出至 `dist/` |
| `npm run preview` | 预览构建产物 |
| `npm run lint` | 类型检查（`tsc --noEmit`） |

## 项目结构

```
src/
├── main.tsx / App.tsx          入口与应用壳（桌面 / 移动端分流、全局状态编排）
├── types.ts                    数据模型：Person / Marriage / FamilyData
├── hooks/
│   └── useFamilyTree.ts        状态层：FamilyData 的唯一变更入口（全部 mutation）
├── utils/
│   ├── layoutEngine.ts         dagre 布局 → React Flow nodes/edges
│   ├── familyStats.ts          世代计算、统计与成员展示文案
│   ├── relations.ts            详情面板亲属关系展示值
│   └── sampleData.ts           示例宗谱与快速模板数据
└── components/                 视图层（PersonNode / MemberDrawer / ImportDialog …，含 mobile/ 移动端组件）
```

依赖方向单向自上而下：components → hooks → utils → types。

## 核心设计

- **婚姻是一等实体**：数据模型为 `FamilyData = { people, marriages }`，子女通过 `Marriage.childrenIds` 挂载到婚姻，而非个人——这保证父母双方与子女的连接天然成立。
- **连线语义**：实线 = 夫妻有子女，虚线 = 夫妻无子女，婚姻圆点居夫妻卡片之间。
- **布局为全量重算**：数据、根成员或选中项任一变化即在 `useEffect` 中重跑 dagre 布局，手动拖拽仅为临时偏移。
- **状态集中**：所有数据变更经由 `useFamilyTree` 暴露的 mutation 完成，id 一律使用 `crypto.randomUUID()`，更新采用不可变写法。

## 相关文档

- [AGENTS.md](AGENTS.md) —— 智能体协作的工程规范（分层架构、数据不变量、编码约束与自检清单）
- [AUDIT.md](AUDIT.md) —— 全仓审计报告（2026-09-12，含处理状态）
- [design/](design/) —— 界面设计稿

## 已知限制

- 数据仅存内存，刷新即失；持久化尚未实现（见 AUDIT.md 开放项）。
- GEDCOM 导入目前为演示桩，未做真实文件解析。
- 「陈氏族谱」为演示占位，未收录数据。
