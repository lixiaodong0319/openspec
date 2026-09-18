> 本文是 `.claude/commands/opsx/update.md` 的中文翻译，仅供阅读参考。
> 真正生效的是原文件；本文不参与 OpenSpec 工作流执行。

---
name: "OPSX: Update"
description: "更新一个 change —— 修订已有的规划产物并保持它们的一致性（实验性）"
allowed-tools: Bash(openspec:*)
category: "Workflow"
tags: ["workflow", "artifacts", "experimental"]
---

修订一个 change 已有的规划产物，并保持它们的一致性。绝不编辑代码。

**store 选择：** 如果用户指定了某个 store（store 是本机注册的一个独立 OpenSpec 仓库），或者工作就位于某个 store 中，先运行 `openspec store list --json` 发现已注册的 store id，然后在所有读取或写入 spec 和 change 的命令上传入 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 视为在后续整个工作流中粘性生效。下文这些命令的每一个不带 store 作用域的示例都是简写：运行前先补上该标志。例如，应运行 `openspec status --change "<name>" --json --store "<id>"`，而不是下文展示的未加 store 的形式。其他命令不接受该标志。命令打印的提示已经带上该标志；后续跟进命令也请保留它。如果没有 store，命令作用于最近的本地 `openspec/` 根目录。

**项目检查：** 这些步骤期望项目已经在使用 OpenSpec。在第一个会写入任何内容的步骤之前（`new change`、`archive`、`sync specs`，或撰写产物文件），确认项目有根目录：运行 `openspec list --json`（当已选定 store 时加上 `--store <id>`，因为此时 store 就是根目录）并读取 `root`。root 是一个对象，说明项目已经配置好。`"root": null` 说明没有配置好 —— 这里没有 `openspec/` 目录，而像 `openspec new change` 这样的写入操作会作为副作用创建一个。该命令同时还会以非零状态码退出，那是这个答案本身，而不是 CLI 坏了，所以请读取 JSON，不要重试或绕开它。

有一种 `"root": null` 与配置无关：当 `status` 的错误信息以 `Declared in` 或 `Invalid store declaration in` 开头，并指名本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明项目确实通过它声明的某个 store 使用 OpenSpec，只是本机无法解析该 store（该 store 未注册，或 `store:` 那一行格式错误）。不要把它当作未初始化并跳过下面的分支：在写入前停下来，向用户展示该错误的 `message` 和 `fix`。

除此之外，在没有根目录的情况下，接下来会发生什么取决于进入本工作流的方式：

- **自动选中**：是你自己选择了这个工作流，用户没有点名 OpenSpec、没有点名这个 skill，也没有运行它的斜杠命令。停止使用 OpenSpec，按正常方式回答该请求，就当作没有安装 OpenSpec 一样。不要让他们去做什么配置，也不要提及 OpenSpec 的配置。
- **用户明确要求 OpenSpec**：用户点名了 OpenSpec、点名了这个 skill，或运行了它的斜杠命令。在写入前停下来并询问如何处理：配置本项目（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是本次请求不使用 OpenSpec 继续。等待他们的回答。

在两种分支下，都不要作为副作用创建根目录：在用户要求之前不要运行 `openspec init`，不要手工创建 `openspec/` 下的文件，也不要让任何命令创建它。

**Input**：可选地在 `/opsx:update` 之后指定一个 change 名称（例如 `/opsx:update add-auth`）。如果省略，检查是否可以从对话上下文中推断出来。如果模糊或有歧义，你必须提示用户从可用的 change 中选择。

本工作流修订的是已经存在的产物；它从不创建缺失的产物。当某个产物缺失时，`openspec status --change "<name>" --json` 会指出下一个产物，`openspec instructions "<artifact-id>" --change "<name>" --json` 会说明如何编写它。

**Steps**

1. **选择 change**

   如果提供了名称，就用它。否则：
   - 如果用户在对话中提到了某个 change，就从对话上下文中推断
   - 如果只存在一个活跃的 change，就自动选中它
   - 如果有歧义，运行 `openspec list --json` 获取按最近修改时间排序的可用 change，并让用户选择一个

   提示时，把最近修改的前 3-4 个 change 作为选项呈现，展示：
   - Change 名称
   - Schema（如果存在 `schema` 字段就取自它，否则为 "spec-driven"）
   - 状态（例如 "0/5 tasks"、"complete"、"no tasks"）
   - 最近修改的时间（取自 `lastModified` 字段）

   把最近修改的 change 标记为 "(Recommended)"，因为它很可能就是用户想要更新的那个。

   始终声明："Using change: <name>" 以及如何覆盖（例如 `/opsx:update <other>`）。

2. **获取该 change 的产物**
   ```bash
   openspec status --change "<name>" --json
   ```
   解析 JSON 以了解当前状态。响应包括：
   - `schemaName`：正在使用的工作流 schema（例如 "spec-driven"）
   - `artifacts`：产物数组，带有各自的状态（"done"、"skipped"、"ready"、"blocked"）
   - `isPlanningComplete`：布尔值，表示是否所有规划产物都已完成。较旧的 CLI 版本用 `isComplete` 暴露同一个值。
   - `planningHome`、`changeRoot`、`artifactPaths` 和 `actionContext`：路径与作用域上下文。请使用这些，而不要假定仓库内本地路径。

   产物 id 和路径来自当前激活的 schema —— 不要假定它们，也不要基于硬编码的产物名称做分支判断。自定义 schema 必须能不加改动地工作。

   要编辑的文件是 `artifactPaths.<id>.existingOutputPaths` —— 即磁盘上实际存在的具体文件，对 glob 产物（例如 `specs/**/*.md`）已经做过 glob 展开。不要写入 `resolvedOutputPath`：对 glob 产物而言它仍然是 glob 模式，不是真实文件。

