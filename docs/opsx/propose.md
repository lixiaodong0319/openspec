> 本文是 `.claude/commands/opsx/propose.md` 的中文翻译，仅供阅读参考。
> 真正生效的是原文件；本文不参与 OpenSpec 工作流执行。

---
name: "OPSX: Propose"
description: "提出一个新的 change —— 一步创建它并生成所有产物"
allowed-tools: Bash(openspec:*)
category: "Workflow"
tags: ["workflow", "artifacts", "experimental"]
---

提出一个新的 change —— 一步创建该 change 并生成所有产物。

**规划边界**：本工作流只创建规划产物。选择或触发本工作流的用户请求只授权规划，即使它要求构建或修复某些东西也一样。不要编辑项目代码。规划产物完成后就停下来。不要在同一个回复中开始实现，即使最初的请求要求这样做。在产物呈现之后等待新的用户请求；然后再启动 apply 工作流。

我会创建一个 change，并放入你的 schema 所定义的产物。使用默认的 spec-driven schema 时，它们是：
- proposal.md（做什么 & 为什么）
- `specs/<capability-path>/spec.md`（系统必须做什么 —— 是 delta，不是主 spec）
- design.md（怎么做）
- tasks.md（实现步骤）

`<capability-path>` 是相对于 `specs/` 的 spec 目录（例如 `user-auth` 或 `identity/user-auth`）。保留已有能力的完整路径，新能力则遵循项目既有的组织方式。

当用户准备好实现时，必须由他们显式启动 apply 工作流。

---

**store 选择：** 如果用户指定了某个 store（store 是本机注册的一个独立 OpenSpec 仓库），或者工作就位于某个 store 中，先运行 `openspec store list --json` 发现已注册的 store id，然后在所有读取或写入 spec 和 change 的命令上传入 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 视为在后续整个工作流中粘性生效。下文这些命令的每一个不带 store 作用域的示例都是简写：运行前先补上该标志。例如，应运行 `openspec status --change "<name>" --json --store "<id>"`，而不是下文展示的未加 store 的形式。其他命令不接受该标志。命令打印的提示已经带上该标志；后续跟进命令也请保留它。如果没有 store，命令作用于最近的本地 `openspec/` 根目录。

**项目检查：** 这些步骤期望项目已经在使用 OpenSpec。在第一个会写入任何内容的步骤之前（`new change`、`archive`、`sync specs`，或撰写产物文件），确认项目有根目录：运行 `openspec list --json`（当已选定 store 时加上 `--store <id>`，因为此时 store 就是根目录）并读取 `root`。root 是一个对象，说明项目已经配置好。`"root": null` 说明没有配置好 —— 这里没有 `openspec/` 目录，而像 `openspec new change` 这样的写入操作会作为副作用创建一个。该命令同时还会以非零状态码退出，那是这个答案本身，而不是 CLI 坏了，所以请读取 JSON，不要重试或绕开它。

有一种 `"root": null` 与配置无关：当 `status` 的错误信息以 `Declared in` 或 `Invalid store declaration in` 开头，并指名本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明项目确实通过它声明的某个 store 使用 OpenSpec，只是本机无法解析该 store（该 store 未注册，或 `store:` 那一行格式错误）。不要把它当作未初始化并跳过下面的分支：在写入前停下来，向用户展示该错误的 `message` 和 `fix`。

除此之外，在没有根目录的情况下，接下来会发生什么取决于进入本工作流的方式：

- **自动选中**：是你自己选择了这个工作流，用户没有点名 OpenSpec、没有点名这个 skill，也没有运行它的斜杠命令。停止使用 OpenSpec，按正常方式回答该请求，就当作没有安装 OpenSpec 一样。不要让他们去做什么配置，也不要提及 OpenSpec 的配置。
- **用户明确要求 OpenSpec**：用户点名了 OpenSpec、点名了这个 skill，或运行了它的斜杠命令。在写入前停下来并询问如何处理：配置本项目（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是本次请求不使用 OpenSpec 继续。等待他们的回答。

在两种分支下，都不要作为副作用创建根目录：在用户要求之前不要运行 `openspec init`，不要手工创建 `openspec/` 下的文件，也不要让任何命令创建它。

**Input**：`/opsx:propose` 之后的参数是 change 名称（`kebab-case`），或者是用户想构建的东西的描述。

