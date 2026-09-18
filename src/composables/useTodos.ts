import { computed, ref } from 'vue'

export interface Todo {
  id: number
  title: string
  completed: boolean
}

export type TodoFilter = { kind: 'all' | 'active' | 'completed' }

export function useTodos() {
  const todos = ref<Todo[]>([])
  const filter = ref<TodoFilter>({ kind: 'all' })
  let nextId = 0

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
