import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useTodos } from './useTodos'

const STORAGE_KEY = 'todo-list/todos'

function readStoredTodos() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === null) return null

  return JSON.parse(raw) as { version: number; todos: { title: string; completed: boolean }[] }
}

describe('useTodos', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('新增待办', () => {
    it('初始列表为空数组', () => {
      const { todos } = useTodos()

      expect(todos.value).toEqual([])
    })

    it('addTodo 新增一条未完成的待办', () => {
      const { todos, addTodo } = useTodos()

      addTodo('买牛奶')

      expect(todos.value).toHaveLength(1)
      expect(todos.value[0].title).toBe('买牛奶')
      expect(todos.value[0].completed).toBe(false)
    })

    it('拒绝空字符串标题', () => {
      const { todos, addTodo } = useTodos()

      addTodo('')

      expect(todos.value).toEqual([])
    })

    it('拒绝仅由空白字符组成的标题', () => {
      const { todos, addTodo } = useTodos()

      addTodo('   ')

      expect(todos.value).toEqual([])
    })

    it('入列标题去除首尾空白', () => {
      const { todos, addTodo } = useTodos()

      addTodo('  买牛奶  ')

      expect(todos.value[0].title).toBe('买牛奶')
    })
  })

  describe('切换待办完成状态', () => {
    it('toggleTodo 在已完成与未完成之间往返', () => {
      const { todos, addTodo, toggleTodo } = useTodos()
      addTodo('买牛奶')
      const { id } = todos.value[0]

      toggleTodo(id)
      expect(todos.value[0].completed).toBe(true)

      toggleTodo(id)
      expect(todos.value[0].completed).toBe(false)
    })

    it('切换只影响目标条目', () => {
      const { todos, addTodo, toggleTodo } = useTodos()
      addTodo('A')
      addTodo('B')
      addTodo('C')

      toggleTodo(todos.value[1].id)

      expect(todos.value[0].completed).toBe(false)
      expect(todos.value[1].completed).toBe(true)
      expect(todos.value[2].completed).toBe(false)
    })
  })

  describe('删除待办', () => {
    it('removeTodo 移除目标条目且不影响其余', () => {
      const { todos, addTodo, toggleTodo, removeTodo } = useTodos()
      addTodo('A')
      addTodo('B')
      addTodo('C')
      toggleTodo(todos.value[1].id)

      removeTodo(todos.value[0].id)

      expect(todos.value.map((todo) => todo.title)).toEqual(['B', 'C'])
      expect(todos.value.map((todo) => todo.completed)).toEqual([true, false])
    })

    it('删除仅剩的一条后列表为空', () => {
      const { todos, addTodo, removeTodo } = useTodos()
      addTodo('A')

      removeTodo(todos.value[0].id)

      expect(todos.value).toEqual([])
    })
  })

  describe('按完成状态筛选列表', () => {
    it('默认筛选为全部，且 filteredTodos 与 todos 内容一致', () => {
      const { todos, filteredTodos, filter } = useTodos()

      expect(filter.value).toEqual({ kind: 'all' })
      expect(filteredTodos.value).toEqual(todos.value)
    })

    it('未完成筛选只含未完成项，已完成筛选只含已完成项', () => {
      const { todos, filteredTodos, filter, addTodo, toggleTodo } = useTodos()
      addTodo('A')
      addTodo('B')
      toggleTodo(todos.value[0].id)

      filter.value = { kind: 'active' }
      expect(filteredTodos.value.map((todo) => todo.title)).toEqual(['B'])

      filter.value = { kind: 'completed' }
      expect(filteredTodos.value.map((todo) => todo.title)).toEqual(['A'])
    })

    it('筛选不改变底层数据', () => {
      const { todos, filter, addTodo, toggleTodo } = useTodos()
      addTodo('A')
      addTodo('B')
      toggleTodo(todos.value[0].id)
      const snapshot = todos.value.map((todo) => ({ ...todo }))

      filter.value = { kind: 'active' }
      filter.value = { kind: 'completed' }
      filter.value = { kind: 'all' }

      expect(todos.value).toEqual(snapshot)
    })

    it('在未完成筛选下切换完成状态，该条目从 filteredTodos 消失但仍在 todos 中', () => {
      const { todos, filteredTodos, filter, addTodo, toggleTodo } = useTodos()
      addTodo('A')
      addTodo('B')
      filter.value = { kind: 'active' }
      const { id } = todos.value[0]

      toggleTodo(id)

      expect(filteredTodos.value.map((todo) => todo.title)).toEqual(['B'])
      expect(todos.value).toHaveLength(2)
      expect(todos.value.find((todo) => todo.id === id)?.completed).toBe(true)
    })
  })

  describe('展示剩余未完成数量', () => {
    it('activeCount 随新增、完成、删除变化', () => {
      const { todos, activeCount, addTodo, toggleTodo, removeTodo } = useTodos()
      expect(activeCount.value).toBe(0)

      addTodo('A')
      expect(activeCount.value).toBe(1)

      toggleTodo(todos.value[0].id)
      expect(activeCount.value).toBe(0)

      addTodo('B')
      expect(activeCount.value).toBe(1)

      removeTodo(todos.value[1].id)
      expect(activeCount.value).toBe(0)
    })

    it('activeCount 不受筛选影响', () => {
      const { todos, activeCount, filter, addTodo, toggleTodo } = useTodos()
      addTodo('A')
      addTodo('B')
      toggleTodo(todos.value[0].id)
      const initial = activeCount.value

      filter.value = { kind: 'active' }
      expect(activeCount.value).toBe(initial)

      filter.value = { kind: 'completed' }
      expect(activeCount.value).toBe(initial)

      filter.value = { kind: 'all' }
      expect(activeCount.value).toBe(initial)
    })

    it('新增成功后回到全部筛选，空白标题被拒绝时不改动筛选', () => {
      const { filter, addTodo } = useTodos()
      filter.value = { kind: 'completed' }

      addTodo('   ')
      expect(filter.value).toEqual({ kind: 'completed' })

      addTodo('买牛奶')
      expect(filter.value).toEqual({ kind: 'all' })
    })
  })

  describe('持久化到本地存储', () => {
    it('新增待办后写入本地存储', async () => {
      const { addTodo } = useTodos()

      addTodo('买牛奶')
      await nextTick()

      const stored = readStoredTodos()
      expect(stored?.version).toBe(1)
      expect(stored?.todos.map((todo) => todo.title)).toEqual(['买牛奶'])
    })

    it('切换完成状态后同步到本地存储', async () => {
      const { todos, addTodo, toggleTodo } = useTodos()
      addTodo('A')
      await nextTick()

      toggleTodo(todos.value[0].id)
      await nextTick()

      expect(readStoredTodos()?.todos[0].completed).toBe(true)
    })

    it('删除待办后同步到本地存储', async () => {
      const { todos, addTodo, removeTodo } = useTodos()
      addTodo('A')
      addTodo('B')
      await nextTick()

      removeTodo(todos.value[0].id)
      await nextTick()

      expect(readStoredTodos()?.todos.map((todo) => todo.title)).toEqual(['B'])
    })

    it('从本地存储恢复待办及其完成状态', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          todos: [
            { id: 1, title: 'A', completed: true },
            { id: 2, title: 'B', completed: false },
          ],
        }),
      )

      const { todos, activeCount, filter } = useTodos()

      expect(todos.value.map((todo) => todo.title)).toEqual(['A', 'B'])
      expect(todos.value.map((todo) => todo.completed)).toEqual([true, false])
      expect(activeCount.value).toBe(1)
      expect(filter.value).toEqual({ kind: 'all' })
    })
  })

  describe('存储内容损坏时的降级', () => {
    it('非法 JSON 时以空列表启动', () => {
      localStorage.setItem(STORAGE_KEY, 'not json {')

      const { todos } = useTodos()

      expect(todos.value).toEqual([])
    })

    it('内容是合法 JSON 但不是对象时以空列表启动', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([1, 2, 3]))

      const { todos } = useTodos()

      expect(todos.value).toEqual([])
    })

    it('version 不是 1 时以空列表启动', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 2, todos: [{ id: 1, title: 'A', completed: false }] }),
      )

      const { todos } = useTodos()

      expect(todos.value).toEqual([])
    })

    it('todos 不是数组时以空列表启动', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, todos: 'oops' }),
      )

      const { todos } = useTodos()

      expect(todos.value).toEqual([])
    })

    it('丢弃结构不合法的条目，保留合法条目', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          todos: [
            { id: 1, title: '合法', completed: false },
            { id: 2, completed: true },
            { id: 3, title: '缺 completed' },
            { id: 4, title: '类型不符', completed: 'yes' },
            { id: '5', title: 'id 非数字', completed: false },
            'not an object',
            null,
          ],
        }),
      )

      const { todos } = useTodos()

      expect(todos.value).toEqual([{ id: 1, title: '合法', completed: false }])
    })
  })

  describe('存储不可用时的降级', () => {
    it('读取抛异常时以空列表启动', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('storage disabled')
      })

      const { todos } = useTodos()

      expect(todos.value).toEqual([])
    })

    it('写入抛异常时待办仍出现在当前会话的列表中', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded')
      })

      const { todos, addTodo } = useTodos()

      addTodo('买牛奶')

      expect(todos.value.map((todo) => todo.title)).toEqual(['买牛奶'])
    })
  })

  describe('id 冲突', () => {
    it('恢复已有数据后新增的待办 id 不与已恢复条目冲突', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 1,
          todos: [{ id: 7, title: '已有', completed: false }],
        }),
      )

      const { todos, addTodo, toggleTodo, removeTodo } = useTodos()
      addTodo('新增')

      const added = todos.value[1]
      expect(added.id).not.toBe(7)

      toggleTodo(added.id)
      expect(todos.value.map((todo) => todo.completed)).toEqual([false, true])

      removeTodo(added.id)
      expect(todos.value.map((todo) => todo.title)).toEqual(['已有'])
    })
  })

  describe('跨实例的持久化共享', () => {
    it('两个实例共享同一份持久化数据', async () => {
      const a = useTodos()
      a.addTodo('A')
      await nextTick()

      const b = useTodos()

      expect(b.todos.value.map((todo) => todo.title)).toEqual(['A'])
    })
  })
})
