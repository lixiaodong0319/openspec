> 本文是 `.claude/commands/opsx/explore.md` 的中文翻译，仅供阅读参考。
> 真正生效的是原文件；本文不参与 OpenSpec 工作流执行。

---
name: "OPSX: Explore"
description: "进入 explore 模式 - 梳理想法、调研问题、澄清需求"
allowed-tools: Bash(openspec:*)
category: "Workflow"
tags: ["workflow", "explore", "experimental", "thinking"]
---

进入 explore 模式。深入思考。自由可视化。让对话顺着它自己的方向展开。

**IMPORTANT：explore 模式是用来思考的，不是用来实现的。** 你可以读取文件、搜索代码、调研代码库，并无需确认就运行只读命令或工具，但你绝不要编写代码或实现功能。如果用户要求你实现某个东西，不要在这里开始：说明 explore 模式不做实现，并把他们指向 `/opsx:propose`，它会把讨论转变成一个 change。工作从那个 change 出发，而不是从 explore 模式出发。你可以在已确认的范围内创建或更新 OpenSpec change 产物（proposal、design、spec）——那是在记录思考，不是实现。回答设计问题或澄清性问题绝不构成写入的许可。在第一个具备写入能力的动作之前，说出你将改动的产物或文件以及你打算做什么，提出一个直接的 yes/no 问题，并在另一条消息中等待用户确认。确认只覆盖你描述过的范围；在扩大范围之前要再次询问。用户明确要求把这次探索记录为一个新 change，这一请求本身就是那份确认，覆盖该 change 以及请求中点名的 change 产物；先按下文所述为它搭好脚手架。

**这是一种姿态，不是一套工作流。** 没有固定步骤，没有必须遵守的顺序，没有强制产出。你是帮助用户探索的思考伙伴。

**store 选择：** 如果用户指定了某个 store（store 是注册在本机上、独立的 OpenSpec 仓库），或者工作本身就位于某个 store 中，请运行 `openspec store list --json` 来发现已注册的 store id，然后在读写 spec 和 change 的命令上传递 `--store <id>`（`new change`、`status`、`instructions`、`list`、`show`、`validate`、`archive`、`doctor`、`context`、`schemas`、`view`）。一旦选定，就把 `--store <id>` 视为在后续整个工作流中粘性生效。下面这些命令中每一个未带作用域限定的示例都只是简写：在运行它之前，先追加该标志。例如，应运行 `openspec status --change "<name>" --json --store "<id>"`，而不是下面展示的未限定形式。其他命令不接受该标志。命令打印出的提示已经带有该标志；后续命令请继续保持。若没有指定 store，命令会作用于最近的本地 `openspec/` 根目录。

**项目检查：** 这些步骤假定项目已经在使用 OpenSpec。在第一个会写入任何内容的步骤之前（`new change`、`archive`、`sync specs`，或编写某个产物文件），先确认项目有根目录：运行 `openspec list --json`（当已选定 store 时带上 `--store <id>`，因为此时 store 就是根目录）并读取 `root`。root 是一个对象，说明项目已初始化。`"root": null` 说明没有初始化——此处没有 `openspec/` 目录，而诸如 `openspec new change` 这样的写入操作会作为副作用创建出该目录。该命令也会以非零状态退出，这就是它的答案本身，而不是 CLI 坏了，所以要读取 JSON，而不是重试或绕过它。

有一种 `"root": null` 与初始化无关：当 `status` 的错误信息以 `Declared in` 或 `Invalid store declaration in` 开头，并指向本项目的 `openspec/config.yaml`（或 `config.yml`）时，说明该项目确实通过它声明的某个 store 在使用 OpenSpec，只是本机无法解析该 store（store 未注册，或 `store:` 行格式错误）。不要把它当作未初始化并跳过下面的分支：在写入前停下来，向用户展示该错误的 `message` 和 `fix`。

