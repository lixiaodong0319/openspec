---
name: "OPSX: Sync"
description: "将 change 中的 delta spec 同步到 main spec"
allowed-tools: Bash(openspec:*)
category: "Workflow"
tags: ["workflow", "specs", "experimental"]
---

> 本文是 `.claude/commands/opsx/sync.md` 的中文翻译，仅供阅读参考。
> 真正生效的是原文件；本文不参与 OpenSpec 工作流执行。

将 change 中的 delta spec 同步到 main spec。

这是一个**由 agent 驱动**的操作 —— 你将阅读 delta spec，并直接编辑 main spec 来应用这些变更。这样可以实现智能合并（例如，只添加一个 scenario，而不必复制整个 requirement）。

**store 选择：** 如果用户指定了一个 store（store 是注册在本机上、独立的 OpenSpec 仓库），或者工作本身就位于某个 store 中，先运行 `openspec store list --json` 发现已注册的 store id，然后在读写 spec 和 change 的命令上加上 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就在整个工作流余下部分把 `--store <id>` 视为常驻参数。下文这些命令的每个未带作用域的示例都是简写：运行前要先补上该参数。例如，应运行 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未带参数形式。其他命令不接受该参数。命令打印出的提示已经带有该参数；后续命令也要保留它。没有 store 时，命令作用于最近的本地 `openspec/` 根目录。

**项目检查：** 这些步骤要求项目已经在使用 OpenSpec。在第一个会写入任何内容的步骤之前（`new change`、`archive`、`sync specs`，或编写产物文件），先确认项目已有根目录：运行 `openspec list --json`（当已选定 store 时带上 `--store <id>`，因为此时 store 就是根目录）并读取 `root`。返回一个 root 对象说明项目已就绪。`"root": null` 说明尚未就绪 —— 这里没有 `openspec/` 目录，而像 `openspec new change` 这样的写入操作会顺带创建一个。该命令也会以非零状态退出，那是上述答案本身而不是 CLI 损坏，所以要读取 JSON，而不是重试或绕开它。

有一种 `"root": null` 与项目初始化无关：当 `status` 的错误信息以 `Declared in` 或 `Invalid store declaration in` 开头，并指出本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明该项目确实通过它声明的一个 store 在使用 OpenSpec，只是本机无法解析该 store（store 未注册，或 `store:` 行格式有误）。不要把它当成未初始化而跳过下面的分支：在写入前停下，向用户展示该错误的 `message` 和 `fix`。

否则，在没有根目录时，接下来怎么做取决于这个工作流是如何被触发的：

- **自动选择**：是你自己选择了这个工作流，用户没有点名 OpenSpec、没有点名这个 skill，也没有运行它的 slash command。停止使用 OpenSpec，按平常方式回答该请求，就像没有安装 OpenSpec 一样。不要让他们去做什么设置，也不要提及 OpenSpec 的设置。
- **用户明确要求 OpenSpec**：用户点名了 OpenSpec、点名了这个 skill，或运行了它的 slash command。在写入前停下并询问如何处理：为这个项目做设置（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是本次请求不用 OpenSpec 继续。等待他们的回答。

在两种分支下，都绝不要顺带创建根目录：在用户要求之前不要运行 `openspec init`，不要手工创建 `openspec/` 下的文件，也不要让某条命令把它创建出来。

`<capability-path>` 是相对于 `specs/` 的 spec 目录（例如 `user-auth` 或 `identity/user-auth`）。在解析每个 delta spec 对应的 main spec 时，要保留它的完整路径。

**输入**：可选地在 `/opsx:sync` 之后指定 change 名称（例如 `/opsx:sync add-auth`）。如果省略，检查能否从对话上下文中推断出来。如果含糊或歧义，你 MUST 提示可选的 change。

**步骤**

1. **选择 change**

   如果提供了名称，就用它。否则：
   - 如果用户在对话中提到过某个 change，就从对话上下文中推断
   - 如果只有一个活跃 change，就自动选择
   - 如果有歧义，运行 `openspec list --json` 获取可选的 change，并请用户选择其中一个

   提示时，展示带有 delta spec 的 change（位于 `specs/` 目录下）。

   始终宣告："Using change: <name>"，以及如何覆盖（例如 `/opsx:sync <other>`）。

