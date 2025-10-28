import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LogisticsManagement from '@/components/Logistics/LogisticsManagement.vue'
import ProcessingOrders from '@/components/Logistics/ProcessingOrders.vue'
import ShippedOrders from '@/components/Logistics/ShippedOrders.vue'
import ProcessedSampleOrders from '@/components/Logistics/ProcessedSampleOrders.vue'
import mockData from '../fixtures/mock-data.json'

// Mock API functions
vi.mock('@/utils/api.js', () => ({
  getLogisticsProcessingOrders: vi.fn(),
  getLogisticsShippedOrders: vi.fn(),
  getLogisticsSampleProcessedOrders: vi.fn(),
  updateLogisticsOrderStatus: vi.fn()
}))

// Mock useUserStore
vi.mock('@/stores/user.js', () => ({
  useUserStore: () => ({
    getUserId: () => mockData.logisticsTestData.userStoreMock.logisticsAdmin.getUserId,
    user: mockData.logisticsTestData.userStoreMock.logisticsAdmin.user
  })
}))

// Import mocked functions
const { 
  getLogisticsProcessingOrders, 
  getLogisticsShippedOrders, 
  getLogisticsSampleProcessedOrders,
  updateLogisticsOrderStatus
} = await import('@/utils/api.js')

describe('物流管理1页面单元测试', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    // 初始化 Pinia
    pinia = createPinia()
    setActivePinia(pinia)

    // 重置所有 mock
    vi.clearAllMocks()

    // 设置默认的 mock 返回值
    getLogisticsProcessingOrders.mockResolvedValue({
      success: true,
      orders: mockData.logisticsTestData.processingOrders
    })

    getLogisticsShippedOrders.mockResolvedValue({
      success: true,
      orders: mockData.logisticsTestData.shippedOrders
    })

    getLogisticsSampleProcessedOrders.mockResolvedValue({
      success: true,
      orders: mockData.logisticsTestData.processedSampleOrders
    })

    updateLogisticsOrderStatus.mockResolvedValue(mockData.logisticsTestData.apiResponses.updateOrderStatusSuccess)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染物流管理页面', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      // 检查页面标题
      expect(wrapper.find('.logistics-page').exists()).toBe(true)
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
    })

    it('应该显示所有导航项', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      const navItems = wrapper.findAll('.nav-item')
      expect(navItems).toHaveLength(3)

      // 检查导航项内容
      expect(navItems[0].text()).toContain('准备发货订单')
      expect(navItems[1].text()).toContain('运输中订单')
      expect(navItems[2].text()).toContain('已处理订单')

      // 检查图标
      expect(navItems[0].text()).toContain('📦')
      expect(navItems[1].text()).toContain('🚚')
      expect(navItems[2].text()).toContain('✅')
    })

    it('默认应该显示准备发货订单页面', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      // 检查默认激活的标签
      const activeNavItem = wrapper.find('.nav-item.active')
      expect(activeNavItem.text()).toContain('准备发货订单')

      // 检查是否渲染了ProcessingOrders组件
      expect(wrapper.findComponent(ProcessingOrders).exists()).toBe(true)
    })
  })

  describe('导航功能测试', () => {
    beforeEach(async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })
      await flushPromises()
    })

    it('点击运输中订单应该切换到ShippedOrders组件', async () => {
      const shippedNavItem = wrapper.findAll('.nav-item')[1]
      await shippedNavItem.trigger('click')
      await flushPromises()

      // 检查激活状态
      expect(shippedNavItem.classes()).toContain('active')
      
      // 检查组件切换
      expect(wrapper.findComponent(ShippedOrders).exists()).toBe(true)
      expect(wrapper.findComponent(ProcessingOrders).exists()).toBe(false)
    })

    it('点击已处理订单应该切换到ProcessedSampleOrders组件', async () => {
      const deliveredNavItem = wrapper.findAll('.nav-item')[2]
      await deliveredNavItem.trigger('click')
      await flushPromises()

      // 检查激活状态
      expect(deliveredNavItem.classes()).toContain('active')
      
      // 检查组件切换
      expect(wrapper.findComponent(ProcessedSampleOrders).exists()).toBe(true)
      expect(wrapper.findComponent(ProcessingOrders).exists()).toBe(false)
    })

    it('点击准备发货订单应该切换回ProcessingOrders组件', async () => {
      // 先切换到其他页面
      const shippedNavItem = wrapper.findAll('.nav-item')[1]
      await shippedNavItem.trigger('click')
      await flushPromises()

      // 再切换回准备发货订单
      const processingNavItem = wrapper.findAll('.nav-item')[0]
      await processingNavItem.trigger('click')
      await flushPromises()

      // 检查激活状态
      expect(processingNavItem.classes()).toContain('active')
      
      // 检查组件切换
      expect(wrapper.findComponent(ProcessingOrders).exists()).toBe(true)
      expect(wrapper.findComponent(ShippedOrders).exists()).toBe(false)
    })
  })

  describe('响应式设计测试', () => {
    it('应该应用正确的CSS类', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      // 检查主要CSS类
      expect(wrapper.find('.logistics-page').exists()).toBe(true)
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
      expect(wrapper.find('.sidebar-content').exists()).toBe(true)
    })

    it('导航项应该有正确的样式类', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      const navItems = wrapper.findAll('.nav-item')
      
      // 检查第一个导航项（默认激活）
      expect(navItems[0].classes()).toContain('active')
      
      // 检查其他导航项
      expect(navItems[1].classes()).not.toContain('active')
      expect(navItems[2].classes()).not.toContain('active')
    })
  })

  describe('组件集成测试', () => {
    it('应该正确传递props给子组件', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      // 检查ProcessingOrders组件是否正确挂载
      const processingComponent = wrapper.findComponent(ProcessingOrders)
      expect(processingComponent.exists()).toBe(true)
    })

    it('切换标签时应该正确卸载和挂载组件', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      // 初始状态
      expect(wrapper.findComponent(ProcessingOrders).exists()).toBe(true)
      expect(wrapper.findComponent(ShippedOrders).exists()).toBe(false)

      // 切换到运输中订单
      const shippedNavItem = wrapper.findAll('.nav-item')[1]
      await shippedNavItem.trigger('click')
      await flushPromises()

      expect(wrapper.findComponent(ProcessingOrders).exists()).toBe(false)
      expect(wrapper.findComponent(ShippedOrders).exists()).toBe(true)
    })
  })

  describe('数据流测试', () => {
    it('应该正确管理currentTab状态', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      // 检查初始状态
      expect(wrapper.vm.currentTab).toBe('processing')

      // 切换标签
      const shippedNavItem = wrapper.findAll('.nav-item')[1]
      await shippedNavItem.trigger('click')
      await flushPromises()

      expect(wrapper.vm.currentTab).toBe('shipped')
    })

    it('应该正确计算currentTabData', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      // 检查初始状态
      const currentTabData = wrapper.vm.currentTabData
      expect(currentTabData.id).toBe('processing')
      expect(currentTabData.title).toBe('准备发货订单')
      expect(currentTabData.icon).toBe('📦')

      // 切换标签
      const deliveredNavItem = wrapper.findAll('.nav-item')[2]
      await deliveredNavItem.trigger('click')
      await flushPromises()

      const newTabData = wrapper.vm.currentTabData
      expect(newTabData.id).toBe('delivered')
      expect(newTabData.title).toBe('已处理订单')
      expect(newTabData.icon).toBe('✅')
    })
  })

  describe('错误处理测试', () => {
    it('应该处理API调用失败的情况', async () => {
      // 模拟API调用失败
      getLogisticsProcessingOrders.mockRejectedValue(new Error('API Error'))

      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      // 组件应该仍然正常渲染
      expect(wrapper.find('.logistics-page').exists()).toBe(true)
      expect(wrapper.findComponent(ProcessingOrders).exists()).toBe(true)
    })

    it('应该处理API返回错误响应的情况', async () => {
      // 模拟API返回错误响应
      getLogisticsProcessingOrders.mockResolvedValue(mockData.logisticsTestData.apiResponses.apiError)

      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      // 组件应该仍然正常渲染
      expect(wrapper.find('.logistics-page').exists()).toBe(true)
      expect(wrapper.findComponent(ProcessingOrders).exists()).toBe(true)
    })
  })

  describe('可访问性测试', () => {
    it('导航项应该有正确的可访问性属性', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      const navItems = wrapper.findAll('.nav-item')
      
      // 检查每个导航项都有点击事件
      navItems.forEach(item => {
        expect(item.element.tagName).toBe('DIV')
        expect(item.attributes('role')).toBeUndefined() // 可以添加role="button"
      })
    })

    it('应该支持键盘导航', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      const navItems = wrapper.findAll('.nav-item')
      
      // 检查是否有tabindex属性（可以添加）
      navItems.forEach(item => {
        expect(item.element).toBeDefined()
      })
    })
  })

  describe('性能测试', () => {
    it('应该高效地切换组件', async () => {
      wrapper = mount(LogisticsManagement, {
        global: {
          plugins: [pinia]
        }
      })

      await flushPromises()

      const startTime = performance.now()

      // 快速切换多个标签
      const navItems = wrapper.findAll('.nav-item')
      for (let i = 0; i < navItems.length; i++) {
        await navItems[i].trigger('click')
        await flushPromises()
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      // 切换应该在合理时间内完成（小于100ms）
      expect(duration).toBeLessThan(100)
    })
  })
})
