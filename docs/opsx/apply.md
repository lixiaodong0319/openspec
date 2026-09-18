> 本文是 `.claude/commands/opsx/apply.md` 的中文翻译，仅供阅读参考。
> 真正生效的是原文件；本文不参与 OpenSpec 工作流执行。

---
name: "OPSX: Apply"
description: "从 OpenSpec change 实现任务（实验性）"
allowed-tools: Bash(openspec:*)
category: "Workflow"
tags: ["workflow", "artifacts", "experimental"]
---

从一个 OpenSpec change 实现任务。

**store 选择：** 如果用户指定了某个 store（store 是注册在本机上、独立的 OpenSpec 仓库），或者工作本身就位于某个 store 中，请运行 `openspec store list --json` 来发现已注册的 store id，然后在读写 spec 和 change 的命令上传递 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 视为在后续整个工作流中粘性生效。下面这些命令中每一个未带作用域限定的示例都只是简写：在运行它之前，先追加该标志。例如，应运行 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未限定形式。其他命令不接受该标志。命令打印出的提示已经带有该标志；后续命令请继续保持。若没有指定 store，命令会作用于最近的本地 `openspec/` 根目录。

**项目检查：** 这些步骤假定项目已经在使用 OpenSpec。在第一个会写入任何内容的步骤之前（`new change`、`archive`、`sync specs`，或编写某个产物文件），先确认项目有根目录：运行 `openspec list --json`（当已选定 store 时带上 `--store <id>`，因为此时 store 就是根目录）并读取 `root`。root 是一个对象，说明项目已初始化。`"root": null` 说明没有初始化——此处没有 `openspec/` 目录，而诸如 `openspec new change` 这样的写入操作会作为副作用创建出该目录。该命令也会以非零状态退出，这就是它的答案本身，而不是 CLI 坏了，所以要读取 JSON，而不是重试或绕过它。

有一种 `"root": null` 与初始化无关：当 `status` 的错误信息以 `Declared in` 或 `Invalid store declaration in` 开头，并指向本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明该项目确实通过它声明的某个 store 在使用 OpenSpec，只是本机无法解析该 store（store 未注册，或 `store:` 行格式错误）。不要把它当作未初始化并跳过下面的分支：在写入前停下来，向用户展示该错误的 `message` 和 `fix`。

除此之外，在没有 root 的情况下，接下来会发生什么取决于该工作流是如何被触达的：

- **自动选中**：是你自己选择了该工作流，而用户既没有提到 OpenSpec、没有点名该 skill，也没有运行它的斜杠命令。停止使用 OpenSpec，按常规方式回答请求，就像本机没有安装 OpenSpec 一样。不要要求他们做任何设置，也不要提及 OpenSpec 设置。
- **用户显式请求 OpenSpec**：用户提到了 OpenSpec、点名了该 skill，或运行了它的斜杠命令。在写入前停下来，询问如何继续：为本项目做设置（`openspec init`）、指向他们已有的某个 store（`--store <id>`），或本次请求不借助 OpenSpec 继续。等待他们的答复。

在这两个分支中，绝不要以副作用的方式创建根目录：在用户要求之前不要运行 `openspec init`，不要手工创建 `openspec/` 文件，也不要让某个命令把它创建出来。

**输入**：可选地指定一个 change 名称（例如 `/opsx:apply add-auth`）。若省略，检查是否可从对话上下文中推断。若含糊或歧义，你必须提示用户从可用 change 中选择。

**步骤**

1. **选择 change**

   若提供了名称，就用它。否则：
   - 若用户在对话中提到过某个 change，则从对话上下文中推断
   - 若只存在一个活跃的 change，则自动选中
   - 若有歧义，运行 `openspec list --json` 获取可用 change，并让用户选择其一

   始终宣告："Using change: <name>"，以及如何覆盖（例如 `/opsx:apply <other>`）。

2. **检查状态以了解 schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   解析 JSON 以了解：
   - `schemaName`：正在使用的工作流（例如 "spec-driven"）
   - `planningHome`、`changeRoot` 和 `actionContext`：规划范围与编辑约束
   - 哪个产物包含任务（对于 spec-driven 通常是 "tasks"，其他 schema 请查看状态）