2. **解析 change 上下文**

   运行：
   ```bash
   openspec status --change "<name>" --json
   ```

   JSON 中包含 `planningHome.root`。Main spec 位于 `<planningHome.root>/openspec/specs/` 下 —— 下文每个 main spec 路径都要用这个（感知 store 的）根目录，而不是硬编码的仓库路径。当选定了 store 时，它指向该 store，而不是当前仓库。

3. **查找 delta spec**

   只把 status JSON 中的 `artifactPaths.specs.existingOutputPaths` 作为 delta spec
   路径的唯一来源。如果 `specs` 条目缺失，或 `existingOutputPaths` 为空，就报告
   没有可同步的 delta spec，不要从其他产物推断它们，并停止 —— 既不请求产物
   指令，也不写 main spec。

   同步 `existingOutputPaths` 中的每个路径，除非调用方缩小了范围。
   调用方缩小的方式是：显式列出来自 `existingOutputPaths` 的一组完整条目 ——
   逐字复制那些绝对路径值。Archive 会内联这样做，用户也可以
   （例如，选中以 `/specs/billing/invoices/spec.md` 结尾的那个条目）。
   之后就只同步被点名的路径，其余 delta spec 保持原样：
   批量 archive 会排除它找不到实现的 delta，而照样同步它
   就会写出调用方有意扣下的 main spec。
   把缩小后的这个选择集贯穿到步骤 4；绝不要把它重新放宽回完整
   列表。如果被点名的路径不在 `existingOutputPaths` 中，就不要同步它 ——
   报告并停止，而不是悄悄丢弃。如果被点名的列表为
   空，就报告没有可同步的内容，并停止，不写 main spec。

   每个 delta spec 文件包含类似这样的小节：
   - `## ADDED Requirements` - 要新增的 requirement
   - `## MODIFIED Requirements` - 对现有 requirement 的改动
   - `## REMOVED Requirements` - 要删除的 requirement
   - `## RENAMED Requirements` - 要重命名的 requirement（FROM:/TO: 格式）

   如果没有找到 delta spec，告知用户并停止。