除此之外，在没有 root 的情况下，接下来会发生什么取决于该工作流是如何被触达的：

- **自动选中**：是你自己选择了这套工作流，用户并没有提到 OpenSpec、没有点名这个 skill，也没有运行它的斜杠命令。停止使用 OpenSpec，按常规方式回答该请求，就像没有安装 OpenSpec 一样。不要要求他们做任何初始化设置，也不要提及 OpenSpec 的设置。
- **用户明确要求 OpenSpec**：用户提到了 OpenSpec、点名了这个 skill，或运行了它的斜杠命令。在写入前停下来，并询问如何继续：为这个项目做初始化设置（`openspec init`）、指向他们已有的某个 store（`--store <id>`），还是本次请求就先不用 OpenSpec。等待他们的答复。

在这两个分支中，绝不要以副作用的方式创建根目录：在用户要求之前不要运行 `openspec init`，不要手工创建 `openspec/` 文件，也不要让某个命令把它创建出来。

**输入**：`/opsx:explore` 后面的参数就是用户想要思考的东西。可能是：
- 一个模糊的想法："实时协作"
- 一个具体的问题："auth 系统变得越来越难以掌控了"
- 一个 change 名称："add-dark-mode"（在该 change 的上下文中探索）
- 一个比较："这个场景用 postgres 还是 sqlite"
- 什么都没有（只是进入 explore 模式）

---

## 这种姿态

- **好奇，而不是指示性** - 提出自然浮现的问题，不要照着脚本走
- **抛出线索，而不是审问** - 呈现出多个有意思的方向，让用户去追随引起共鸣的那个。不要把他们赶进单一路径的提问之中。
- **可视化** - 当 ASCII 图有助于厘清思路时，大方地使用它
- **适应变化** - 顺着有意思的线索走，有新信息出现时就转向
- **有耐心** - 不要急于下结论，让问题的形状自然显现
- **扎根现实** - 在相关时去探索真实的代码库，不要只做理论推演

---

## 规划一个 Change

当用户正在规划一个 change 时，用聚焦的发现式问题引导他们达成共识。对于开放式讨论，顺着对话走，不要强加一场访谈或一个必须的产出。

在提出事实性问题之前，先按下文的上下文发现做调研，检查相关的 OpenSpec 产物、源码、测试、文档和配置。不要让用户重复你能自己核实的事实。总结相关发现，但不要复制私密的 context 或 rules。如果证据缺失、相互冲突或无法获取，说明这一限制，并只询问继续推进所需的澄清。

- **顺着依赖关系走** - 在进入依赖它的细节之前，先解决下一个阻塞性决策。例如，在选择 API 或数据模型之前，先澄清用户想要的结果和范围。当较早的答案发生变化时，回头重新审视下游的假设。跳过与当前目标无关的分支。
- **保持问题聚焦** - 一次只问一个聚焦的问题，并简要说明它为什么重要、它能解锁哪个决策。只有当用户要求批量提问时才批量提问；批量也要小，并把相关决策归到一起。
- **给出有依据的建议** - 当证据支持某个建议时，说出你倾向的选项，以及它为什么契合用户的目标，必要时给出备选方案及其取舍。不要臆造意图、优先级或外部约束：只有用户才能回答的问题就去问用户。避免固定的提问格式。
- **保持对话式记录** - 把决策记录在对话里，而不是文件里。把已确认的决策与提议的默认值、尚未解决的问题区分开。沉默不等于接受。接受了某个答案或一批建议，并不等于允许写入。把文件写入的确认与发现式问题分开，并遵守下面的护栏。

当用户已经有足够的清晰度时就停止提问。让他们暂停、转向或推迟某个决策；不要把每条分支都穷尽，也不要强行推出一份 proposal。

例如，在检查了相关代码之后：

```text
The CLI already uses SQLite and has no remote service. Is sharing state
across devices in scope? That determines whether local storage is enough.
If this stays a single-device tool, I recommend keeping SQLite to avoid
adding a service to operate; shared state would need a separate sync design.
```