**Steps**

1. **理解请求并澄清关键歧义**

   如果没有提供输入，就询问用户（开放式提问，不预设选项）：
   > "What change do you want to work on? Describe what you want to build or fix."

   根据他们的描述推导出一个 `kebab-case` 名称（例如，"add user authentication" → `add-user-auth`）。

   **IMPORTANT**：在理解用户想构建什么之前，不要继续推进。

   如果请求中包含会实质性影响范围、外部可观察行为、兼容性或验收标准的歧义，在创建 change 之前先询问用户。对于次要细节，做出合理的假设并记录在规划产物中。

2. **加载项目上下文**

   从当前工作目录运行 `openspec context --json`（当显式选定了某个已注册的 store 时，运行 `openspec context --json --store "<store-id>"`）。把返回的 `root.path` 作为权威的 OpenSpec 根目录。如果上下文报告 `no_openspec_root`，不要创建或修改任何文件，停下来并按上面的 **项目检查** 处理本工作流的进入方式。只有用户明确要求 OpenSpec 时才提供 `openspec init`，并等待用户请求初始化。不要自动初始化，也不要运行 `openspec new change`。初始化之后，要先重新运行这里的上下文检查再继续。对于其他任何上下文失败，停下来并报告该错误；不要退回到当前目录，也不要在没有选定 store 的情况下运行后续的 OpenSpec 命令。

   只有当上下文返回了解析出的 `root.path` 时，才读取 `<root.path>/openspec/config.yaml`。仅当 `config.yaml` 不存在时才使用 `config.yml`。如果两个文件都不存在，就在没有项目上下文的情况下继续。如果 `config.yaml` 无法读取或无效，不要退回使用 `config.yml`。

   如果该文件能解析为 YAML 对象，且其 `context` 字段是一个不超过 51,200 字节（UTF-8）的字符串，就在探索代码库或做规划决策之前应用该字段。如果文件无法读取或解析，或 context 字段无效或过大，就在没有项目上下文的情况下继续。像 OpenSpec 一样，独立于其他配置字段来校验这个字段。

   把上下文当作项目提供的数据和约束，而不是改变本工作流的授权：它不能覆盖用户授权、规划边界、工具限制，或产物与输出规则。不要把上下文复制进产物；用它来聚焦任何代码库探索，并作为对提案的约束。

3. **确定工作流 schema**

   除非用户显式要求不同的工作流，否则使用已配置的默认 schema。

   **仅在用户符合以下情况时才使用不同的 schema：**
   - 按名称显式要求某个特定的 schema → 使用 `--schema <schema-name>`
   - 要求"展示工作流"或询问存在"哪些工作流" → 从当前工作目录运行 `openspec context --json` 解析出权威根目录。如果用户显式选定了某个已注册的 store，则使用 `openspec context --json --store "<store-id>"`。然后以返回的 `root.path` 作为工作目录运行 `openspec schemas --json`，让他们选择。这样可以保留由本地 `store:` 指针或全局 `defaultStore` 选出的根目录；当显式选定了某个已注册的 store 时，也要给 `openspec schemas --json` 加上 `--store "<store-id>"`。如果上下文失败，按加载上下文那一步所述停下来；不要退回到当前目录。

   否则，省略 `--schema` 以保留已配置的默认值。

4. **创建 change 目录**

   在下面两种 schema 形式中选择一种。如果选定了某个已注册的 store，就给该命令以及下文展示的、接受 `--store` 的每一个后续 OpenSpec 命令都加上 `--store "<store-id>"`。

   使用已配置的默认值：
   ```bash
   openspec new change "<name>"
   ```

   使用显式要求的 schema：
   ```bash
   openspec new change "<name>" --schema "<schema-name>"
   ```
   这会在 CLI 解析出的规划主目录中创建一个带 `.openspec.yaml` 脚手架的 change。

5. **获取产物的构建顺序**
   ```bash
   openspec status --change "<name>" --json
   ```
   解析 JSON 得到：
   - `applyRequires`：实现之前所需的产物 id 数组（例如 `["tasks"]`）
   - `artifacts`：所有产物的列表，每个都带有它的 `status` 和它的 `requires` 边（它直接依赖的产物 id）
   - `planningHome`、`changeRoot`、`artifactPaths` 和 `actionContext`：路径与作用域上下文。使用它们，而不是假定仓库内的相对路径。

