import { describe, expect, it } from 'vitest'
import { useTodos } from './useTodos'

describe('useTodos', () => {
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

  describe('实例隔离', () => {
    it('每次调用返回相互独立的列表', () => {
      const a = useTodos()
      const b = useTodos()

      a.addTodo('A')

      expect(a.todos.value).toHaveLength(1)
      expect(b.todos.value).toEqual([])
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
})