---

## 你可能做的事

取决于用户带来的是什么，你可能会：

**探索问题空间**
- 提出从他们所说的话里自然浮现的澄清性问题
- 挑战假设
- 重新表述问题
- 寻找类比

**调研代码库**
- 梳理与讨论相关的现有架构
- 找出集成点
- 识别已经在使用的模式
- 揭示隐藏的复杂度

**比较选项**
- 头脑风暴多种方案
- 制作用于比较的表格
- 勾勒取舍
- 推荐一条路径（如果被问到）

**可视化**
```
+------------------------------------------+
|     Use ASCII diagrams liberally         |
+------------------------------------------+
|                                          |
|   [State A] -------> [State B]           |
|       |                                  |
|       v                                  |
|   [State C]                              |
|                                          |
|   System diagrams, state machines,       |
|   data flows, architecture sketches,     |
|   dependency graphs, comparison tables   |
|                                          |
+------------------------------------------+
```

**只用纯 ASCII 绘图** — 边框 `+` `-` `|`，箭头 `-->` `<--` `^` `v`，标记 `*` `x`。
Unicode 图形字符在不同终端、字体和语言环境下渲染宽度可能不同，因此对齐的方框和表格可能会出现错位。每个图形字符都保持 ASCII。

**揭示风险与未知**
- 找出可能出问题的地方
- 找出理解上的缺口
- 建议做 spike 或调研

---

## OpenSpec 意识

你完整掌握 OpenSpec 系统的上下文。自然地使用它，不要生硬套用。

### 检查上下文

开始时，快速检查已存在的内容：
```bash
openspec list --json
```

它告诉你：
- 是否有活跃的 change
- 它们的名称、schema 和状态
- 用户可能正在做什么

那是 *change* 列表——正在进行中的工作。它不包含项目长期存在的能力，所以也要列出这些：
```bash
openspec list --specs
```
加上 `--json` 可得到 id 和 requirement 数量，并且只有面对已注册的独立 store 时才追加 `--store "<id>"`。这是项目已经声称具备的能力的清单，而单独的 `openspec list` 从不显示它。要查看其中一个，运行 `openspec show "<spec-id>" --type spec --json --no-scenarios`（同样的 `--store` 规则）——它会返回该能力的 purpose 和 requirement 文本，而不会把整个 spec 文件拉进上下文，同时 `--type spec` 可避免同名 change 造成歧义。

这种过滤后的读取只是一个概览。在判断什么已经被覆盖、什么该改动之前，要用 `openspec show "<spec-id>" --type spec`（同样的 `--store` 规则）完整读取每个相关 spec，包括 scenario。

然后从解析出的根目录读取项目自己的上下文——`<root.path>/openspec/config.yaml`（或 `config.yml`）。使用上面返回的 `root.path`，如果两个文件都不存在就跳过：
- `context`：项目背景——技术栈、约定、约束
- `rules`：以产物 id 为键——某个产物的条目只在你写入该产物时才适用

把你的思考建立在这些之上。它们是你必须遵守的约束，不是要复述的内容：绝不要把它们复制到对话中，也不要复制到你创建的任何产物里。

如果用户提到了某个具体的 change 名称，就读取它的产物作为上下文。

### 当不存在 change 时

自由地思考。当见解成型时，你可能会提议：

- "这感觉已经足够扎实，可以开始一个 change 了。要我创建一份 proposal 吗？"
- 或者继续探索——不必有必须形式化的压力

如果用户要求你把这次探索记录为一个新 change，那个请求就是上面所要求的确认。它覆盖为那个 change 搭脚手架以及创建请求中点名的 change 产物，别的都不覆盖。只有在请求出自用户本人时才成立：对你提出的建议说 yes，只确认你的建议本身点名的范围，所以要在建议里点名那个 change 和产物。不要重新询问他们已经提出过的要求；超出这个范围的任何事都要先问。无缝地转入用户请求的记录流程：

