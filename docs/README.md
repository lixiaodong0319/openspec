# OpenSpec 工作流文档（中文译文）

本目录是 OpenSpec 规范化开发流程相关文档的**中文翻译**，用途是阅读和理解，不参与工作流执行。

> 真正生效的文件始终是 `.claude/commands/opsx/*.md` 与 `.claude/skills/openspec-*/SKILL.md`。
> 本目录内容仅供人阅读；执行 `/opsx:*` 命令时读取的是 `.claude/` 下的英文原文。

## 目录

| 文档 | 对应原文件 | 作用 |
|---|---|---|
| [opsx/explore.md](opsx/explore.md) | `.claude/commands/opsx/explore.md` | 探索与澄清，只思考不实现 |
| [opsx/propose.md](opsx/propose.md) | `.claude/commands/opsx/propose.md` | 创建 change 及其规划产物 |
| [opsx/update.md](opsx/update.md) | `.claude/commands/opsx/update.md` | 修订已有规划产物，保持互相一致 |
| [opsx/apply.md](opsx/apply.md) | `.claude/commands/opsx/apply.md` | 按 `tasks.md` 逐任务实现 |
| [opsx/archive.md](opsx/archive.md) | `.claude/commands/opsx/archive.md` | 归档已完成的 change |
| [opsx/sync.md](opsx/sync.md) | `.claude/commands/opsx/sync.md` | 把 delta spec 合并进 main spec |
| [config.md](config.md) | `openspec/config.yaml` | 项目级 context 与 artifact rules |

## 流程主线

```
(可选) /opsx:explore   思考、澄清、对比方案，无强制产出
          |
          v
   /opsx:propose       生成 proposal / specs(delta) / design / tasks，禁止写代码
          |
          v
   /opsx:apply         按 tasks.md 逐任务改代码 + 勾选 checkbox
          |
          v
   /opsx:archive       校验 -> 内联 sync -> 移入 changes/archive/
```

穿插使用（不受主线顺序约束）：

- `/opsx:update` —— 随时修订单个 change 的既有规划产物，永不写代码。
- `/opsx:sync` —— 单独把 delta spec 合并进 main spec，不归档；也被 archive 内联调用。

## 阅读提示

- 译文里的**代码块、CLI 命令、文件路径、JSON 字段名、以及 `### Requirement:` / `#### Scenario:` / `## ADDED Requirements` 这类结构性标记全部保留英文** —— 这些是 OpenSpec CLI 解析的格式本身，翻译会导致校验失败。
- `SHALL` / `MUST` / `WHEN` / `THEN` 等关键字同样保留英文，这是 OpenSpec 规格书写的强制约定。
- 每一篇译文末尾都有一节「附：与 skill 版本的差异」，说明 `.claude/commands/opsx/*.md` 与同名 skill 文件的实质差别。
