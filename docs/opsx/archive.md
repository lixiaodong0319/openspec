> 本文是 `.claude/commands/opsx/archive.md` 的中文翻译，仅供阅读参考。
> 真正生效的是原文件；本文不参与 OpenSpec 工作流执行。

---
name: "OPSX: Archive"
description: "在实验性工作流中归档一个已完成的 change"
allowed-tools: Bash(openspec:*)
category: "Workflow"
tags: ["workflow", "archive", "experimental"]
---

在实验性工作流中归档一个已完成的 change。

**store 选择：** 如果用户指定了一个 store（store 是一台机器上注册的独立 OpenSpec 仓库），或相关工作位于某个 store 中，先运行 `openspec store list --json` 发现已注册的 store id，然后在读写 spec 和 change 的命令上传入 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 视为在工作流剩余部分中持续生效。下文这些命令的每一个未加作用域的例子都是简写：在运行它之前，先补上该标志。例如，应运行 `openspec status --change "<name>" --json --store "<id>"`，而不是下面所示的未加作用域的形式。其他命令不接受该标志。命令打印的提示已经带有该标志；在后续跟进时保持带上它。未指定 store 时，命令作用于最近的本地 `openspec/` 根目录。

**项目检查：** 这些步骤期望项目已经在使用 OpenSpec。在第一个会写入任何内容的步骤之前（`new change`、`archive`、`sync specs`，或编写产物文件），先确认项目有根目录：运行 `openspec list --json`（当已选定 store 时带上 `--store <id>`，因为此时 store 就是根目录）并读取 `root`。root 是一个对象，说明项目已完成设置。`"root": null` 表示未设置——这里没有 `openspec/` 目录，而 `openspec new change` 这类写入会作为副作用创建它。该命令同时也会以非零状态退出，那是这一答案本身，而不是 CLI 坏了，所以要读取 JSON，而不是重试或绕过它。

有一种 `"root": null` 与设置无关：当 `status` 的错误消息以 `Declared in` 或 `Invalid store declaration in` 开头，并指出本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明项目确实是通过它声明的一个 store 在使用 OpenSpec，只是这台机器无法解析该 store（store 未注册，或 `store:` 那一行格式有误）。不要把这种情况当作未初始化而跳过下面的分支：在写入之前停下来，并把该错误的 `message` 和 `fix` 展示给用户。

否则，在没有根目录的情况下，接下来会发生什么取决于这个工作流是如何被触发的：

- **自动选中**：是你自己选择了这个工作流，用户既没有提到 OpenSpec，也没有点名这个 skill，也没有运行它的斜杠命令。停止使用 OpenSpec，按常规方式回答请求，就像没有安装 OpenSpec 一样。不要要求他们做任何设置，也不要提及 OpenSpec 的设置。
- **用户显式请求 OpenSpec**：用户提到了 OpenSpec、点名了这个 skill，或运行了它的斜杠命令。在写入之前停下来，询问如何继续：为这个项目做设置（`openspec init`）、指向他们已有的某个 store（`--store <id>`），或本次请求不使用 OpenSpec 继续。等待他们的答复。

在这两个分支中，都绝不要作为副作用创建根目录：在用户要求之前不要运行 `openspec init`，不要手工创建 `openspec/` 文件，也不要让任何命令创建它。

`<capability-path>` 是相对于 `specs/` 的 spec 目录（例如 `user-auth` 或 `identity/user-auth`）。在解析每个 delta spec 对应的主 spec 时，保留其完整路径。

**输入**：可选地在 `/opsx:archive` 之后指定 change 名称（例如 `/opsx:archive add-auth`）。如果省略，检查是否能从对话上下文中推断出来。如果模糊或有歧义，你必须提示用户从可用的 change 中选择。

**步骤**

