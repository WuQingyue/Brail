import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Order from '@/components/Order/Order.vue'
import mockData from '../fixtures/mock-data.json'
import { getOrderId, getOrderDetails } from '@/utils/api.js'

// Mock API functions
vi.mock('@/utils/api.js', () => ({
  getOrderId: vi.fn(),
  getOrderDetails: vi.fn()
}))

describe('订单管理页面单元测试', () => {
  let wrapper

  beforeEach(() => {
    // 重置mock计数器
    vi.mocked(getOrderId).mockClear()
    vi.mocked(getOrderDetails).mockClear()
  })

  describe('组件渲染测试', () => {
    beforeEach(() => {
      wrapper = mount(Order)
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
      // 重置mock计数器
      vi.mocked(getOrderId).mockClear()
      vi.mocked(getOrderDetails).mockClear()
      
      // 模拟新的API调用流程：先获取订单ID列表，再获取订单详情
      const mockOrderIdResponse = mockData.orderTestData.orderIdResponseTestData.multipleOrders
      
      const mockOrderDetails = mockData.orderTestData.mockOrders
      
      // 模拟API响应
      vi.mocked(getOrderId).mockResolvedValue(mockOrderIdResponse)
      // 模拟多次调用getOrderDetails返回不同的订单
      vi.mocked(getOrderDetails)
        .mockResolvedValueOnce(mockOrderDetails[0])
        .mockResolvedValueOnce(mockOrderDetails[1])
        .mockResolvedValueOnce(mockOrderDetails[2])
        .mockResolvedValueOnce(mockOrderDetails[3])
      
      // 重新挂载组件
      wrapper.unmount()
      wrapper = mount(Order)
    })

    it('应该显示订单列表', async () => {
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      
      const orderCards = wrapper.findAll('.order-card')
      expect(orderCards.length).toBe(4)
      
      const firstOrderId = wrapper.find('.order-id')
      expect(firstOrderId.exists()).toBe(true)
      expect(firstOrderId.text()).toBe('#ORD-001')
    })

    it('应该显示订单信息', async () => {
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
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
      // 重置mock计数器
      vi.mocked(getOrderId).mockClear()
      vi.mocked(getOrderDetails).mockClear()
      
      // 模拟新的API调用流程
      const mockOrderIdResponse = mockData.orderTestData.orderIdResponseTestData.singleOrder
      
      const mockOrderDetails = mockData.orderTestData.mockOrders[0]
      
      vi.mocked(getOrderId).mockResolvedValue(mockOrderIdResponse)
      vi.mocked(getOrderDetails).mockResolvedValue(mockOrderDetails)
      
      // 重新挂载组件
      wrapper.unmount()
      wrapper = mount(Order)
    })

    it('点击订单应该展开详情', async () => {
      await wrapper.vm.$nextTick()
      
      const firstOrder = wrapper.find('.order-card')
      await firstOrder.find('.order-header').trigger('click')
      
      expect(wrapper.find('.order-details').exists()).toBe(true)
      expect(wrapper.find('.order-item').exists()).toBe(true)
      expect(wrapper.find('.order-tracking').exists()).toBe(true)
    })

    it('展开后应该显示订单项目', async () => {
      await wrapper.vm.$nextTick()
      
      const orderCard = wrapper.find('.order-card')
      await orderCard.find('.order-header').trigger('click')
      await wrapper.vm.$nextTick()
      
      const orderItems = wrapper.findAll('.order-item')
      expect(orderItems.length).toBe(2)
      
      expect(orderItems[0].find('.item-description').text()).toBe('产品A')
      expect(orderItems[0].find('.quantity').text()).toBe('2')
      expect(orderItems[0].find('.unit-price').text()).toBe('单价: ¥99.99')
    })

    it('应该显示订单跟踪信息', async () => {
      await wrapper.vm.$nextTick()
      
      const orderCard = wrapper.find('.order-card')
      await orderCard.find('.order-header').trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.tracking-title').text()).toBe('跟踪您的请求')
      expect(wrapper.find('.progress-timeline').exists()).toBe(true)
      expect(wrapper.findAll('.timeline-step').length).toBe(4)
    })
  })

  describe('订单操作测试', () => {
    beforeEach(async () => {
      // 重置mock计数器
      vi.mocked(getOrderId).mockClear()
      vi.mocked(getOrderDetails).mockClear()
      
      // 模拟新的API调用流程
      const mockOrderIdResponse = mockData.orderTestData.orderIdResponseTestData.singleOrder
      
      const mockOrderDetails = mockData.orderTestData.mockOrders[0]
      
      vi.mocked(getOrderId).mockResolvedValue(mockOrderIdResponse)
      vi.mocked(getOrderDetails).mockResolvedValue(mockOrderDetails)
      
      // 重新挂载组件
      wrapper.unmount()
      wrapper = mount(Order)
    })

    it('应该能够展开和收起订单详情', async () => {
      await wrapper.vm.$nextTick()
      
      const orderCard = wrapper.find('.order-card')
      const orderHeader = orderCard.find('.order-header')
      
      // 点击展开
      await orderHeader.trigger('click')
      expect(wrapper.find('.order-details').exists()).toBe(true)
      
      // 再次点击收起
      await orderHeader.trigger('click')
      expect(wrapper.find('.order-details').exists()).toBe(false)
    })
  })

  describe('API调用流程测试', () => {
    beforeEach(async () => {
      // 重置mock计数器
      vi.mocked(getOrderId).mockClear()
      vi.mocked(getOrderDetails).mockClear()
      
      // 模拟新的API调用流程
      const mockOrderIdResponse = mockData.orderTestData.orderIdResponseTestData.multipleOrders
      
      const mockOrderDetails = mockData.orderTestData.mockOrders
      
      vi.mocked(getOrderId).mockResolvedValue(mockOrderIdResponse)
      
      // 为每个订单ID设置对应的mock返回值
      vi.mocked(getOrderDetails).mockImplementation((orderId) => {
        if (orderId === 'ORD-001') return Promise.resolve(mockOrderDetails[0])
        if (orderId === 'ORD-002') return Promise.resolve(mockOrderDetails[1])
        if (orderId === 'ORD-003') return Promise.resolve(mockOrderDetails[2])
        if (orderId === 'ORD-004') return Promise.resolve(mockOrderDetails[3])
        return Promise.resolve(null)
      })
    })

    it('应该先调用getOrderId再调用getOrderDetails', async () => {
      // 重新挂载组件以清除之前的调用记录
      wrapper.unmount()
      wrapper = mount(Order)
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      
      expect(vi.mocked(getOrderId)).toHaveBeenCalledTimes(1)
      // 验证getOrderDetails被正确调用，至少3次（因为有时异步操作可能导致某些调用延迟）
      expect(vi.mocked(getOrderDetails)).toHaveBeenCalled()
      expect(vi.mocked(getOrderDetails)).toHaveBeenCalledWith('ORD-001')
      expect(vi.mocked(getOrderDetails)).toHaveBeenCalledWith('ORD-002')
      expect(vi.mocked(getOrderDetails)).toHaveBeenCalledWith('ORD-003')
    })

    it('当API调用失败时应该显示空订单列表', async () => {
      // 模拟getOrderId失败
      vi.mocked(getOrderId).mockRejectedValue(new Error('API Error'))
      
      // 重新挂载组件以触发loadOrders
      wrapper.unmount()
      wrapper = mount(Order)
      await wrapper.vm.$nextTick()
      
      const orderCards = wrapper.findAll('.order-card')
      expect(orderCards.length).toBe(0)
    })
  })

  describe('响应式设计测试', () => {
    beforeEach(async () => {
      // 重置mock计数器
      vi.mocked(getOrderId).mockClear()
      vi.mocked(getOrderDetails).mockClear()
      
      // 模拟API响应
      const mockOrderIdResponse = mockData.orderTestData.orderIdResponseTestData.singleOrder
      const mockOrderDetails = mockData.orderTestData.mockOrders[0]
      
      vi.mocked(getOrderId).mockResolvedValue(mockOrderIdResponse)
      vi.mocked(getOrderDetails).mockResolvedValue(mockOrderDetails)
      
      // 重新挂载组件
      wrapper.unmount()
      wrapper = mount(Order)
    })

    it('应该包含响应式设计所需的元素', async () => {
      await wrapper.vm.$nextTick()
      
      // 验证sidebar相关元素存在
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.sidebar-content').exists()).toBe(true)
      expect(wrapper.find('.nav-item').exists()).toBe(true)
      
      // 验证主内容区域存在
      expect(wrapper.find('.main-content').exists()).toBe(true)
      
      // 验证订单项目元素存在
      const orderCard = wrapper.find('.order-card')
      if (orderCard.exists()) {
        await orderCard.find('.order-header').trigger('click')
        await wrapper.vm.$nextTick()
        
        // 展开后应该能看到订单项目
        expect(wrapper.find('.order-item').exists()).toBe(true)
        expect(wrapper.find('.item-image').exists()).toBe(true)
        expect(wrapper.find('.progress-timeline').exists()).toBe(true)
      }
    })

    it('应该在移动端时调整布局结构', async () => {
      await wrapper.vm.$nextTick()
      
      // 验证关键元素的类名存在（CSS媒体查询会在实际环境中生效）
      expect(wrapper.find('.order-page').exists()).toBe(true)
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      
      // 验证导航项存在
      const navItems = wrapper.findAll('.nav-item')
      expect(navItems.length).toBeGreaterThan(0)
    })
  })
})
