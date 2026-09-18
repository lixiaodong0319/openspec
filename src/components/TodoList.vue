<script setup lang="ts">
import { ref } from 'vue'
import { useTodos } from '../composables/useTodos'

const { filter, filteredTodos, activeCount, addTodo, toggleTodo, removeTodo } = useTodos()

const FILTERS = [
  { kind: 'all', label: '全部' },
  { kind: 'active', label: '未完成' },
  { kind: 'completed', label: '已完成' },
] as const

const draft = ref('')

function handleSubmit() {
  const title = draft.value.trim()
  if (title === '') return

  addTodo(title)
  draft.value = ''
}
</script>

<template>
  <section class="todo-list">
    <form class="todo-form" @submit.prevent="handleSubmit">
      <input
        v-model="draft"
        class="todo-input"
        type="text"
        placeholder="要做点什么？"
        aria-label="待办标题"
      />
      <button class="todo-add" type="submit">添加</button>
    </form>

    <div class="todo-toolbar">
      <div class="todo-filters" role="group" aria-label="筛选待办">
        <button
          v-for="item in FILTERS"
          :key="item.kind"
          class="todo-filter"
          :class="{ 'todo-filter--active': filter.kind === item.kind }"
          :data-filter="item.kind"
          type="button"
          :aria-pressed="filter.kind === item.kind"
          @click="filter = { kind: item.kind }"
        >
          {{ item.label }}
        </button>
      </div>
      <p class="todo-count" aria-live="polite">{{ activeCount }}</p>
    </div>

    <p v-if="filteredTodos.length === 0" class="todo-empty">暂无待办</p>
    <ul v-else class="todo-items">
      <li
        v-for="todo in filteredTodos"
        :key="todo.id"
        class="todo-item"
        :class="{ 'todo-item--completed': todo.completed }"
      >
        <button
          class="todo-toggle"
          type="button"
          :aria-pressed="todo.completed"
          @click="toggleTodo(todo.id)"
        >
          {{ todo.completed ? '✓' : '○' }}
        </button>
        <span class="todo-title">{{ todo.title }}</span>
        <button class="todo-delete" type="button" @click="removeTodo(todo.id)">
          删除
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.todo-list {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  text-align: left;
}

.todo-form {
  display: flex;
  gap: 8px;
}

.todo-input {
  flex: 1;
  padding: 0.5em 0.75em;
  font: inherit;
  color: var(--text-h);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
}

.todo-input:focus-visible,
.todo-add:focus-visible,
.todo-toggle:focus-visible,
.todo-delete:focus-visible {
  outline: 2px solid var(--accent-border);
  outline-offset: 2px;
}

.todo-add {
  padding: 0.5em 1em;
  font: inherit;
  color: var(--accent);
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: 6px;
  cursor: pointer;
}

.todo-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1em;
  margin-top: 1em;
}

.todo-filters {
  display: flex;
  gap: 4px;
}

.todo-filter {
  padding: 0.25em 0.7em;
  font: inherit;
  font-size: 0.8em;
  color: var(--text);
  background: none;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
}

.todo-filter--active {
  color: var(--accent);
  background: var(--accent-bg);
  border-color: var(--accent-border);
}

.todo-count {
  margin: 0;
  font-size: 0.8em;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.todo-empty {
  margin: 1.5em 0;
  color: var(--text);
  text-align: center;
}

.todo-items {
  margin: 1em 0 0;
  padding: 0;
  list-style: none;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 0.75em;
  padding: 0.5em 0.75em;
  border-bottom: 1px solid var(--border);
}

.todo-item--completed .todo-title {
  color: var(--text);
  text-decoration: line-through;
  opacity: 0.6;
}

.todo-toggle {
  flex: none;
  width: 1.6em;
  height: 1.6em;
  font: inherit;
  color: var(--accent);
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: 50%;
  cursor: pointer;
}

.todo-title {
  flex: 1;
  color: var(--text-h);
  word-break: break-word;
}

.todo-delete {
  flex: none;
  padding: 0.25em 0.6em;
  font: inherit;
  font-size: 0.8em;
  color: var(--text);
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
}
</style>
