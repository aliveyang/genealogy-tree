# AGENTS.md — 族谱构建（Genealogy Tree Builder）工程规范

> 本文件是智能体在本仓库工作的约束性规范。条款采用三级效力：【必须】/【禁止】/【应当】。
> 平台：纯前端单页应用（Vite）｜ 技术栈：React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS v4 + @xyflow/react 12 + dagre ｜ 界面语言：简体中文 ｜ 非 git 仓库

## 1. 工具链与命令

包管理器固定为 **npm**（以 package-lock.json 为准）。

| 场景 | 命令 | 说明 |
|---|---|---|
| 本地开发 | `npm run dev` | Vite 端口 3000，host 0.0.0.0 |
| 生产构建 | `npm run build` | `vite build`（默认清空 `dist/`） |
| 类型检查 | `npm run lint` | 即 `tsc --noEmit`，**仓库唯一的静态校验手段** |
| 预览 | `npm run preview` | 预览构建产物 |

- 任何 TypeScript 改动完成后【必须】运行 `npm run lint` 并确认零错误。
- 【禁止】主动引入 ESLint / Prettier / 测试框架等新工具链，除非用户明确要求。

## 2. 分层架构与依赖方向

入口链：`index.html` → `src/main.tsx` → `src/App.tsx`。纯前端单页应用，**无后端、无持久化**（数据仅存内存，刷新即失）。

```
components/   ──►   hooks/   ──►   utils/   ──►   types.ts
  (视图层)          (状态层)      (纯函数层)     (数据模型层)
```

- 依赖方向【必须】单向自上而下：components → hooks → utils → types。【禁止】反向引用（types / hooks 不得 import 组件）。
- 各层职责与边界：

| 模块 | 职责 | 工程边界 |
|---|---|---|
| `src/types.ts` | 定义 `FamilyData` 等数据模型 | 纯类型，零运行时逻辑 |
| `src/hooks/useFamilyTree.ts` | `FamilyData` 的唯一变更入口 | 不可变更新与 id 生成集中于此；**未对外暴露 setData** |
| `src/utils/layoutEngine.ts` | dagre 布局 → React Flow nodes/edges | 纯函数，不触碰状态 |
| `src/utils/kinshipCalculator.ts` | 中文称谓计算 | 纯函数 + 字典查表 |
| `src/components/*` | 视图与交互 | 只消费 props / 回调，不自持业务状态 |

## 3. 数据模型不变量（Invariants）

以下不变量是全系统正确性的前提，任何改动【必须】保持：

1. **Marriage 是一等实体**：`FamilyData = { people, marriages }`，子女通过 `Marriage.childrenIds` 挂载到婚姻，【禁止】引入 person→person 的直接父子关系来渲染。
2. **配偶性别自动取反**：新增配偶的性别恒为现有人员性别的相反值（见 `addSpouse`）。
3. **id 生成**：一律使用 `crypto.randomUUID()`，【禁止】自造 id 方案。
4. **不可变更新**：状态更新只采用展开式写法，【禁止】原地 mutation。
5. **rootId 是 App.tsx 的本地 UI 状态**，不属于 `FamilyData`；Sidebar 可通过 `onSetRoot` 重新定根。

所有数据变更【必须】经由 `useFamilyTree` 暴露的 mutation（`addPerson` / `updatePerson` / `addParent` / `addSpouse` / `addChild` / `addChildToPerson` / `addSibling`）实现；新增变更能力【必须】实现为该 hook 内的 mutation，【禁止】绕开 hook 直接改状态。

## 4. 渲染与布局规范

- React Flow 自定义节点类型固定两个：`personNode`（人员卡片，180×80）、`marriageNode`（夫妻之间 4px 圆点）。新增节点类型【必须】同步注册进 `FamilyTreeViewer` 的 `nodeTypes`，否则运行时不渲染。
- 布局由 dagre 自上而下（TB）计算。**男左女右**：同一婚姻中丈夫居左、妻子居右（`layoutEngine` 中先插丈夫边、后插妻子边的顺序是其当前实现依据），修改布局【必须】保持该约定并用示例数据验证。
- 连线样式有语义：**虚线 = 无子女夫妻，实线 = 有子女**；调整样式【必须】保留该语义。
- 布局在 `useEffect` 中全量重算（data / rootId / 选中项任一变化即重跑），手动拖拽仅为临时偏移。这是有意设计，【禁止】引入增量布局缓存，除非用户要求。

## 5. 编码与样式规范

- 样式只用 Tailwind 工具类；v4 无 `tailwind.config`，管线入口是 `src/index.css` 的 `@import "tailwindcss"`。
- 主题基调为浅色（gray-50 背景 / 白卡片 / blue-600 主色），新 UI【应当】沿用。
- 路径别名 `@/*` 指向仓库根，且在 `tsconfig.json` 与 `vite.config.ts` 两处配置，【必须】同步修改；现有代码统一使用相对导入，新增代码【应当】跟随所在文件的既有风格。
- TS 配置：`noEmit` / `isolatedModules` / `allowImportingTsExtensions`（导入可带 `.tsx` 后缀）；**已开启 strict**。
- React 类型由 `@types/react` / `@types/react-dom` 提供（devDependencies）【禁止】删除——缺失时 untyped module 会整体退化为 `any`，`npm run lint` 将失去保障力。
- `src/utils/layoutEngine.ts` 中的 `LayoutEdge`（`Edge & { pathOptions }`）是为 smoothstep 的 `borderRadius` 做的局部扩展：`Edge` 基础类型未声明该字段，【禁止】直接把 `pathOptions` 写在 `Edge` 字面量上。
- 所有用户可见文案【必须】使用简体中文（产品定义见 `package.json` 的 `description`）。

## 6. 改动自检清单

提交前逐项确认：

- [ ] `npm run lint` 零错误
- [ ] 状态变更只发生在 `useFamilyTree`，第 3 节不变量未被破坏
- [ ] 新节点类型已在 `nodeTypes` 注册；布局保持男左女右与虚/实线语义
- [ ] 新 UI 文案为简体中文，样式沿用浅色主题工具类
- [ ] 未引入后端代码、AI 服务依赖与新工具链
