import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import TodoList from './TodoList.vue'

describe('TodoList', () => {
  async function mountWithAdd(titles: string[]) {
    const wrapper = mount(TodoList)
    for (const title of titles) {
      await addTodoViaForm(wrapper, title)
    }
    return wrapper
  }

  async function addTodoViaForm(wrapper: ReturnType<typeof mount>, title: string) {
    await wrapper.get('.todo-input').setValue(title)
    await wrapper.get('.todo-form').trigger('submit')
  }

  it('初始渲染为空列表', () => {
    const wrapper = mount(TodoList)

    expect(wrapper.findAll('.todo-item')).toHaveLength(0)
    expect(wrapper.find('.todo-empty').exists()).toBe(true)
  })

  it('提交有效标题后新增条目并清空输入框', async () => {
    const wrapper = mount(TodoList)

    await addTodoViaForm(wrapper, '买牛奶')

    expect(wrapper.findAll('.todo-item')).toHaveLength(1)
    expect(wrapper.get('.todo-title').text()).toBe('买牛奶')
    expect((wrapper.get('.todo-input').element as HTMLInputElement).value).toBe('')
  })

  it('提交空白标题不新增条目', async () => {
    const wrapper = mount(TodoList)

    await addTodoViaForm(wrapper, '   ')

    expect(wrapper.findAll('.todo-item')).toHaveLength(0)
  })

  it('切换完成后条目带上已完成类，再次切换后移除', async () => {
    const wrapper = await mountWithAdd(['买牛奶'])

    await wrapper.get('.todo-toggle').trigger('click')
    expect(wrapper.get('.todo-item').classes()).toContain('todo-item--completed')

    await wrapper.get('.todo-toggle').trigger('click')
    expect(wrapper.get('.todo-item').classes()).not.toContain('todo-item--completed')
  })

  it('删除指定条目后其余条目保留', async () => {
    const wrapper = await mountWithAdd(['A', 'B', 'C'])

    await wrapper.findAll('.todo-delete')[0].trigger('click')

    expect(wrapper.findAll('.todo-item')).toHaveLength(2)
    expect(wrapper.findAll('.todo-title').map((node) => node.text())).toEqual(['B', 'C'])
  })

  it('删除仅剩的一条后显示空态', async () => {
    const wrapper = await mountWithAdd(['A'])

    await wrapper.get('.todo-delete').trigger('click')

    expect(wrapper.findAll('.todo-item')).toHaveLength(0)
    expect(wrapper.find('.todo-empty').exists()).toBe(true)
  })

  it('渲染三个筛选按钮且初始只有全部为选中态', () => {
    const wrapper = mount(TodoList)

    const filters = wrapper.findAll('.todo-filter')
    expect(filters.map((node) => node.attributes('data-filter'))).toEqual([
      'all',
      'active',
      'completed',
    ])
    expect(filters.map((node) => node.classes().includes('todo-filter--active'))).toEqual([
      true,
      false,
      false,
    ])
  })

  it('切到未完成筛选只展示未完成待办，选中态随之移动', async () => {
    const wrapper = await mountWithAdd(['A', 'B'])
    await wrapper.findAll('.todo-toggle')[0].trigger('click')

    await wrapper.get('[data-filter="active"]').trigger('click')

    expect(wrapper.findAll('.todo-item')).toHaveLength(1)
    expect(wrapper.get('.todo-title').text()).toBe('B')
    expect(wrapper.get('[data-filter="active"]').classes()).toContain('todo-filter--active')
    expect(wrapper.get('[data-filter="all"]').classes()).not.toContain('todo-filter--active')
  })

  it('切到已完成筛选只展示已完成待办', async () => {
    const wrapper = await mountWithAdd(['A', 'B'])
    await wrapper.findAll('.todo-toggle')[0].trigger('click')

    await wrapper.get('[data-filter="completed"]').trigger('click')

    expect(wrapper.findAll('.todo-item')).toHaveLength(1)
    expect(wrapper.get('.todo-title').text()).toBe('A')
  })

  it('筛选下子集为空时显示空态且不渲染条目', async () => {
    const wrapper = await mountWithAdd(['A'])

    await wrapper.get('[data-filter="completed"]').trigger('click')

    expect(wrapper.findAll('.todo-item')).toHaveLength(0)
    expect(wrapper.find('.todo-empty').exists()).toBe(true)
  })

  it('剩余计数随增删改变化，且不受筛选影响', async () => {
    const wrapper = mount(TodoList)
    expect(wrapper.get('.todo-count').text()).toBe('0')

    await addTodoViaForm(wrapper, 'A')
    await addTodoViaForm(wrapper, 'B')
    expect(wrapper.get('.todo-count').text()).toBe('2')

    await wrapper.findAll('.todo-toggle')[0].trigger('click')
    expect(wrapper.get('.todo-count').text()).toBe('1')

    for (const kind of ['active', 'completed', 'all']) {
      await wrapper.get(`[data-filter="${kind}"]`).trigger('click')
      expect(wrapper.get('.todo-count').text()).toBe('1')
    }

    await wrapper.findAll('.todo-delete')[1].trigger('click')
    expect(wrapper.get('.todo-count').text()).toBe('0')
  })

  it('在未完成筛选下切换完成状态后该条目消失', async () => {
    const wrapper = await mountWithAdd(['A', 'B'])
    await wrapper.get('[data-filter="active"]').trigger('click')

    await wrapper.findAll('.todo-toggle')[0].trigger('click')

    expect(wrapper.findAll('.todo-title').map((node) => node.text())).toEqual(['B'])
  })

  it('在已完成筛选下提交有效标题后回到全部筛选且新条目可见', async () => {
    const wrapper = await mountWithAdd(['A'])
    await wrapper.get('.todo-toggle').trigger('click')
    await wrapper.get('[data-filter="completed"]').trigger('click')

    await addTodoViaForm(wrapper, '买牛奶')

    expect(wrapper.get('[data-filter="all"]').classes()).toContain('todo-filter--active')
    expect(wrapper.findAll('.todo-item')).toHaveLength(2)
    expect(wrapper.findAll('.todo-title').map((node) => node.text())).toEqual(['A', '买牛奶'])
  })
})
