import { computed, ref, watch } from 'vue'

export interface Todo {
  id: number
  title: string
  completed: boolean
}

export type TodoFilter = { kind: 'all' | 'active' | 'completed' }

const STORAGE_KEY = 'todo-list/todos'
const STORAGE_VERSION = 1

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false

  const { id, title, completed } = value as Todo

  return (
    typeof id === 'number' &&
    typeof title === 'string' &&
    title !== '' &&
    typeof completed === 'boolean'
  )
}

function readTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return []

    const parsed = JSON.parse(raw) as { version?: unknown; todos?: unknown }
    if (typeof parsed !== 'object' || parsed === null) return []
    if (parsed.version !== STORAGE_VERSION) return []
    if (!Array.isArray(parsed.todos)) return []

    return parsed.todos.filter(isTodo)
  } catch {
    return []
  }
}

function writeTodos(todos: Todo[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: STORAGE_VERSION, todos }),
    )
  } catch {
    // 存储不可用（隐私模式、超配额等）时静默降级为纯内存模式
  }
}

export function useTodos() {
  const initialTodos = readTodos()
  const todos = ref<Todo[]>(initialTodos)
  const filter = ref<TodoFilter>({ kind: 'all' })
  let nextId = initialTodos.reduce((max, todo) => Math.max(max, todo.id + 1), 0)

  watch(todos, () => writeTodos(todos.value), { deep: true })

  const filteredTodos = computed(() => {
    if (filter.value.kind === 'active') {
      return todos.value.filter((todo) => !todo.completed)
    }
    if (filter.value.kind === 'completed') {
      return todos.value.filter((todo) => todo.completed)
    }
    return todos.value
  })

  const activeCount = computed(
    () => todos.value.filter((todo) => !todo.completed).length,
  )

  function addTodo(title: string) {
    const trimmed = title.trim()
    if (trimmed === '') return

    todos.value.push({ id: nextId++, title: trimmed, completed: false })
    filter.value = { kind: 'all' }
  }

  function indexOf(id: number) {
    return todos.value.findIndex((item) => item.id === id)
  }

  function toggleTodo(id: number) {
    const index = indexOf(id)
    if (index === -1) return

    todos.value[index].completed = !todos.value[index].completed
  }

  function removeTodo(id: number) {
    const index = indexOf(id)
    if (index === -1) return

    todos.value.splice(index, 1)
  }

  return {
    todos,
    filter,
    filteredTodos,
    activeCount,
    addTodo,
    toggleTodo,
    removeTodo,
  }
}