3. **理解请求**
   - 如果用户要求的是具体修订（"the design now uses X"），那就是起始的编辑。
   - 如果他们只是说 "update" / "make this coherent"，就把它当作一次一致性审查：读取已有产物，互相比对，检查矛盾、缺口和重复。

4. **阅读并对账**
   - 阅读请求涉及的产物以及该 change 的其他已有产物。
   - 在对话中起草所请求的编辑，而不是写进文件。弄清它到底改了什么；第 5 步负责所有写入。然后针对起草的编辑检查其他每一个已有产物 —— 任何方向都要查：对较晚产物的编辑可能需要修订较早的产物，而不只是反过来。构建顺序是有用的阅读顺序，而不是哪些产物可以被修订的约束。
   - 记录所有现在变得不一致、缺失或相互矛盾的地方。
   - 只对已经存在的文件（`existingOutputPaths`）提出修订。不要创建尚不存在的产物，也不要在 glob 产物下虚构新文件 —— 记录下来，并引导用户用 `openspec instructions "<artifact-id>" --change "<name>" --json` 了解如何创建它们。
   - 如果该 change 已经是一致的，就说明这一点，并且不提任何修订。

5. **确认并应用，一次一个产物**
   - 这一步执行本工作流中的所有产物写入；前面的步骤都不编辑产物。
   - 展示每一项拟议的修订及其原因 —— 包括第 4 步起草的所请求的编辑。只在用户确认后才写入。
   - 如果用户拒绝了某项修订，就不要写入它 —— 让该产物保持不变。
   - 需要进行大幅重写时，先获取该产物的规则和模板：
     ```bash
     openspec instructions "<artifact-id>" --change "<name>" --json
     ```

6. **指向下一步（仅作指引 —— 绝不据此行动）**
   - 仍有产物缺失 -> 运行 `openspec status --change "<name>" --json` 找出下一个产物，并引导用户用 `openspec instructions "<artifact-id>" --change "<name>" --json` 了解如何创建它。
   - change 已经实现（任务已勾选 / 已 apply）-> 代码可能已不再匹配修订后的计划；建议用 `/opsx:apply` 把 delta 带进代码。
   - 一切都已完成并已实现 -> 建议 `/opsx:archive`。

**Output**

每次调用后，展示：
- 修订了哪些产物（以及哪些拟议的修订被拒绝）
- 因尚不存在而推迟的内容（尚未创建的产物或文件）
- change 当前所处的状态以及推荐的下一步命令

**Guardrails**
- 只涉及规划产物 —— 绝不编辑实现代码。如果修订后的计划意味着要改代码，停下来并指向 `/opsx:apply`。
- 使用 `openspec status` 报告的产物 id 和路径；绝不要基于硬编码的产物名称做分支判断。
- 只编辑 `existingOutputPaths` 中的具体文件；绝不写入 glob 形式的 `resolvedOutputPath`。
- 不要推进构建前沿：不新增产物，不在 glob 产物下新增文件 —— 创建它们是单独的步骤，不在本工作流范围内。
- 每次写入前都要与用户确认每一处编辑。
- 如果请求改变的是该 change 的 *意图* 而不只是打磨它，就要求一个未使用的、不同的 change 名称，并改为推荐 `openspec new change "<new-change-name>"`（即 "Update vs. Start Fresh" 启发式）。

## 附：与 skill 版本的差异

与 `.claude/skills/openspec-update-change/SKILL.md` 比对后，正文（从 "Revise a change's existing planning artifacts..." 开始到文末）逐段一致，没有实质差异。实质差异只在 frontmatter 的 `description`：skill 版本多出一句关于 `openspec update` CLI 命令的说明，原文为：

> If the user means the openspec update CLI command, which refreshes generated files, run that command instead.

译：如果用户指的是 openspec update 这个 CLI 命令（它用于刷新已生成的文件），那就改为运行该命令。

即：skill 版本显式区分了「skill 的 update change 工作流」与「`openspec update` CLI 命令」这两件容易混淆的事，并指向后者；命令版本（`/opsx:update`）没有这句消歧说明。

除此之外还有两处非实质的元信息差异，一并说明：

- frontmatter 字段不同：命令版本用 `name: "OPSX: Update"` + `category` + `tags`；skill 版本用 `name: openspec-update-change`，并额外有 `license: MIT`、`compatibility: Requires openspec CLI.` 和 `metadata`（author/version/generatedBy）。
- `Input` 段落：命令版本写作 "Optionally specify a change name after `/opsx:update` (e.g., `/opsx:update add-auth`)."，skill 版本为 "Optionally specify a change name."，即命令版本多了一个斜杠命令示例，仅是措辞差异。