1. **选择 change**

   如果提供了名称，就用它。否则：
   - 如果用户提到过某个 change，从对话上下文中推断
   - 如果只有一个活跃的 change，自动选中
   - 如果有歧义，运行 `openspec list --json` 获取可用的 change，并让用户选择一个

   提示时只显示活跃的 change（尚未归档的）。
   如果可用，一并显示每个 change 使用的 schema。

   始终声明："Using change: <name>" 以及如何覆盖（例如 `/opsx:archive <other>`）。

   **在现有的 archive 检查之前，加载当前的 archive 输入：**

   在解析出所选的 change 和规划主目录之后，运行：
   ```bash
   openspec instructions archive --change "<name>" --json
   ```
   在这个命令上保持相同的选定根目录标志。这次查询是建议性的、
   可选的：它只提供额外的提示输入，因此绝不能阻塞归档。
   如果它退出码非零或返回无效 JSON——例如在尚不支持该命令的旧版 CLI 上——
   就在没有 context 也没有 operation guidance 的情况下继续 archive 工作流。不要报告错误，也不要停止。

   成功的响应可能省略这两个可选字段。把 `context` 当作
   必需的提示级输入：阅读并考虑它，并应用相关的项目
   事实、约定和约束。把 `operationGuidance` 当作可选附加建议：
   阅读并考虑每一条，并遵循那些适用且与内置 archive 工作流兼容的条目。

   把这两个字段与内置步骤、用户显式选择、已解析的
   路径、CLI 检查和命令契约区分开来。如果 context 与这些
   约束性输入之一冲突，报告冲突并保留那个约束性取值。如果
   指导不适用或与某个约束性输入冲突，不要遵循它
   并解释原因。不要从这两个字段推断出替换路径、被跳过的提示
   或标志，也不要把它们的文本原样复制进 spec、change 产物
   或 archive 摘要，除非用户另行要求。这些是
   提示级行为契约，不是可强制执行的检查。

2. **检查产物完成状态**

   运行 `openspec status --change "<name>" --json` 检查产物完成情况。

   解析 JSON 以理解：
   - `schemaName`：正在使用的工作流
   - `planningHome`、`changeRoot`、`artifactPaths` 和 `actionContext`：路径与作用域上下文
   - `artifacts`：产物列表及其状态（`done`、`skipped` 或其他）

   **如果任何产物既不是 `done` 也不是 `skipped`**（skipped 的产物满足要求——该 change 声明了 skip_specs）：
   - 显示警告，列出未完成的产物
   - 提示用户确认是否继续
   - 用户确认后继续

3. **检查任务完成状态**

   读取 tasks 文件（通常是 `tasks.md`）以检查未完成的任务。

   当一个 checkbox 的唯一内容是 `x` 或 `X` 时即为完成；方括号
   内部的空格无关紧要，所以 `- [ x]` 也算完成。其他任何
   标记都是未完成——`- [ ]`、空的 `- []`，以及 OpenSpec
   未赋予含义的标记如 `- [~]` 或 `- [-]`。绝不把不熟悉的
   标记读作完成。

   **如果发现未完成的任务：**
   - 显示警告，给出未完成任务的数量
   - 提示用户确认是否继续
   - 用户确认后继续

   **如果不存在 tasks 文件：** 继续，不做任务相关的警告。