4. **对每个 delta spec，把改动应用到 main spec**

   在第一次写 main spec 之前，获取一份当前的 specs 规则快照：
   - 如果 archive 内联触发了本工作流，并且提供了来自
     `openspec instructions specs --change "<name>" --json` 的有效快照，就复用它，不要
     再次获取同一份指令。
   - 否则现在就用相同的已选根目录参数运行该命令一次。
   - 如果直接查询以非零状态退出，或返回无效的产物指令
     JSON，就报告错误并在写入任何 main spec 之前停止。不要把
     这种失败当作不存在规则集。
   - 有效响应中省略了 `rules`，意味着未配置产物规则，
     继续按现有的语义化合并处理。

   只把返回的 `rules` 应用于本次合并产出的 main spec 的内容和形式。
   产物规则不是操作指导，不能改变所选根目录、delta 路径、CLI 检查或
   工作流步骤。把它们作为约束使用，但不要逐字复制到 main spec 或摘要中。

   对步骤 3 中选出的每个 capability delta spec 路径 —— 完整的 `existingOutputPaths` 列表，或在调用方提供时缩小后的子集（它们可能属于某个已选 store，而不是本仓库）：

   a. **阅读 delta spec**，理解其意图的改动

   b. **阅读 main spec**，位于 `<planningHome.root>/openspec/specs/<capability-path>/spec.md`（可能尚不存在）

      **如果它尚不存在**（一个新的 capability），要与 `openspec archive` 的行为一致：
      只能应用 ADDED requirement —— 步骤 d 会用它们创建该 spec。
      MODIFIED 和 RENAMED 没有可作用的 requirement，所以对该
      capability 停止同步，并报告其 main spec 不存在、对于新的 spec 只允许
      ADDED；绝不要臆造缺失的 requirement。REMOVED 没有可
      删除的内容 —— 跳过并警告。

   c. **智能地应用改动**：

      **ADDED Requirements：**
      - 如果 requirement 在 main spec 中不存在 → 添加它
      - 如果 requirement 已存在 → 更新它以匹配（视为隐式 MODIFIED）

      **MODIFIED Requirements：**
      - 在 main spec 中找到该 requirement
      - 应用改动 —— 这可能是：
        - 添加 main spec 还没有的新 scenario
        - 修改现有 scenario
        - 修改 requirement 描述
      - 保留 delta 中未提及的 scenario/内容

      **REMOVED Requirements：**
      - 从 main spec 中删除整个 requirement 块
      - 退役该 capability。只有当以下条件**全部**成立时，才删除整个
        `spec.md` —— 以及其中再无其他内容后的目录：
        1. *本次运行*删除 requirement 后没有留下任何 requirement 块；
        2. spec 的其余部分格式良好（仍然有 `## Purpose`）；
        3. main spec 在本次同步之前并非已经是空的 —— 如果你什么
           都没删，就什么也不要改；
        4. 整个文件中所有其他非空行都能被解释为
           标题、Purpose、Requirements 标题，或某个规范 requirement 的
           陈述、scenario 或围栏示例；
        5. 该 change 的 `.openspec.yaml` 声明了 `retire_capabilities: true`；
        6. `spec.md` 解析于真实的 specs 根目录之内（不要顺着
           capability 目录的符号链接去删除外部文件）。
        如果删除所选的 requirement 后不会留下任何 requirement 块，
        而任一退役条件又未满足，就不要修改 main spec。对该 capability
        停止同步，报告阻塞条件，并告诉用户
        如何解决。绝不要写出或留下空的 `## Requirements` 小节。
        当只是缺少那个标记时，也要说明这一点 —— 那是用户
        为让退役得以通过唯一能补上的东西。
      - 删除文件也会删除它的 `## Purpose`；任何其他小节都会阻塞
        退役。报告退役时要指明 Purpose。只有当该 spec 位于
        调用方的 checkout 中时，才给出一条可直接粘贴的 `git checkout`；
        否则给出限定在 checkout 范围内的恢复指引。

      **RENAMED Requirements：**
      - 找到 FROM 对应的 requirement，重命名为 TO

      **delta 中的 `## Purpose`：**
      - main spec 已经有一个，且它是权威的 —— 不要动它
        （这就是 `openspec archive` 的行为；它会警告后继续）

   d. **创建新的 main spec**，如果该 capability 尚不存在：
      - 仅当 delta 中有 ADDED requirement 可放入，且在步骤 b 中没有 MODIFIED 或
        RENAMED requirement 阻塞该 capability 时才这样做。否则什么也不创建，
        并保持 specs 目录不变。对于只有 REMOVED 的 delta，如果该 change 的
        `.openspec.yaml` 声明了 `retire_capabilities: true`，就报告它已退役，
        并继续而不重建该 spec。没有该标记时，报告同步被阻塞：
        `openspec archive` 会以 `Spec must have at least one requirement` 拒绝它。
        空 delta 没有可同步的操作；同样报告为被阻塞。
        绝不要写出空的 `## Requirements` 小节。
      - 创建 `<planningHome.root>/openspec/specs/<capability-path>/spec.md`
      - 添加 Purpose 小节：当 delta 有 `## Purpose` 时逐字复制其正文
        （这就是 `openspec archive` 的行为）；只有当它没有时才写一个简短的 TBD 占位符
      - 添加 Requirements 小节，放入 ADDED requirement
      - 遵循下面的 **Main Spec Format Reference**

5. **校验更新后的 main spec**

   用之前相同的已选根目录参数运行 `openspec validate --specs`。
   如果校验失败，报告问题，不要声称同步成功。

6. **展示摘要**

   应用所有改动后，总结：
   - 哪些 capability 被更新
   - 做了哪些改动（requirement 新增/修改/删除/重命名）
   - 任何留下 TBD Purpose 占位符的新 main spec，以便现在就把它写出来
     而不是拖着
   - 任何被退役的 capability，指明被删除的 `spec.md`、它的 Purpose，以及
     一条可直接粘贴的 `git checkout` 或限定在 checkout 范围内的恢复指引

**Delta Spec Format Reference**

