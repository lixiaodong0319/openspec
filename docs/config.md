# `openspec/config.yaml` 说明（中文译文）

> 本文是 `openspec/config.yaml` 的中文说明，仅供阅读参考。
> 真正生效的是原文件 `openspec/config.yaml`。

## 原文件内容

```yaml
schema: spec-driven

context: |
  Language: zh-CN
  All artifacts must be written in zh-CN.
  Keep OpenSpec structural headings and SHALL/MUST keywords in English.

# Per-artifact rules (optional)
# Add custom rules for specific artifacts.
rules:
  tasks:
    - 每个功能任务必须按 TDD 顺序书写：先写失败的测试（Red），再实现（Green），最后重构（Refactor）
    - 任务描述中明确标注对应的测试文件路径（src/**/*.spec.ts）与验证命令（npm run test:run）
    - 任务完成后必须以 `npm run test:run` 与 `npm run typecheck` 全绿作为完成标准

# Per-operation guidance (optional)
# Add advisory guidance for how apply and archive work should be conducted.
# This is separate from artifact rules above.
# Example:
#   operations:
#     apply:
#       guidance:
#         - Keep test summaries concise
#     archive:
#       guidance:
#         - Summarize the archive outcome before finishing
```

## 逐项说明

### `schema: spec-driven`

指定本项目使用的 workflow schema。`spec-driven` 是默认 schema，它定义的 change 产物为：

| 产物 | 文件 | 内容 |
|---|---|---|
| `proposal` | `proposal.md` | what & why —— 要做什么、为什么 |
| `specs` | `specs/<capability-path>/spec.md` | what the system must do —— 系统必须做什么，写成 **delta**，不是 main spec |
| `design` | `design.md` | how —— 怎么做。属条件性产物，是否创建由 `openspec instructions` 返回的 `instruction` 字段决定 |
| `tasks` | `tasks.md` | implementation steps —— 实现步骤 |

产物清单以 `openspec status --change "<name>" --json` 与 `openspec instructions` 的返回为准，**不要硬编码假设**。

### `context`

项目级背景与约束。CLI 通过 `openspec context --json` 或 `openspec instructions` 把它注入到 agent 的提示里。

原文含义：

- `Language: zh-CN` —— 语言为简体中文。
- `All artifacts must be written in zh-CN.` —— 所有产物必须用简体中文书写。
- `Keep OpenSpec structural headings and SHALL/MUST keywords in English.` —— OpenSpec 的结构性标题以及 `SHALL` / `MUST` 关键字保留英文。

**重要**：`context` 是给 agent 的约束，**不是产物内容**。propose 文档明确要求不得把 `context` 块复制进任何产物文件。

只有 `context` 字段是字符串、且 UTF-8 编码不超过 51,200 字节时才会生效。

### `rules`

按 **artifact id** 键控的书写规则。原文措辞：条目只在该 artifact 被书写时才适用（the entries for an artifact apply only when you write that artifact）。

当前只配置了 `rules.tasks`，即三条规则**只约束 `tasks.md` 的书写**：

1. 每个功能任务必须按 TDD 顺序书写：先写失败的测试（Red），再实现（Green），最后重构（Refactor）。
2. 任务描述中明确标注对应的测试文件路径（`src/**/*.spec.ts`）与验证命令（`npm run test:run`）。
3. 任务完成后必须以 `npm run test:run` 与 `npm run typecheck` 全绿作为完成标准。

对应的 `package.json` 脚本：

```json
"test:run": "vitest run",
"typecheck": "vue-tsc -b --noEmit"
```

`rules` 同样是约束而非内容，不得复制进产物文件。sync 文档中也有对应表述：artifact rules 只约束被书写的 spec，永不复制进输出文件。

**注意一个容易误解的点**：Red / Green / Refactor 是「`tasks.md` 条目怎么写」的顺序要求，**不是 apply 阶段逐任务切换的状态机**。apply 文档只要求「改代码 + 勾选 checkbox + 遇阻塞暂停」，其中并未出现 Red/Green/Refactor 字样。

### `operations`（当前全部被注释掉）

`operations.apply.guidance` 与 `operations.archive.guidance` 是给 apply / archive 阶段的**建议性指引**，与上面的 artifact rules 是两回事。

当前配置中整段被注释，即**未配置任何 operationGuidance**。apply 文档会从 `openspec instructions apply` 的返回里读取可选的 `operationGuidance` 字段，为空时就不注入额外指引。

## 相关命令

```bash
# 查看当前生效的工作上下文
openspec context --json

# 查看某个 artifact 的完整指令（含 context / rules / template / instruction / resolvedOutputPath）
openspec instructions "<artifact-id>" --change "<name>" --json

# 查看 apply / archive 阶段的指令
openspec instructions apply --change "<name>" --json
openspec instructions archive --change "<name>" --json

# 校验 specs
openspec validate --specs
```
