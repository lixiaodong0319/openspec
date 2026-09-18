# Tasks

## 1. 逻辑层：useTodos 基础增删改查的 Red 阶段

- [x] 1.1 新建测试文件 `src/composables/useTodos.spec.ts`，为「新增待办」写失败测试（Red）：断言初始 `todos` 为空数组、`addTodo('买牛奶')` 后列表新增一条标题为「买牛奶」且 `completed` 为 `false` 的待办。验证：运行 `npm run test:run`，该文件失败（模块 `./useTodos` 尚不存在）
- [x] 1.2 在 `src/composables/useTodos.spec.ts` 中补齐失败测试（Red）：断言 `addTodo('')` 与 `addTodo('   ')` 均不新增条目，`addTodo('  买牛奶  ')` 入列标题为 trim 后的「买牛奶」。验证：运行 `npm run test:run`，用例仍为失败
- [x] 1.3 在 `src/composables/useTodos.spec.ts` 中补齐失败测试（Red）：断言 `toggleTodo(id)` 能在 `completed` 的 `true`/`false` 间往返，且列表中存在多条待办时切换仅改变目标条目、其余条目的 `completed` 不变。验证：运行 `npm run test:run`，用例仍为失败
- [x] 1.4 在 `src/composables/useTodos.spec.ts` 中补齐失败测试（Red）：断言 `removeTodo(id)` 移除目标条目、其余条目的顺序与 `completed` 不变，且删除仅剩一条后列表为空数组。验证：运行 `npm run test:run`，用例仍为失败
- [x] 1.5 在 `src/composables/useTodos.spec.ts` 中补齐失败测试（Red）：断言每次调用 `useTodos()` 返回相互独立的列表（在实例 A 中新增不影响实例 B）。验证：运行 `npm run test:run`，用例仍为失败

## 2. 逻辑层：useTodos 基础增删改查的 Green 阶段

- [x] 2.1 新建 `src/composables/useTodos.ts`，实现 `useTodos()` 返回 `{ todos, addTodo, toggleTodo, removeTodo }`：`todos` 为 `ref<Todo[]>([])`，`Todo` 为 `{ id: number; title: string; completed: boolean }`，`id` 由函数内自增计数器生成。筛选与计数字段在任务 5.1 补上，本任务不做。验证：运行 `npm run test:run`，`src/composables/useTodos.spec.ts` 全部通过
- [x] 2.2 在 `src/composables/useTodos.ts` 的 `addTodo` 中实现 trim 与空白拒绝：标题 `trim()` 后为空则直接返回、不修改列表，否则以 trim 后的标题入列且 `completed` 为 `false`。验证：运行 `npm run test:run`，任务 1.2 的用例转为通过
- [x] 2.3 在 `src/composables/useTodos.ts` 中实现 `toggleTodo` 与 `removeTodo`，均按 `id` 定位目标条目。验证：运行 `npm run test:run`，任务 1.3、1.4 的用例转为通过
- [x] 2.4 确认 `useTodos` 的计数器与 `todos` 都在函数作用域内声明（不在模块顶层），使各次调用互不共享状态。验证：运行 `npm run test:run`，任务 1.5 的用例转为通过

## 3. 逻辑层：基础增删改查的 Refactor

- [x] 3.1 重构 `src/composables/useTodos.ts`：把「按 id 查找下标」抽成一个内部小函数供 `toggleTodo` 与 `removeTodo` 共用，导出 `Todo` 类型供组件复用。验证：运行 `npm run test:run`，`src/composables/useTodos.spec.ts` 仍全部通过（重构不改变行为）

## 4. 逻辑层：筛选与计数的 Red 阶段