3. **获取 apply 指令**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   它会返回：
   - `contextFiles`：产物 ID -> 具体文件路径数组（随 schema 而异——可能是 proposal/specs/design/tasks，也可能是 spec/tests/implementation/docs）
   - 进度（总数、已完成、剩余）
   - 带状态的任务列表
   - 基于当前状态的动态指令
   - 可选的 `context`：来自所选 root 的、当前必需的项目指令输入
   - 可选的 `operationGuidance`：apply 的当前建议性指引
   - `missingArtifacts`（存在时）：没有产出的必需产物 id

   **处理各状态：**
   - 若 `state: "blocked"`：显示消息并暂停实现。
     - 若 `missingArtifacts` 非空：建议先补全缺失的产物。运行 `openspec status --change "<name>" --json`，选择下一个 `ready` 的产物（不是 `skipped` 或 `blocked`），并用 `openspec instructions "<artifact-id>" --change "<name>" --json` 获取其规则与模板。两个命令都要保留已选定的 `--store <id>`。
     - 否则，遵循 CLI 指令，基于已有规划产物创建或修复 schema 配置的跟踪文件。在被阻塞期间，不要假定其他产物已就绪，也不要开始实现。
   - 若 `state: "all_done"`：表示祝贺，并建议 archive
   - 否则：进入实现

   把 `context` 视为必需的 prompt 级输入。阅读并考虑它，在实现时应用相关的项目事实、约定与约束。
   把 `operationGuidance` 视为可选、附加性的建议。阅读并考虑其中的每一条，对适用且与内置工作流兼容的条目予以遵循。

   要把这两个字段与 CLI 返回的状态、缺失产物、任务、进度、`contextFiles` 以及内置的 `instruction` 区分开。它们不是任务完成的证据，不能替代内置指令，也不允许绕过 blocked 状态。若 context 与内置指令、用户的明确选择或 CLI 控制的值冲突，报告该冲突并保留起控制作用的值。若指引不适用，或与这些起控制作用的输入冲突，则不要遵循它，并解释原因。这些是 prompt 级的行为契约，不是可强制执行的检查。

4. **读取上下文文件**

   读取 apply 指令输出中 `contextFiles` 下列出的每一个文件路径。
   这些文件取决于所使用的 schema：
   - **spec-driven**：proposal、specs、design、tasks
   - 其他 schema：遵循 CLI 输出中的 contextFiles

   除非用户另有所求，不要把 `context` 或 `operationGuidance` 逐字复制到实现文件或规划产物中。

5. **显示当前进度**

   显示：
   - 正在使用的 schema
   - 进度："N/M tasks complete"
   - 剩余任务概览
   - 来自 CLI 的动态指令

6. **实现任务（循环直至完成或被阻塞）**

   对每个待办任务：
   - 显示正在处理哪个任务
   - 进行所需的代码修改
   - 保持改动最小且聚焦
   - 在 tasks 文件中把任务标记为完成：`- [ ]` → `- [x]`
   - 继续下一个任务

   **在以下情况暂停：**
   - 任务不清晰 → 请求澄清
   - 实现过程暴露出设计问题 → 建议更新产物
   - 某个任务所需的工作超出 spec 和 tasks 所描述的范围，或者你动了为迁就实现而删除、收窄、推迟或对规定行为开例外口子的念头 → 把新增范围摆出来并询问；不要默不作声地吸收掉
   - 遇到错误或阻塞 → 报告并等待指引
   - 用户打断

7. **完成或暂停时，显示状态**

   显示：
   - 本次会话完成的任务
   - 总体进度："N/M tasks complete"
   - 若全部完成：建议 archive
   - 若已暂停：解释原因并等待指引

**实现期间的输出**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**完成时的输出**

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete! You can archive this change with `/opsx:archive`.
```

**暂停时的输出（遇到问题）**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
```

**护栏**
- 持续推进任务，直到完成或被阻塞
- 开始前始终读取上下文文件（来自 apply 指令输出）
- 若任务有歧义，先暂停并询问，再实现
- 若实现暴露出问题，暂停并建议更新产物
- 保持代码改动最小，并限定在各任务范围内
- 每完成一个任务后立即更新该任务的 checkbox
- 遇到错误、阻塞或不明确的需求就暂停——不要猜测
- 当某个任务所需的工作超出 spec 所描述的范围时，把新增范围摆出来并暂停——绝不默不作声地收窄、推迟或简化掉规定行为
- 只有当任务的规定行为被完整实现时，才把它标记为 `- [x]`，而不是在部分完成或推迟时就标记
- 使用 CLI 输出中的 contextFiles，不要假定具体文件名
- 不要把 context 或操作指引当作任务已完成的证明
- 应用相关的项目上下文；报告与起控制作用的工作流输入的冲突
- 考虑每一条指引条目；解释任何不适用或冲突的建议
- 不要把运行时上下文或操作指引复制到实现文件或规划产物中
- 保留 CLI 控制的 blocked/ready/all-done 行为与完成判定标准

**流式工作流集成**

该 skill 支持 "actions on a change" 模型：

- **任何时候都可调用**：在所有产物完成之前（若已有任务存在）、部分实现之后、与其他动作交错进行时
- **允许更新产物**：若实现暴露出设计问题，建议更新产物——不锁定阶段，灵活推进

## 附：与 skill 版本的差异

无实质差异（仅 frontmatter 不同）。
