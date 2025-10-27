import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Order from '@/components/Order/Order.vue'
import mockData from '../fixtures/mock-data.json'

// Mock API functions
vi.mock('@/utils/api.js', () => ({
  getOrderList: vi.fn()
}))

// Mock useUserStore
vi.mock('@/stores/user.js', () => ({
  useUserStore: () => ({
    getUserId: () => 1,
    user: {
      id: 1,
      user_id: 1,
      user_name: 'Test User',
      user_email: 'test@example.com'
    }
  })
}))

// Mock getOrderList
const { getOrderList } = await import('@/utils/api.js')

describe('订单管理页面单元测试', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    // 创建并设置 Pinia
    pinia = createPinia()
    setActivePinia(pinia)
    
    // 重置mock计数器
    vi.mocked(getOrderList).mockClear()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('组件渲染测试', () => {
    beforeEach(() => {
      // Mock getOrderList 返回空数据
      vi.mocked(getOrderList).mockResolvedValue({
        success: true,
        orders: []
      })
      
      wrapper = mount(Order, {
        global: {
          plugins: [pinia]
        }
      })
    })

    it('应该正确渲染Order组件', () => {
      expect(wrapper.find('.order-page').exists()).toBe(true)
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
      expect(wrapper.find('.orders-container').exists()).toBe(true)
    })

    it('应该显示页面标题和导航项', () => {
      expect(wrapper.find('.page-title').exists()).toBe(true)
      expect(wrapper.find('.nav-item').exists()).toBe(true)
      expect(wrapper.findAll('.nav-item').length).toBe(2)
    })
  })

  describe('订单列表测试', () => {
    beforeEach(async () => {
      // 使用 mock-data.json 中的订单数据
      const apiResponse = mockData.orderTestData?.orderListApiResponse
      
      vi.mocked(getOrderList).mockResolvedValue(apiResponse)
      
      wrapper = mount(Order, {
        global: {
          plugins: [pinia]
        }
      })
      
      // 等待异步操作完成
      await wrapper.vm.$nextTick()
    })

    it('应该显示订单列表', async () => {
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      
      const orderCards = wrapper.findAll('.order-card')
      expect(orderCards.length).toBeGreaterThan(0)
      
      const firstOrderId = wrapper.find('.order-id')
      expect(firstOrderId.exists()).toBe(true)
    })

    it('应该显示订单信息', async () => {
      await wrapper.vm.$nextTick()
      
      const orderCards = wrapper.findAll('.order-card')
      expect(orderCards.length).toBeGreaterThan(0)
      
      // 验证订单有基本的订单信息结构
      const firstCard = orderCards[0]
      expect(firstCard.find('.order-header').exists()).toBe(true)
      expect(firstCard.find('.order-info').exists()).toBe(true)
    })
  })

  describe('订单展开功能测试', () => {
    beforeEach(async () => {
      // 使用 mock-data.json 中的单个订单数据
      const apiResponse = mockData.orderTestData?.orderListApiResponse
      
      // 只返回第一个订单用于展开测试
      vi.mocked(getOrderList).mockResolvedValue({
        success: true,
        orders: [apiResponse.orders[0]]
      })
      
      wrapper = mount(Order, {
        global: {
          plugins: [pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
    })

    it('点击订单应该展开详情', async () => {
      await wrapper.vm.$nextTick()
      
      const firstOrder = wrapper.find('.order-card')
      if (firstOrder.exists()) {
        await firstOrder.find('.order-header').trigger('click')
        
        expect(wrapper.find('.order-details').exists()).toBe(true)
        expect(wrapper.find('.order-item').exists()).toBe(true)
      }
    })
  })

  describe('空状态测试', () => {
    beforeEach(async () => {
      // Mock getOrderList 返回空数据
      vi.mocked(getOrderList).mockResolvedValue({
        success: true,
        orders: []
      })
      
      wrapper = mount(Order, {
        global: {
          plugins: [pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
    })

    it('当没有订单时应该显示空状态', () => {
      expect(wrapper.find('.no-data').exists()).toBe(true)
      expect(wrapper.text()).toContain('暂无数据')
    })
  })

  describe('API调用流程测试', () => {
    it('应该调用getOrderList', async () => {
      // Mock getOrderList
      vi.mocked(getOrderList).mockResolvedValue({
        success: true,
        orders: []
      })
      
      wrapper = mount(Order, {
        global: {
          plugins: [pinia]
        }
      })
      
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      
      // 验证 getOrderList 被调用
      expect(vi.mocked(getOrderList)).toHaveBeenCalled()
      expect(vi.mocked(getOrderList)).toHaveBeenCalledWith(1)
    })
  })
})