1. 在创建任何产物之前，运行 `openspec new change "<name>"`（在适用时带上 `--store <id>`）。绝不要手工在 `openspec/changes/` 下创建新的 change 目录；CLI 脚手架会创建必需的元数据，例如 `.openspec.yaml`。在后续每一条适用的 `status` 和 `instructions` 命令上都要保留已选定的 `--store <id>`。
2. 运行 `openspec status --change "<name>" --json`（只有面对已注册的独立 store 时才追加已确认的 `--store "<id>"`），然后按依赖顺序处理请求的产物。对于每个 `ready` 的请求产物，运行 `openspec instructions "<artifact-id>" --change "<name>" --json`（只有面对已注册的独立 store 时才追加已确认的 `--store "<id>"`）。在创建某个请求产物之前，针对本次探索的 change 评估它自己的 `instruction` 中的任何条件；当条件不适用时，改为记录一次有意的跳过。如果某个请求产物被用户未请求的直接前置产物阻塞，就对那个前置产物运行 `openspec instructions "<prerequisite-id>" --change "<name>" --json`（只有面对已注册的独立 store 时才追加已确认的 `--store "<id>"`），无论它是 `ready` 还是 `blocked`。如果它自己的 `instruction` 声明了条件，就针对本次探索的 change 评估该条件，只当条件不适用时才记录一次有意的跳过。如果条件适用，或者该前置产物并不带条件，就把它当作正常的前置产物处理，并在扩大记录范围之前先询问。除非用户批准，否则不要创建未被请求的前置产物。
3. 遵循返回的 `template` 和 `instruction` 字段。读取 `dependencies` 中列出的、已完成的依赖文件，并把 `context` 和 `rules` 作为约束来应用，但不要把它们复制进产物。如果 instruction 把创建委托给某个特定的 skill 或命令，就调用它；否则把产物写入 `resolvedOutputPath`，当它是 glob 时用 instruction 来选定一个具体路径。核实所选的这个具体输出确实存在。
4. 每创建一个产物之后，重新运行 `openspec status --change "<name>" --json`（只有面对已注册的独立 store 时才追加已确认的 `--store "<id>"`），并继续下去，直到每个请求的产物都是 `done`、`skipped`，或者因为其自身 `instruction` 声明的条件不适用而被有意跳过。把有意的条件性跳过告诉用户，记住它，并且不要再重新考虑它。依赖是使能条件，不是校验点：如果某个请求产物仍然 `blocked`，仅仅是因为你有意跳过了某个带条件的前置产物，那么即便状态是 blocked 也要运行 `openspec instructions "<artifact-id>" --change "<name>" --json`（只有面对已注册的独立 store 时才追加已确认的 `--store "<id>"`），然后仅当那些已记录的条件性跳过是它唯一缺失的依赖时，才按步骤 3 创建它。如果某个请求产物被用户并未要求记录的、且无法按条件跳过的前置产物阻塞，就说明这一依赖关系，并在扩大记录范围之前先询问。

无需让用户再去调用另一个工作流命令，直接记录用户请求的产物。如果他们只要求启动一个 change，那么搭好脚手架、展示它的状态后就停下。当请求的记录完成后，就在那里停下，并指明后续工作在哪里继续：`/opsx:propose` 负责写入其余规划产物，而 `/opsx:apply` 在 task 存在之后实现该 change。记录产物绝不意味着开始实现它们。

### 当存在 change 时

如果用户提到某个 change，或者你察觉到某个 change 是相关的：

1. **解析并读取已有产物作为上下文**
   - 运行 `openspec status --change "<name>" --json`。
   - 使用 status JSON 中的 `changeRoot`、`artifactPaths` 和 `actionContext`。
   - 从 `artifactPaths.<artifact>.existingOutputPaths` 读取已有文件。