- [x] 4.1 在 `src/composables/useTodos.spec.ts` 中写失败测试（Red）：断言 `filter` 默认值为 `{ kind: 'all' }`，且该状态下 `filteredTodos` 与 `todos` 内容一致。验证：运行 `npm run test:run`，用例失败
- [x] 4.2 在 `src/composables/useTodos.spec.ts` 中写失败测试（Red）：列表含已完成与未完成待办时，把 `filter` 设为 `{ kind: 'active' }` 后 `filteredTodos` 只含未完成项、设为 `{ kind: 'completed' }` 后只含已完成项；再切回 `{ kind: 'all' }` 后 `todos` 的数量、顺序与各条 `completed` 与切换前一致。验证：运行 `npm run test:run`，用例失败
- [x] 4.3 在 `src/composables/useTodos.spec.ts` 中写失败测试（Red）：断言 `activeCount` 在空列表时为 0、新增一条未完成后为 1、将一条切换为已完成后减 1、删除一条未完成后再减 1。验证：运行 `npm run test:run`，用例失败
- [x] 4.4 在 `src/composables/useTodos.spec.ts` 中写失败测试（Red）：在含已完成与未完成待办的列表上，依次把 `filter` 设为 `active`、`completed`、`all`，断言每一步之后 `activeCount` 的取值都与初始值相同。验证：运行 `npm run test:run`，用例失败
- [x] 4.5 在 `src/composables/useTodos.spec.ts` 中写失败测试（Red）：断言在 `filter` 为 `{ kind: 'completed' }` 时 `addTodo('买牛奶')` 会把 `filter` 重置回 `{ kind: 'all' }`；而 `addTodo('   ')` 被拒绝时 `filter` 保持 `{ kind: 'completed' }` 不变。验证：运行 `npm run test:run`，用例失败
- [x] 4.6 在 `src/composables/useTodos.spec.ts` 中写失败测试（Red）：断言 `toggleTodo` 在 `filter` 为 `{ kind: 'active' }` 时使被勾选的条目从 `filteredTodos` 中消失，但 `todos` 中该条目仍存在且 `completed` 为 `true`。验证：运行 `npm run test:run`，用例失败

## 5. 逻辑层：筛选与计数的 Green 阶段

- [x] 5.1 在 `src/composables/useTodos.ts` 中新增并导出 `TodoFilter` 类型（`{ kind: 'all' | 'active' | 'completed' }`），在函数作用域内声明 `filter = ref<TodoFilter>({ kind: 'all' })` 与 `filteredTodos = computed(...)`，并把两者加入返回对象。验证：运行 `npm run test:run`，任务 4.1、4.2 的用例转为通过
- [x] 5.2 在 `src/composables/useTodos.ts` 中新增 `activeCount = computed(() => todos.value.filter(t => !t.completed).length)` —— 注意基于全量 `todos`，不是 `filteredTodos` —— 并加入返回对象。验证：运行 `npm run test:run`，任务 4.3、4.4 的用例转为通过
- [x] 5.3 在 `src/composables/useTodos.ts` 的 `addTodo` 中，仅在标题校验通过、真正入列之后把 `filter.value` 重置为 `{ kind: 'all' }`；提前 return 的空白标题分支不得触碰 `filter`。验证：运行 `npm run test:run`，任务 4.5 的用例转为通过
- [x] 5.4 确认 `filter` 也声明在函数作用域内（与 `todos`、计数器一致），使各次 `useTodos()` 调用的筛选状态互不共享。验证：运行 `npm run test:run`，任务 4.6 的用例转为通过且全套用例无回归

## 6. 组件层：TodoList 基础交互的 Red 阶段