4. **评估 delta spec 同步状态**

   把 status JSON 中的 `artifactPaths.specs.existingOutputPaths` 作为唯一
   的 delta spec 来源。如果 `specs` 条目缺失或
   `existingOutputPaths` 为空，则在没有同步提示的情况下继续，且不要从
   其他产物推断 delta spec。

   **如果存在 delta spec：**
   - 把每个 delta spec 与它在 `<planningHome.root>/openspec/specs/<capability-path>/spec.md` 处对应的主 spec 做比较（使用第 2 步中感知 store 的 `planningHome.root`，而不是硬编码的仓库路径）
   - 主 spec 缺失**并不自动**意味着"已同步"。对于一个新能力，主 spec 是同步的*输出*，而不是输入：
     - 如果 delta 含有 MODIFIED 或 RENAMED requirements，报告只有 ADDED requirements 才能创建新的主 spec，并把该能力标记为 sync-blocked。绝不凭空编造一个没有当前版本的 requirement。
     - 否则，如果 delta 只含有 REMOVED requirements，且该 change 的 `.openspec.yaml` 声明了 `retire_capabilities: true`，则该能力已被退役：把它计为已同步，警告没有剩余内容可移除，并且不要重建主 spec。现在以及在验证已完成的同步时都应用这条规则。
     - 否则，如果 delta 没有 ADDED requirements，报告无法同步并把该能力标记为 sync-blocked。对于仅含 REMOVED 的 delta，警告没有可移除来源的主 spec，并保持主 spec 目录树不变。`openspec archive` 会以 `Spec must have at least one requirement` 拒绝未标记的仅含 REMOVED 的情况。
     - 否则，把该能力计为需要同步，并在摘要中指出（`<capability-path>: new main spec will be created`）。如果该 delta 同时还含有 REMOVED requirements，警告它们将被忽略，因为没有可移除来源的主 spec。同步只依据该 delta 的 ADDED requirements 创建主 spec，与 `openspec archive` 的行为完全一致。
   - 确定将会应用哪些变更（新增、修改、移除、重命名）
   - 即使某个能力是 sync-blocked，也继续评估其余能力。在提示之前展示合并后的摘要。

   **提示选项：**
   - 如果任何能力是 sync-blocked：解释原因，并且只提供 "Archive without syncing"、"Cancel"
   - 否则，如果需要变更："Sync now (recommended)"、"Archive without syncing"
   - 否则，如果已同步："Archive now"、"Sync anyway"、"Cancel"

   根据回答进行路由：
   - "Cancel" —— 停止，不归档
   - "Archive without syncing" 或 "Archive now" —— 继续归档
   - "Sync now" 或 "Sync anyway" —— 同步，然后验证（见下）。当某个能力处于 sync-blocked 时，不要启动任何同步；解释阻塞原因并重复可用的选项。
   - 其他任何回答 —— 再次询问，而不是归档

   在选定的同步写入任何主 spec 之前，用相同的
   选定根目录标志运行一次
   `openspec instructions specs --change "<name>" --json`。要求退出状态为零且为有效的
   artifact-instruction JSON。如果查询失败或返回无效 JSON，报告错误并在写入
   任何主 spec 或移动 change 之前停止。响应有效但省略了
   `rules` 即为无规则的情形。只把返回的 `rules` 应用于本次合并产生的
   主 spec 的内容与形式；不要把它们当作 archive 指导、
   改变 CLI 行为，也不要把规则文本复制进任何输出文件。

   然后为 change '<name>' 内联运行 `/opsx:sync` 工作流（由 agent 驱动的智能合并），传入 delta spec 分析和上面获取的 specs 规则快照，并等待其完成。内联同步必须复用那个快照，不再重新获取 `specs` instructions。不要把它委派给后台任务——第 5 步会把 `changeRoot` 从仍在读取它的同步脚下移走，导致 change 已被归档而主 spec 从未更新。如果你的 agent 只能通过委派来运行它，就同步委派并等待结果。

   然后对在 `artifactPaths.specs.existingOutputPaths` 中拥有 delta spec 的每一个能力——不只是同步报告说它触碰过的那些——重新运行本步骤开头的那套比较，包括显式退役、spec 缺失的情形。一次成功的同步不会留下任何待应用的内容，所以每个能力现在都必须读作已同步：
   - ADDED requirements 已存在
   - MODIFIED requirements 带有 delta 中点名的 scenario 和 description 变更，且其余 scenario 完好无损
   - REMOVED requirements 已消失——并且当本次同步退役了某个能力时（移除了它的最后一个 requirement，使 `## Requirements` 为空），它的主 spec 是被删除而不是留空；同步有意保留并报告过的 spec 也算匹配
   - RENAMED requirements 以新名称存在且以旧名称不存在

   如果同步失败，或任何能力不匹配，报告差异并停止——不要归档。没有任何东西被移动，`changeRoot` 完好无损，所以用户可以修复不匹配处或重新运行同步并重新开始归档。

5. **执行归档**

   如果 `planningHome.changesDir` 下不存在 `archive` 目录，则创建它：
   ```bash
   mkdir -p "<planningHome.changesDir>/archive"
   ```

   生成目标名称：当 change 名称已经以 `YYYY-MM-DD-` 前缀开头时，按原样使用；否则以当前日期作为前缀，即 `YYYY-MM-DD-<change-name>`。绝不要叠加第二个日期（与 `openspec archive` 相同的规则）。

   **检查目标是否已存在：**
   - 如果存在：以错误失败，建议重命名现有归档或换一个日期
   - 如果不存在：把 `changeRoot` 移动到 archive 目录

   ```bash
   mv "<changeRoot>" "<planningHome.changesDir>/archive/<target-name>"
   ```