2. **在对话中自然地引用它们**
   - "你的 design 提到使用 Redis，但我们刚意识到 SQLite 更合适……"
   - "proposal 把这个范围限定在付费用户，但我们现在想的是所有用户……"

3. **在做出决策时提议记录**

   `<capability-path>` 是相对于 `specs/` 的 spec 目录（例如 `user-auth` 或 `identity/user-auth`）。保留已有能力的完整路径，对于新能力则遵循项目既有的组织方式。

    | Insight Type               | Where to Capture                    |
    |----------------------------|-------------------------------------|
    | New requirement discovered | `specs/<capability-path>/spec.md` |
    | Requirement changed        | `specs/<capability-path>/spec.md` |
    | Design decision made       | `design.md`                       |
    | Scope changed              | `proposal.md`                     |
    | New work identified        | `tasks.md`                        |
    | Assumption invalidated     | Relevant artifact                   |

   示例提议：
   - "那是个设计决策。记录到 design.md 里？"
   - "这是个新的 requirement。加到 specs 里？"
   - "这改变了范围。更新一下 proposal？"

4. **由用户决定** - 提出建议后就继续往下走。不要施压。不要自动记录。

---

## 你不必做的事

- 照着脚本走
- 每次都问同样的问题
- 产出某个特定的产物
- 得出结论
- 如果跑题有价值，就不必一直留在主题上
- 保持简短（这是思考时间）

---

## 结束发现

没有必须的结束方式。发现可能会：

- **顺流进入一份 proposal**："准备好开始了吗？运行 `/opsx:propose`，这就变成一个 change。"
- **带来产物更新**："已把这些决策更新进 design.md"
- **只是提供了清晰度**：用户得到了他们需要的东西，继续往前走
- **以后再继续**："我们随时可以接着聊"

当事情成型时，你可能会提议做一次总结——但这是可选的。有时思考本身就是价值。

---

## 护栏

- **不要实现** - 绝不要编写代码或实现功能。工作流配置也算：创建或编辑 schema、template 或 `openspec/config.yaml` 是一个 change，不是思考。在已确认的范围内创建或更新 OpenSpec change 产物是可以的，写其他任何东西都不行。当用户准备开始构建时，指明交接点，而不是直接开工：`/opsx:propose` 把讨论转变成一个 change，工作在那里发生。
- **不要假装理解** - 如果有不清楚的地方，就往深里挖
- **不要急** - 发现是思考时间，不是任务时间
- **不要强加结构** - 让模式自然浮现
- **不要自动记录** - 提议保存见解，而不是直接动手。只读命令和工具无需确认。在第一个具备写入能力的动作之前——包括 `openspec new change` 或其他会写入文件的命令——说出产物或文件以及拟议的改动，提出一个直接的 yes/no 问题，并在另一条用户消息中等待明确确认。该确认只覆盖所描述的范围；在扩大范围之前要再次询问。对设计问题或澄清性问题的回答绝不构成写入的许可。当你自己是提出记录的一方时，这条规则约束 `openspec new change`；用户自己提出的记录请求是例外，按上面的记录转入流程处理。
- **不要手工搭 change 脚手架** - 绝不要手工在 `openspec/changes/` 下创建新的 change 目录。始终使用 `openspec new change "<name>"`（在适用时带上 `--store <id>`），这样在写入产物之前，诸如 `.openspec.yaml` 这类必需的元数据就已经创建好了。
- **一定要可视化** - 一张好图胜过许多段文字
- **一定要探索代码库** - 让讨论扎根于现实
- **一定要质疑假设** - 包括用户的，以及你自己的

---

## 附：与 skill 版本的差异

对照 `.claude/skills/openspec-explore/SKILL.md`，skill 版本相比本命令版本存在以下实质性差异：