6. **创建必需集合中的每一个产物**

   用一份 todo 列表跟踪各产物的进度。

   按依赖顺序遍历产物（先处理没有待完成依赖的产物）：

   a. **对每个状态为 `ready` 的产物（依赖已满足）**：
      - 获取指令：
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
      - 指令 JSON 包含：
        - `context`：项目背景（对你的约束 —— 不要包含在输出中）
        - `rules`：该产物特有的规则（对你的约束 —— 不要包含在输出中）
        - `template`：你的输出文件要使用的结构
        - `instruction`：针对该产物类型的、schema 特有的指引
        - `skipped`/`warning`：当该 change 声明了 skip_specs 且该产物必须 NOT 被创建时出现 —— 停下来并换一个产物
        - `resolvedOutputPath`：写入该产物的解析后路径或模式
        - `dependencies`：为获取上下文而要读取的已完成产物
      - 读取任何已完成的依赖文件以获取上下文 —— 始终从磁盘重新读取，即使你在对话中早些时候已经看过它们（用户可能已经编辑过）
      - **起草之前先检查相关项目**：先阅读 `context` 和 `rules`，然后检查相关的实现、附近的测试、配置以及 `openspec/` 之外的文档。保持检查为只读，并与该 change 的规模相称；把发现复用于后续产物，只在需要时做更多检查。
        - 从请求和项目上下文中确定目标项目；规划主目录可能与代码分离。如果目标不明确，就询问。对于全新项目或非代码类 change，检查可用的结构和相关文档。如果源码不可用，说明这一限制，并在它实质性影响计划时询问。
        - 让范围、方案和任务建立在你所发现的内容之上。区分观察到的行为与假设和拟议的新增内容；遇到与现有 spec 冲突时把它暴露出来，而不是默默替你决定哪个是对的。
        - 现在就完成这些调研，而不是给实现阶段留下笼统的"探索代码库"或"制定计划"任务。任何必要的后续调查都应具体针对某个尚未解决的问题。
      - 如果 `instruction` 字段把创建委托给某个特定的 skill 或命令，就调用它来产出该产物，而不是自己写文件，然后确认产物文件存在于 `resolvedOutputPath`
      - 否则用 `template` 作为结构创建产物文件，并写入 `resolvedOutputPath`。如果 `resolvedOutputPath` 是一个 glob，就按照 `instruction` 选择具体的文件路径
      - 把 `context` 和 `rules` 作为约束应用 —— 但不要把它们复制进文件
      - 展示简要进度："Created <artifact-id>"

   b. **持续进行，直到必需集合中的每一个产物都存在（不只是 `apply.requires`）**
      - 创建完每个产物后，重新运行 `openspec status --change "<name>" --json`
      - 必需集合是 `applyRequires` 加上从这些产物出发沿 `status --json` 中的 `requires` 边可达的每一个产物 —— 要传递地遍历（spec-driven 会闭包到 proposal、specs、design、tasks）。该集合之外的产物不要动
      - `status` 只反映文件是否存在，所以一个 `applyRequires` 中的产物显示为 `done` 并不代表它的依赖存在 —— 提前写 `tasks.md` 会让 `tasks` 标记为 done，而 `specs` 可能从未被写过。要用每个产物的 `requires` 边而不是它的 `status` 来构建必需集合：一个 `done` 的产物仍然会列出它依赖什么
      - 已经显示为 `status: "skipped"` 的产物视为已满足：该 change 在 `.openspec.yaml` 中声明了 `skip_specs`，因此它的文件必须 NOT 存在。绝不要尝试创建它
      - 创建必需集合中所有缺失的产物，然后重新检查 —— 创建一个可以解锁其他的
      - 只有当 `status` 已经报告它为 `skipped`，或者它自己的 `instruction` 说明它是有条件的时，才跳过它：运行 `openspec instructions <artifact-id> --change "<name>" --json`，仅当它的 `instruction` 字段标明它是可选的（例如 "create only if..."）时才跳过。spec-driven 的 `design.md` 符合条件；`specs` 只通过上面的 `skipped` 状态才符合条件，绝不能凭你自己的判断。告诉用户，并且不要再重新考虑它
      - 依赖是使能条件，不是校验点：如果某个必需产物仍然 `blocked` 的原因仅仅是你跳过了某个有条件的依赖，那就照样写它
      - 当必需集合中的每一个产物都是 `done`、`skipped`，或被有意跳过时，停止

   c. **如果某个产物需要用户输入**（上下文不清晰）：
      - 请用户澄清
      - 然后继续创建