6. **显示摘要**

   展示归档完成摘要，包括：
   - Change 名称
   - 所使用的 schema
   - 归档位置
   - spec 同步状态（synced / sync skipped / no delta specs）
   - 关于任何警告的说明（未完成的产物／任务）

**Output On Success**

```markdown
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/<target-name>/
**Specs:** ✓ Synced to main specs

All artifacts complete. All tasks complete.
```

**Output On Success (No Delta Specs)**

```markdown
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/<target-name>/
**Specs:** No delta specs

All artifacts complete. All tasks complete.
```

**Output On Success With Warnings**

```markdown
## Archive Complete (with warnings)

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/<target-name>/
**Specs:** Sync skipped (user chose to skip)

**Warnings:**
- Archived with 2 incomplete artifacts
- Archived with 3 incomplete tasks
- Delta spec sync was skipped (user chose to skip)

Review the archive if this was not intentional.
```

**Output On Error (Archive Exists)**

```markdown
## Archive Failed

**Change:** <change-name>
**Target:** the archive path derived from `planningHome.changesDir`/<target-name>/

Target archive directory already exists.

**Options:**
1. Rename the existing archive
2. Delete the existing archive if it's a duplicate
3. Wait until a different date to archive
```

**护栏**
- 声明所选 change；当有歧义时提示选择
- 使用产物图（openspec status --json）做完成情况检查
- 不要因警告而阻塞归档——只需告知并确认
- 移动到归档时保留 .openspec.yaml（它随目录一起移动）
- 清晰展示发生了什么
- 如果请求了同步，内联运行 `/opsx:sync` 工作流（由 agent 驱动）
- 当 spec 同步仍在进行中时绝不归档——内联运行同步并在移动 `changeRoot` 之前验证主 spec
- 如果存在 delta spec，始终运行同步评估并在提示之前展示合并后的摘要
- 应用相关的运行时 context 并报告冲突；operation guidance 保持为建议性
- 考虑每一条指导条目，并解释任何不适用或冲突的建议
- 现有的 CLI 检查、已解析路径、提示和命令契约保持不变
- 产物规则只约束正在被写入的 spec，绝不是 operation guidance
- 绝不把运行时 context、operation guidance 或产物规则文本原样复制进输出文件

## 附：与 skill 版本的差异

与 `.claude/skills/openspec-archive-change/SKILL.md` 相比，skill 版本存在以下差异。

### 1. 输出模板被合并

skill 版本删去了 `Output On Success`、`Output On Success (No Delta Specs)`、`Output On Success With Warnings`、`Output On Error (Archive Exists)` 四段独立模板，将其合并为一个条件化模板，摘要措辞也被精简。合并后的模板全文如下：

```markdown
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** the archive path derived from `planningHome.changesDir`/<target-name>/
**Specs:** <"✓ Synced to main specs" only if the step 4 verification passed; otherwise "No delta specs" or "Sync skipped">

<"All artifacts complete. All tasks complete." — or, if archived with warnings, list them instead (e.g. "Archived with 2 incomplete tasks")>
```

对应地，第 6 步摘要项中的 "Spec sync status (synced / sync skipped / no delta specs)" 在 skill 版本中被精简为 "Whether specs were synced (if applicable)"。

### 2. 命令名差异

原文件（`.claude/commands/opsx/archive.md`）在正文和护栏中两处要求内联运行 **`/opsx:sync`** 工作流；skill 版本将这两处都改为 **`openspec-sync-specs`** 工作流。除命令名外，两处句子其余内容一致。

### 3. 其他细微差异

- 输入说明：原文件为 "Optionally specify a change name after `/opsx:archive` (e.g., `/opsx:archive add-auth`)."，skill 版本去掉斜杠命令与示例，简化为 "Optionally specify a change name."。
- 确认措辞：原文件为 "Prompt user for confirmation to continue"，skill 版本为 "Ask the user to confirm they want to proceed"（第 2、3 步均是）。
- frontmatter 不同：skill 版本使用 `name: openspec-archive-change`，并带有 `license`、`compatibility`、`metadata` 字段，description 中也包含了触发条件说明。