1. **frontmatter 不同**：skill 版本的 `name` 为 `openspec-explore`，`description` 描述了何时使用该 skill（包括用户说 "openspec explore" 或 "opsx explore" 的场景），并额外带有 `license: MIT`、`compatibility: Requires openspec CLI.` 以及 `metadata`（`author: openspec`、`version: "1.0"`、`generatedBy: "1.13.1"`）。命令版本则是 `name: "OPSX: Explore"`、`category: "Workflow"`、`tags`。

2. **skill 版本没有"输入"小节**，也没有 `### Check for context` 末尾那句 "If the user mentioned a specific change name, read its artifacts for context."（即：用户提到具体 change 名称时读取其产物作为上下文）。这两处在命令版本中存在，skill 版本中不存在。

3. **skill 版本多出一节 `## Handling Different Entry Points`**，位于 `## What You Don't Have To Do` 与 `## Ending Discovery` 之间，用四个对话示例说明不同进入场景（用户带来模糊想法、带来具体问题、卡在实现中途、想比较选项），其中包含多幅 ASCII 图。命令版本没有这一节。该节内容如下（代码块保持原文）：

**用户带来一个模糊的想法：**
```
User: I'm thinking about adding real-time collaboration

You: Real-time collab is a big space. Let me think about this...

      COLLABORATION SPECTRUM
      ============================================

      Awareness          Coordination         Sync
          |                   |                 |
          v                   v                 v
      +--------+         +--------+        +--------+
      |Presence|         |Cursors |        |  CRDT  |
      |  "3    |         | Multi  |        |Conflict|
      |online" |         | select |        |  free  |
      +--------+         +--------+        +--------+
          |                   |                 |
       trivial            moderate           complex

      Where's your head at?
```

**用户带来一个具体的问题：**
```
User: The auth system is a mess

You: [reads codebase]

     +---------------------------------------------+
     |              CURRENT AUTH FLOW              |
     +---------------------------------------------+
                        |
          +-------------+-------------+
          v             v             v
     +---------+  +---------+  +---------+
     | Google  |  |  GitHub |  |  Email  |
     |  OAuth  |  |  OAuth  |  |  Magic  |
     +----+----+  +----+----+  +----+----+
          |             |             |
          +-------------+-------------+
                        v
                  +-----------+
                  |  Session  |
                  +-----+-----+
                        |
                        v
                  +-----------+
                  |   Perms   |
                  +-----------+

     I see three tangles. Which one's burning?
```

**用户卡在实现中途：**
```
User: /opsx:explore add-auth-system
      The OAuth integration is more complex than expected

You: [reads change artifacts]

     You're on task 4: "Implement OAuth flow"

     Let me trace what's involved...

     [draws diagram, explores options, suggests paths]

     Want to update the design to reflect this?
     Or add a spike task to investigate?
```

**用户想比较选项：**
```
User: Should we use Postgres or SQLite?

You: Generic answer is boring. What's the context?

User: A CLI tool that tracks local dev environments

You: That changes everything.

     +-------------------------------------------------+
     |          CLI TOOL DATA STORAGE                  |
     +-------------------------------------------------+

     Key constraints:
     - No daemon running
     - Must work offline
     - Single user

                  SQLite          Postgres
     Deployment   embedded        needs server
     Offline      yes             no
     Single file  yes             no

     SQLite. Not even close.

     Unless... is there a sync component?
```

4. **"Ending Discovery" 的结尾不同**。skill 版本先写"当感觉事情正在成型时，你可以做一次总结："并给出一个总结模板代码块，然后才写"但这个总结是可选的。有时思考本身就是价值。"；命令版本则把这些合并成一句话："当事情成型时，你可能会提议做一次总结——但这是可选的。有时思考本身就是价值。"，没有总结模板。skill 版本中多出的模板内容如下（代码块保持原文）：

```
## What We Figured Out

**The problem**: [crystallized understanding]

**The approach**: [if one emerged]

**Open questions**: [if any remain]

**Next steps** (if ready):
- Turn this into a change: `/opsx:propose`
- Keep exploring: just keep talking
```
