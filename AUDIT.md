# 族谱构建（Genealogy Tree Builder）审计报告

> 审计日期：2026-09-12 ｜ 审计方式：全仓库静态扫描（ponytail-audit 协议，聚焦过度设计与死代码）
> 审计范围：`src/` 全部 24 个源文件（约 4100 行）、package.json 依赖、配置与文档
> 审计基线：`npm run lint`（tsc --noEmit）零错误

---

## 一、审计结论（TL;DR）

1. **架构合规**：分层依赖方向（components → hooks → utils → types）、婚姻一等实体、`crypto.randomUUID()`、不可变更新、男左女右与虚/实线语义均符合 AGENTS.md。
2. **前两轮审计（2026-09-06）的 AI Studio 清理与 P1 修复已全部落地**，当前无平台残留；6 个运行时依赖全部有源码级引用。
3. 本轮新发现集中在**死代码**：1 个整文件未被引用、1 个 97 行的死 mutation、2 个死类型字段、若干死导出。合计约 **-255 行、-1 个依赖**可削减。

---

## 二、发现清单（按可削减量排序）

格式：`<标签> <应削减项>. <替代方案>. [位置]`

- `delete:` `calculateKinship` 及整套称谓字典（219 行），全仓库零引用，展示层称谓已由 `relations.ts` / `familyStats.ts` 的直查逻辑覆盖。替代：删除整文件，并同步移除 AGENTS.md 第 2 节表格中对应行。[src/utils/kinshipCalculator.ts]
- `delete:` `loadExampleData`（97 行内置演示数据），App 与所有组件零调用，已被 `buildZhangFamily` + `loadZhangFamily` 取代。替代：删除。[src/hooks/useFamilyTree.ts:279-375]
- `delete:` `addChild` / `getPersonMarriage` 两个 mutation 导出后无任何外部调用（界面统一走 `addChildToPerson`）。替代：移除导出；注意 `addChild` 被 AGENTS.md 第 3 节 mutation 清单点名，删除时需同步修订该清单。[src/hooks/useFamilyTree.ts:61-80, 211-213]
- `delete:` `Person.avatarUrl` / `Person.notes` 死字段，从未写入或读取。替代：删除。[src/types.ts:30-31]
- `delete:` `MobileHeader` 死导入（本组件自绘头部，未复用 shared 的头栏）。替代：删除该行。[src/components/mobile/MobileDetail.tsx:4]
- `shrink:` 「仅直系」视图内的祖先上溯 while 循环与现成 `directLine()` 逻辑重复。替代：复用 `directLine`，约省 12 行。[src/components/FamilyTreeViewer.tsx:92-104 ↔ src/utils/familyStats.ts:133-149]
- `native:` `clsx` 依赖仅 2 处使用（App.tsx、PersonNode.tsx），而代码库其余条件类名统一用 `[...].join(' ')` 惯用法。替代：改为 join 写法并移除依赖（-1 dep，同时消除两种并存的类名拼接风格）。[package.json, src/App.tsx:2, src/components/PersonNode.tsx:3]
- `yagni:` `formatYears` 是纯展示函数却导出自组件文件并被跨组件引用（mobile/shared.tsx）。替代：迁往 `src/utils/`，恢复「纯函数层」分层。[src/components/PersonNode.tsx:22-27]

**net: 约 -255 行，-1 依赖（6 → 5）。**

---

## 三、AGENTS.md 合规性核查（对照第 3、4 节）

| 核查项 | 结论 | 证据 |
|---|---|---|
| 不变量 1：Marriage 一等实体 | ✅ | 子女一律经 `Marriage.childrenIds` 挂载（含 `addSibling` 插入父母婚姻） |
| 不变量 2：配偶性别自动取反 | ✅ | `addSpouse` / `addChildToPerson` / `addParentPerson` / `buildTemplate` 均取反 |
| 不变量 3：id 用 `crypto.randomUUID()` | ✅ | hook 与 `buildTemplate` 全部如此；示例数据用可读的 `zhang-*` 前缀（静态演示数据，可接受） |
| 不变量 4：不可变更新 | ✅ | 全部展开式写法，无原地 mutation |
| 不变量 5：rootId 为 App 本地 UI 状态 | ✅ | `App.tsx` `useState`，不入 `FamilyData` |
| 状态变更集中于 `useFamilyTree` | ✅ | 未暴露 `setData`，全部变更经 mutation |
| 节点类型注册 | ✅ | `personNode` / `marriageNode` 两类均注册进 `nodeTypes` |
| 男左女右 / 虚实线语义 | ✅ | `layoutEngine` 单元合并保持丈夫在前；`strokeDasharray` 仅无子女时出现 |
| 布局全量重算 | ✅ | `useEffect` 依赖 data / rootId / selected，无增量缓存 |
| 简体中文文案 / 浅色主题 | ✅ | 全部 UI 文案为简体中文；`index.html` 为 `lang="zh-CN"` |

---

## 四、非代码资产处置

- `design/`：10 张设计稿 PNG，为界面实现依据，**保留入库**。
- `AUDIT.md`：本报告，入库。
- `.workbuddy/`、`.zcode/`、`probe.py`：会话与调试产物（截图、计划、像素探测脚本），**不入库**（已加入 .gitignore）。

---

## 五、历史审计摘要

- **2026-09-06 第一轮**：清除 AI Studio 平台胶水与 Gemini 服务端能力（11 个依赖、约 72 行），`index.html` 中文化，tsconfig 模板遗留开关清理。已全部落地。
- **2026-09-06 第二轮**：修复 P1——为无配偶成员添加子女时子女被静默丢弃（state 异步导致的旧闭包问题），落地为原子 mutation `addChildToPerson`，AGENTS.md 同步。
- **仍开放项**：数据持久化（当前刷新即失为产品既定设计；已有 JSON 导出与 GEDCOM 导入演示桩，真实导入待另行评审）。

---

## 六、处理状态（2026-09-12 清理轮）

第二节全部发现已应用，`git diff --stat` 净变化 **-368 行（+44 / -412），运行时依赖 6 → 5**：

- 删除 `kinshipCalculator.ts` 整文件；AGENTS.md 第 2 节表格同步移除该行。
- 删除 `loadExampleData`、`addChild`、`getPersonMarriage`；AGENTS.md 第 3 节 mutation 清单同步移除 `addChild`。
- 删除 `Person.avatarUrl` / `Person.notes` 死字段与 `MobileDetail` 的 `MobileHeader` 死导入。
- 「仅直系」视图改为复用 `directLine()`；顺带移除该块内一次重复的婚姻查找与一处已证明无效的 `keep.add`（命中值必已在集合中）。
- `formatYears` 迁往 `src/utils/familyStats.ts`。
- 移除 `clsx` 依赖，条件类名统一为 `[...].join(' ')` 惯用法。
- 顺带修正 AGENTS.md 头部已过时的「非 git 仓库」表述。

验证：`npm run lint`（tsc --noEmit）零错误，`npm run build` 成功。