- [x] 6.1 新建测试文件 `src/components/TodoList.spec.ts`，参照 `HelloWorld.spec.ts` 的写法（`mount` + `wrapper.get`）写失败测试（Red）：断言初始渲染时 `.todo-item` 数量为 0 且 `.todo-empty` 存在。验证：运行 `npm run test:run`，该文件失败（组件尚不存在）
- [x] 6.2 在 `src/components/TodoList.spec.ts` 中补齐失败测试（Red）：在 `.todo-input` 填入标题后点击 `.todo-add`，断言 `.todo-item` 数量为 1、`.todo-title` 文本为所填标题、且输入框的值被清空。验证：运行 `npm run test:run`，用例仍为失败
- [x] 6.3 在 `src/components/TodoList.spec.ts` 中补齐失败测试（Red）：提交空白标题后断言 `.todo-item` 数量不变。验证：运行 `npm run test:run`，用例仍为失败
- [x] 6.4 在 `src/components/TodoList.spec.ts` 中补齐失败测试（Red）：点击 `.todo-toggle` 后断言对应 `.todo-item` 带上 `todo-item--completed` 类，再次点击后该类被移除。验证：运行 `npm run test:run`，用例仍为失败
- [x] 6.5 在 `src/components/TodoList.spec.ts` 中补齐失败测试（Red）：新增三条待办后点击第一条的 `.todo-delete`，断言 `.todo-item` 数量为 2 且剩余条目的标题依次为后两条。验证：运行 `npm run test:run`，用例仍为失败

## 7. 组件层：TodoList 基础交互的 Green 阶段

- [x] 7.1 新建 `src/components/TodoList.vue`（`<script setup lang="ts">`），内部调用 `useTodos()`，渲染 `.todo-input` 输入框、`.todo-add` 提交按钮、`.todo-item` 列表与 `.todo-empty` 空态提示。验证：运行 `npm run test:run`，任务 6.1 的用例转为通过
- [x] 7.2 在 `src/components/TodoList.vue` 中接上新增流程：提交时调用 `addTodo` 并在成功后清空输入框；`.todo-input` 上的回车提交与 `.todo-add` 点击行为一致。验证：运行 `npm run test:run`，任务 6.2、6.3 的用例转为通过
- [x] 7.3 在 `src/components/TodoList.vue` 中接上切换与删除：`.todo-toggle` 绑定 `toggleTodo`，`.todo-delete` 绑定 `removeTodo`，条目按 `completed` 条件绑定 `todo-item--completed` 类，并用 `:key` 绑定 `todo.id`。验证：运行 `npm run test:run`，任务 6.4、6.5 的用例转为通过
- [x] 7.4 为 `src/components/TodoList.vue` 增量补充样式，复用 `src/style.css` 已有的 CSS 变量（`--accent`、`--border`、`--text`、`--code-bg`），使已完成条目在视觉上与未完成项可区分（spec 要求）。验证：运行 `npm run build` 构建成功，并在 `npm run dev` 下手动确认已完成项呈现可辨差异

## 8. 组件层：基础交互的 Refactor

- [x] 8.1 重构 `src/components/TodoList.vue`：确认模板中不残留内联的多余逻辑，事件处理函数命名与 `useTodos` 的导出保持一致，删除实现过程中产生的死代码。验证：运行 `npm run test:run` 与 `npm run typecheck`，两者均全绿

## 9. 组件层：筛选控件与计数的 Red 阶段

- [x] 9.1 在 `src/components/TodoList.spec.ts` 中写失败测试（Red）：断言渲染出三个 `.todo-filter`，其 `data-filter` 分别为 `all`、`active`、`completed`，且初始时只有 `data-filter="all"` 的那个带 `.todo-filter--active` 类。验证：运行 `npm run test:run`，用例失败
- [x] 9.2 在 `src/components/TodoList.spec.ts` 中写失败测试（Red）：新增一条未完成与一条已完成待办后，点击 `data-filter="active"` 的按钮，断言 `.todo-item` 数量为 1 且其标题为那条未完成待办；同时断言 `.todo-filter--active` 类移到了该按钮上。验证：运行 `npm run test:run`，用例失败
- [x] 9.3 在 `src/components/TodoList.spec.ts` 中写失败测试（Red）：点击 `data-filter="completed"` 后断言 `.todo-item` 只含已完成待办；再断言在没有任何已完成待办时，`.todo-item` 数量为 0 且 `.todo-empty` 存在（筛选下子集为空的空态）。验证：运行 `npm run test:run`，用例失败
- [x] 9.4 在 `src/components/TodoList.spec.ts` 中写失败测试（Red）：断言 `.todo-count` 的文本在初始时为 `0`、新增两条未完成后为 `2`、将其中一条勾选后为 `1`；随后依次点击三个筛选按钮，断言每一次之后 `.todo-count` 的文本仍为 `1`，再删除一条未完成待办后变为 `0`（计数不受筛选影响）。验证：运行 `npm run test:run`，用例失败
- [x] 9.5 在 `src/components/TodoList.spec.ts` 中写失败测试（Red）：在 `data-filter="completed"` 状态下通过 `.todo-input` 提交一条有效标题，断言筛选回到 `all`（`data-filter="all"` 的按钮带 `.todo-filter--active`）且新建待办在列表中可见。验证：运行 `npm run test:run`，用例失败