> 以下为格式示例，示例中的所有英文内容（包括小节标题、requirement 文本、scenario 文本）都属于格式本身，逐字保留英文，不作翻译。

```markdown
# Spec Delta

## Purpose

Only on a delta that introduces a brand-new capability. Seeds the new main spec.

## ADDED Requirements

### Requirement: New Feature
The system SHALL do something new.

#### Scenario: Basic case
- **WHEN** user does X
- **THEN** system does Y

## MODIFIED Requirements

### Requirement: Existing Feature
The system SHALL keep doing the existing thing, now also handling A.

#### Scenario: Scenario the main spec already has
- **WHEN** user does X
- **THEN** system does Y

#### Scenario: New scenario to add
- **WHEN** user does A
- **THEN** system does B

## REMOVED Requirements

### Requirement: Deprecated Feature

## RENAMED Requirements

- FROM: `### Requirement: Old Name`
- TO: `### Requirement: New Name`
```

**Main Spec Format Reference**

> 以下同样为格式示例，示例中的英文内容属于格式本身，逐字保留英文，不作翻译。

Main spec 是 delta 合并**进入**的目标。它们绝不能包含 delta 操作标题（`## ADDED/MODIFIED/REMOVED/RENAMED Requirements`）—— 同步之后，每个 requirement 都位于单一的 `## Requirements` 小节之下：

```markdown
# <capability> Specification

## Purpose
Short description of what this capability does and why it exists.

## Requirements

### Requirement: New Feature
The system SHALL do something new.

#### Scenario: Basic case
- **WHEN** user does X
- **THEN** system does Y
```

**关键原则：智能合并**

与程序化合并不同，你是合并而不是覆盖：
- 一个 MODIFIED 块带有完整的 requirement —— 正文加上在本次 change 中存活的每个 scenario。`openspec validate` 和 `openspec archive` 都会拒绝丢掉 main spec 仍有的 scenario 的写法。
- 保留 delta 未提及的任何内容，维持 main spec 原有的顺序
- 运用你的判断，合理地合并改动

**成功时的输出**

> 以下为输出格式示例，逐字保留英文。

```markdown
## Specs Synced: <change-name>

Updated main specs:

**<capability-1>**:
- Added requirement: "New Feature"
- Modified requirement: "Existing Feature" (added 1 scenario)

**<capability-2>**:
- Created new spec file
- Added requirement: "Another Feature"

Main specs are now updated. The change remains active - archive when implementation is complete.
```

**护栏**
- 在做出改动之前，先阅读 delta spec 和 main spec 两者
- 保留 delta 中未提及的现有内容
- 绝不要把 delta 文件原样复制进 main spec —— 要合并其内容，使 main spec 保持 Main Spec Format Reference 的结构，不带任何 delta 操作标题
- 如果有不清楚的地方，请求澄清
- 边做边展示你正在改动什么
- 该操作应当幂等 —— 运行两次应得到相同结果
- 只使用 `artifactPaths.specs.existingOutputPaths`；绝不从无关产物推断 delta spec
- 遵从调用方提供的 `existingOutputPaths` 子集；绝不把它重新放宽回完整列表
- 直接同步时只获取一次 specs 指令，或内联复用 archive 提供的快照
- 在 specs 指令响应为非零或 JSON 无效时，于每次写 main spec 之前停下
- 产物规则只约束正在写入的 spec，绝不复制进输出文件

## 附：与 skill 版本的差异

无实质差异（仅 frontmatter 不同）。

具体而言：两者的正文内容完全一致，唯一差别是 —— 命令版本 frontmatter 使用 `category`、`tags`，缺少 `license`、`compatibility`、`metadata`；skill 版本 frontmatter 使用 `name: openspec-sync-specs`、`license: MIT`、`compatibility: Requires openspec CLI.` 以及 `metadata`（author/version/generatedBy），且没有 `category`、`tags`。此外，命令版本的 **Input** 一行写的是"可选地在 `/opsx:sync` 之后指定 change 名称（例如 `/opsx:sync add-auth`）"，skill 版本只说"可选地指定 change 名称"，未给出 slash command 示例。除此之外无任何实质性内容差异。
