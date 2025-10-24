import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Databash from '@/components/Admin/Databash.vue'

describe('管理员页面单元测试', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(Databash)
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染Databash组件', () => {
      expect(wrapper.find('.admin-page').exists()).toBe(true)
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
    })

    it('应该显示页面标题和导航项', () => {
      expect(wrapper.find('.page-title').exists()).toBe(true)
      expect(wrapper.find('.nav-item').exists()).toBe(true)
      expect(wrapper.findAll('.nav-item').length).toBe(4)
    })

    it('应该显示所有导航项文本', () => {
      const navItems = wrapper.findAll('.nav-item')
      expect(navItems[0].find('.nav-text').text()).toBe('待审核订单')
      expect(navItems[1].find('.nav-text').text()).toBe('已处理订单')
      expect(navItems[2].find('.nav-text').text()).toBe('产品管理')
      expect(navItems[3].find('.nav-text').text()).toBe('供应商管理')
    })
  })

  describe('导航切换测试', () => {
    it('默认应该显示待审核订单页面', () => {
      expect(wrapper.find('.admin-container').exists()).toBe(true)
      expect(wrapper.find('.no-data').exists()).toBe(true)
      expect(wrapper.find('.no-data-title').text()).toBe('暂无数据')
    })

    it('点击已处理订单应该切换页面', async () => {
      const navItems = wrapper.findAll('.nav-item')
      await navItems[1].trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.currentTab).toBe('processed')
      expect(wrapper.find('.page-title').text()).toBe('已处理订单')
    })

    it('点击产品管理应该切换页面', async () => {
      const navItems = wrapper.findAll('.nav-item')
      await navItems[2].trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.currentTab).toBe('products')
      expect(wrapper.find('.page-title').text()).toBe('产品管理')
    })

    it('点击供应商管理应该切换页面', async () => {
      const navItems = wrapper.findAll('.nav-item')
      await navItems[3].trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.currentTab).toBe('suppliers')
      expect(wrapper.find('.page-title').text()).toBe('供应商管理')
    })

    it('点击待审核订单应该切换回待审核页面', async () => {
      const navItems = wrapper.findAll('.nav-item')
      // 先切换到其他页面
      await navItems[1].trigger('click')
      await wrapper.vm.$nextTick()
      
      // 再切换回待审核订单
      await navItems[0].trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.currentTab).toBe('pending')
      expect(wrapper.find('.page-title').text()).toBe('待审核订单')
    })
  })

  describe('暂无数据显示测试', () => {
    it('应该显示暂无数据图标', () => {
      expect(wrapper.find('.no-data-icon').exists()).toBe(true)
    })

    it('应该显示暂无数据标题', () => {
      expect(wrapper.find('.no-data-title').exists()).toBe(true)
      expect(wrapper.find('.no-data-title').text()).toBe('暂无数据')
    })

    it('应该显示暂无数据描述', () => {
      expect(wrapper.find('.no-data-description').exists()).toBe(true)
      expect(wrapper.find('.no-data-description').text()).toBe('页面正在完善中，敬请期待')
    })

    it('所有页面都应该显示暂无数据', async () => {
      const navItems = wrapper.findAll('.nav-item')
      
      // 测试待审核订单
      await navItems[0].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.no-data').exists()).toBe(true)
      
      // 测试已处理订单
      await navItems[1].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.no-data').exists()).toBe(true)
      
      // 测试产品管理
      await navItems[2].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.no-data').exists()).toBe(true)
      
      // 测试供应商管理
      await navItems[3].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.no-data').exists()).toBe(true)
    })
  })

  describe('导航激活状态测试', () => {
    it('应该正确标记激活的导航项', async () => {
      const navItems = wrapper.findAll('.nav-item')
      
      // 默认激活待审核订单
      expect(navItems[0].classes()).toContain('active')
      
      // 切换到已处理订单
      await navItems[1].trigger('click')
      await wrapper.vm.$nextTick()
      expect(navItems[1].classes()).toContain('active')
      expect(navItems[0].classes()).not.toContain('active')
    })
  })

  describe('响应式设计测试', () => {
    it('应该包含必要的布局元素', () => {
      expect(wrapper.find('.admin-page').exists()).toBe(true)
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
      expect(wrapper.find('.sidebar-content').exists()).toBe(true)
    })

    it('应该包含导航图标和文本', () => {
      const navItems = wrapper.findAll('.nav-item')
      navItems.forEach(item => {
        expect(item.find('.nav-icon').exists()).toBe(true)
        expect(item.find('.nav-text').exists()).toBe(true)
      })
    })
  })
})