## 10. 组件层：筛选控件与计数的 Green 阶段

- [x] 10.1 在 `src/components/TodoList.vue` 中渲染筛选控件：三个 `.todo-filter` 按钮，`data-filter` 分别为 `all` / `active` / `completed`，按当前 `filter.kind` 条件绑定 `.todo-filter--active`。验证：运行 `npm run test:run`，任务 9.1 的用例转为通过
- [x] 10.2 在 `src/components/TodoList.vue` 中把列表数据源从 `todos` 改为 `filteredTodos`，并让筛选按钮的点击写回 `filter`；确认 `.todo-empty` 在「列表为空」与「筛选下子集为空」两种情况下都会显示。验证：运行 `npm run test:run`，任务 9.2、9.3、9.5 的用例转为通过
- [x] 10.3 在 `src/components/TodoList.vue` 中渲染 `.todo-count`，文本为 `activeCount` 的纯数字（不含「剩余」等文案），并用 `src/style.css` 的既有变量做增量样式，使其在视觉上从列表中区分出来。验证：运行 `npm run test:run`，任务 9.4 的用例转为通过

## 11. 接入应用与清理示例代码

- [x] 11.1 修改 `src/App.vue`，改为 `import TodoList from './components/TodoList.vue'` 并渲染 `<TodoList />`，移除 `HelloWorld` 的引入与使用。验证：运行 `npm run typecheck` 全绿，且 `npm run dev` 首屏显示待办清单
- [x] 11.2 删除 `src/components/HelloWorld.vue` 与 `src/components/HelloWorld.spec.ts`，并确认仓库内已无对 `HelloWorld` 的引用。验证：`npm run test:run` 与 `npm run typecheck` 均全绿，且退出码为 0

## 12. 整体验证

- [x] 12.1 逐条对照 `openspec/changes/add-todo-list/specs/todo-list/spec.md` 中 7 条 Requirement 的全部 Scenario，确认每个 Scenario 都有对应的测试用例覆盖；「刷新后不保留数据」一条按 design.md 的说明只通过「未引入任何持久化 API」来保证，在此明确记录该条无自动化测试。验证：产出对照结论，指明每条 Scenario 对应的测试用例名或说明其为实现事实保证
- [x] 12.2 确认「计数不受筛选影响」这条在两个层级都被覆盖：`useTodos.spec.ts` 中有 `activeCount` 不随 `filter` 变化的断言，`TodoList.spec.ts` 中有 `.todo-count` 文本不随筛选按钮点击变化的断言。验证：两处断言均可被指出，且测试全部通过
- [x] 12.3 运行完成判据：`npm run test:run` 与 `npm run typecheck` 全绿。验证：两条命令均以退出码 0 结束
- [x] 12.4 运行 `npm run dev` 手工走查交互：新增、勾选、删除、空态提示、空白标题被拒绝、三种筛选切换、筛选下子集为空的空态、剩余计数在增删改与筛选切换下的表现。验证：各项行为与 spec 描述一致