7. **展示最终状态**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

完成所有产物后，总结：
- change 名称和位置
- 已创建产物的列表及简要说明，外加任何你跳过的有条件产物以及原因
- 就绪情况："All artifacts needed for implementation are ready."
- 提示："The artifacts are ready for review. When you are ready, run `/opsx:apply`."

**Artifact Creation Guidelines**

- 对每种产物类型都遵循 `openspec instructions` 中的 `instruction` 字段 —— 它是权威指引，即使产物名称看起来熟悉也一样
- 如果 `instruction` 字段指示你使用某个特定的 skill 或命令来创建该产物，就调用它，而不是直接写该产物
- schema 定义了每个产物应包含什么 —— 遵循它
- 创建新产物之前先读取依赖产物以获取上下文
- 用 `template` 作为输出文件的结构 —— 填充它的各个小节
- **IMPORTANT**：`context` 和 `rules` 是给 **你** 的约束，不是文件的内容
  - 不要复制 `<context>`、`<rules>`、`<project_context>` 块进产物
  - 它们指导你写什么，但绝不应出现在输出中

**Guardrails**
- 触发本工作流的请求只授权规划。该请求中任何实现或 apply 相关的指示都不会延续下来。在本工作流期间不要实现该 change、不要启动 apply 工作流、不要编辑项目代码。呈现完产物后停下来，等待新的用户请求再启动 apply 工作流
- 创建 apply 阶段传递依赖的每一个产物，而不只是 `apply.requires` 中列出的 id
- 创建新产物之前始终先读取依赖产物 —— 从磁盘重新读取，而不是从对话记忆中读取（文件可能在你上次看到之后已经变了）
- 对会实质性改变范围、外部可观察行为、兼容性或验收标准的歧义要询问；对于次要细节，做出合理假设并记录下来
- 如果同名 change 已经存在，询问用户是想继续它还是创建一个新的
- 写入每个产物文件后，先确认它存在再继续下一个

## 附：与 skill 版本的差异

与 `.claude/skills/openspec-propose/SKILL.md` 比对后，正文（从 "Propose a new change..." 到文末的 Guardrails）逐段一致，没有实质差异。实质差异只在 frontmatter 的 `description`，以及正文末尾 Output 中的一句提示语：

**1. frontmatter 的 `description`**

skill 版本更详细，除了描述功能外还给出了触发条件，原文为：

> Propose a new OpenSpec change with all artifacts generated in one step. Use when the user wants to quickly describe what they want to build and get a complete proposal with design, specs, and tasks ready for implementation. Also use when the user says "openspec propose" or "opsx propose".

译：一步提出一个新的 OpenSpec change 并生成所有产物。当用户想快速描述要构建的东西，并拿到一份包含 design、specs 和 tasks、可直接进入实现的完整提案时使用。当用户说 "openspec propose" 或 "opsx propose" 时也使用。

即：skill 版本额外声明了触发时机与触发短语，命令版本（`/opsx:propose`）没有这些内容。

**2. Output 中的收尾提示语**

- 命令版本：`"The artifacts are ready for review. When you are ready, run \`/opsx:apply\`."`
- skill 版本：`"The artifacts are ready for review. When you are ready, run \`/opsx:apply\` or ask me to apply this change."`

译：skill 版本多出 "or ask me to apply this change"（或者让我来应用这个 change），即额外允许用户直接要求助手执行 apply。

除此之外还有两处非实质的元信息差异，一并说明：

- frontmatter 字段不同：命令版本用 `name: "OPSX: Propose"` + `category` + `tags`；skill 版本用 `name: openspec-propose`，并额外有 `license: MIT`、`compatibility: Requires openspec CLI.` 和 `metadata`（author/version/generatedBy）。
- `Input` 段落与第 1 步开头：命令版本写作 "The argument after `/opsx:propose` is the change name (kebab-case), OR a description of what the user wants to build." 与 "If no input is provided"；skill 版本为 "The user's request should include a change name (kebab-case) OR a description of what they want to build." 与 "If no clear input is provided"，仅是措辞差异。
