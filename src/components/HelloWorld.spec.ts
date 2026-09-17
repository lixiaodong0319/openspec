import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import HelloWorld from './HelloWorld.vue'

describe('HelloWorld', () => {
  it('计数器初始为 0，点击后递增', async () => {
    const wrapper = mount(HelloWorld)

    const counter = wrapper.get('button.counter')
    expect(counter.text()).toContain('Count is 0')

    await counter.trigger('click')
    expect(counter.text()).toContain('Count is 1')
  })
})
