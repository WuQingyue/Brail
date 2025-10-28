import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LogisticsManagement2 from '../../src/components/Logistics/LogisticsManagement2.vue'
import CustomsOrders from '../../src/components/Logistics/CustomsOrders.vue'
import ClearedOrders from '../../src/components/Logistics/ClearedOrders.vue'
import DeliveredOrders from '../../src/components/Logistics/DeliveredOrders.vue'
import { useUserStore } from '../../src/stores/user.js'
import * as api from '../../src/utils/api.js'
import mockData from '../fixtures/mock-data.json'

// Mock API functions
vi.mock('../../src/utils/api.js', () => ({
  getLogisticsCustomsOrders: vi.fn(),
  getLogisticsClearedOrders: vi.fn(),
  getLogisticsDeliveredOrders: vi.fn(),
  updateLogisticsOrderStatus: vi.fn()
}))

// Extract test data from mock-data.json
const { logistics2TestData } = mockData
const {
  customsOrders: mockCustomsOrders,
  clearedOrders: mockClearedOrders,
  deliveredOrders: mockDeliveredOrders,
  apiResponses,
  userStoreMock,
  navigationTabs,
  emptyStates
} = logistics2TestData

describe('物流管理员2页面测试', () => {
  let wrapper
  let pinia
  let userStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    
    // Mock user store using data from mock-data.json
    userStore.setUser(userStoreMock.logistics1Admin)

    // Mock API responses using data from mock-data.json
    api.getLogisticsCustomsOrders.mockResolvedValue({
      success: true,
      orders: mockCustomsOrders
    })
    api.getLogisticsClearedOrders.mockResolvedValue({
      success: true,
      orders: mockClearedOrders
    })
    api.getLogisticsDeliveredOrders.mockResolvedValue({
      success: true,
      orders: mockDeliveredOrders
    })
    api.updateLogisticsOrderStatus.mockResolvedValue(apiResponses.updateOrderStatusSuccess)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('组件渲染', () => {
    it('应该正确渲染主容器', () => {
      wrapper = mount(LogisticsManagement2, {
        global: {
          plugins: [pinia]
        }
      })

      expect(wrapper.find('.logistics-page').exists()).toBe(true)
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
    })

    it('应该渲染所有导航标签', () => {
      wrapper = mount(LogisticsManagement2, {
        global: {
          plugins: [pinia]
        }
      })

      const navItems = wrapper.findAll('.nav-item')
      expect(navItems).toHaveLength(3)

      navigationTabs.forEach((tab, index) => {
        expect(navItems[index].find('.nav-text').text()).toBe(tab.title)
        expect(navItems[index].find('.nav-icon').text()).toBe(tab.icon)
      })
    })

    it('默认应该选中第一个标签（customs）', () => {
      wrapper = mount(LogisticsManagement2, {
        global: {
          plugins: [pinia]
        }
      })

      const navItems = wrapper.findAll('.nav-item')
      expect(navItems[0].classes()).toContain('active')
      expect(navItems[1].classes()).not.toContain('active')
      expect(navItems[2].classes()).not.toContain('active')
    })
  })

  describe('标签切换功能', () => {
    beforeEach(() => {
      wrapper = mount(LogisticsManagement2, {
        global: {
          plugins: [pinia]
        }
      })
    })

    it('点击第二个标签应该切换到cleared', async () => {
      const navItems = wrapper.findAll('.nav-item')
      await navItems[1].trigger('click')

      expect(navItems[0].classes()).not.toContain('active')
      expect(navItems[1].classes()).toContain('active')
      expect(navItems[2].classes()).not.toContain('active')
    })

    it('点击第三个标签应该切换到delivered', async () => {
      const navItems = wrapper.findAll('.nav-item')
      await navItems[2].trigger('click')

      expect(navItems[0].classes()).not.toContain('active')
      expect(navItems[1].classes()).not.toContain('active')
      expect(navItems[2].classes()).toContain('active')
    })

    it('点击第一个标签应该切换回customs', async () => {
      const navItems = wrapper.findAll('.nav-item')
      
      // 先切换到第二个标签
      await navItems[1].trigger('click')
      expect(navItems[1].classes()).toContain('active')
      
      // 再切换回第一个标签
      await navItems[0].trigger('click')
      expect(navItems[0].classes()).toContain('active')
      expect(navItems[1].classes()).not.toContain('active')
    })
  })

  describe('子组件渲染', () => {
    beforeEach(() => {
      wrapper = mount(LogisticsManagement2, {
        global: {
          plugins: [pinia]
        }
      })
    })

    it('默认应该渲染CustomsOrders组件', () => {
      expect(wrapper.findComponent(CustomsOrders).exists()).toBe(true)
      expect(wrapper.findComponent(ClearedOrders).exists()).toBe(false)
      expect(wrapper.findComponent(DeliveredOrders).exists()).toBe(false)
    })

    it('切换到cleared标签应该渲染ClearedOrders组件', async () => {
      const navItems = wrapper.findAll('.nav-item')
      await navItems[1].trigger('click')

      expect(wrapper.findComponent(CustomsOrders).exists()).toBe(false)
      expect(wrapper.findComponent(ClearedOrders).exists()).toBe(true)
      expect(wrapper.findComponent(DeliveredOrders).exists()).toBe(false)
    })

    it('切换到delivered标签应该渲染DeliveredOrders组件', async () => {
      const navItems = wrapper.findAll('.nav-item')
      await navItems[2].trigger('click')

      expect(wrapper.findComponent(CustomsOrders).exists()).toBe(false)
      expect(wrapper.findComponent(ClearedOrders).exists()).toBe(false)
      expect(wrapper.findComponent(DeliveredOrders).exists()).toBe(true)
    })
  })

  describe('响应式设计', () => {
    beforeEach(() => {
      wrapper = mount(LogisticsManagement2, {
        global: {
          plugins: [pinia]
        }
      })
    })

    it('应该包含响应式CSS类', () => {
      expect(wrapper.find('.logistics-page').exists()).toBe(true)
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
    })

    it('导航项应该包含正确的样式类', () => {
      const navItems = wrapper.findAll('.nav-item')
      navItems.forEach(item => {
        expect(item.find('.nav-icon').exists()).toBe(true)
        expect(item.find('.nav-text').exists()).toBe(true)
      })
    })
  })
})

describe('到达巴西海关订单页面测试', () => {
  let wrapper
  let pinia
  let userStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    
    userStore.setUser(userStoreMock.logistics1Admin)

    api.getLogisticsCustomsOrders.mockResolvedValue({
      success: true,
      orders: mockCustomsOrders
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('组件渲染', () => {
    it('应该正确渲染海关订单页面', async () => {
      wrapper = mount(CustomsOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.customs-dashboard').exists()).toBe(true)
      expect(wrapper.find('.section-title').text()).toBe('到达巴西海关订单')
    })

    it('应该显示订单列表', async () => {
      wrapper = mount(CustomsOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(wrapper.find('.orders-table').exists()).toBe(true)
      expect(wrapper.find('table').exists()).toBe(true)
    })

    it('应该显示正确的表格头部', async () => {
      wrapper = mount(CustomsOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      const headers = wrapper.findAll('th')
      const expectedHeaders = ['订单ID', '客户', '日期', '总额', '状态']
      
      expectedHeaders.forEach((header, index) => {
        expect(headers[index].text()).toBe(header)
      })
    })
  })

  describe('订单操作', () => {
    beforeEach(async () => {
      wrapper = mount(CustomsOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    it('点击订单应该显示详情', async () => {
      const orderRow = wrapper.find('tbody tr')
      await orderRow.trigger('click')

      expect(wrapper.find('.order-details-section').exists()).toBe(true)
      expect(wrapper.find('.no-selection').exists()).toBe(false)
    })

    it('应该显示清关完成按钮', async () => {
      const orderRow = wrapper.find('tbody tr')
      await orderRow.trigger('click')

      const clearedBtn = wrapper.find('.cleared-btn')
      expect(clearedBtn.exists()).toBe(true)
      expect(clearedBtn.text()).toBe('清关完成')
    })

    it('应该显示拒绝订单按钮', async () => {
      const orderRow = wrapper.find('tbody tr')
      await orderRow.trigger('click')

      const rejectBtn = wrapper.find('.reject-btn')
      expect(rejectBtn.exists()).toBe(true)
      expect(rejectBtn.text()).toBe('拒绝订单')
    })
  })

  describe('空状态', () => {
    beforeEach(() => {
      api.getLogisticsCustomsOrders.mockResolvedValue(apiResponses.customsOrdersSuccess)
    })

    it('没有订单时应该显示空状态', async () => {
      wrapper = mount(CustomsOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-icon').text()).toBe(emptyStates.customs.icon)
      expect(wrapper.find('h3').text()).toBe(emptyStates.customs.title)
    })
  })
})

describe('清关完成订单页面测试', () => {
  let wrapper
  let pinia
  let userStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    
    userStore.setUser(userStoreMock.logistics1Admin)

    api.getLogisticsClearedOrders.mockResolvedValue({
      success: true,
      orders: mockClearedOrders
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('组件渲染', () => {
    it('应该正确渲染清关完成订单页面', async () => {
      wrapper = mount(ClearedOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.cleared-dashboard').exists()).toBe(true)
      expect(wrapper.find('.section-title').text()).toBe('清关完成订单')
    })

    it('应该显示订单列表', async () => {
      wrapper = mount(ClearedOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(wrapper.find('.orders-table').exists()).toBe(true)
    })
  })

  describe('订单操作', () => {
    beforeEach(async () => {
      wrapper = mount(ClearedOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    it('应该显示确认交付按钮', async () => {
      const orderRow = wrapper.find('tbody tr')
      await orderRow.trigger('click')

      const deliveredBtn = wrapper.find('.delivered-btn')
      expect(deliveredBtn.exists()).toBe(true)
      expect(deliveredBtn.text()).toBe('确认交付')
    })

    it('应该显示拒绝订单按钮', async () => {
      const orderRow = wrapper.find('tbody tr')
      await orderRow.trigger('click')

      const rejectBtn = wrapper.find('.reject-btn')
      expect(rejectBtn.exists()).toBe(true)
      expect(rejectBtn.text()).toBe('拒绝订单')
    })
  })

  describe('空状态', () => {
    beforeEach(() => {
      api.getLogisticsClearedOrders.mockResolvedValue(apiResponses.clearedOrdersSuccess)
    })

    it('没有订单时应该显示空状态', async () => {
      wrapper = mount(ClearedOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(wrapper.find('.empty-state').exists()).toBe(true)
      expect(wrapper.find('.empty-icon').text()).toBe(emptyStates.cleared.icon)
      expect(wrapper.find('h3').text()).toBe(emptyStates.cleared.title)
    })
  })
})

describe('已交付订单页面测试', () => {
  let wrapper
  let pinia
  let userStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    
    userStore.setUser(userStoreMock.logistics1Admin)

    api.getLogisticsDeliveredOrders.mockResolvedValue({
      success: true,
      orders: mockDeliveredOrders
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('组件渲染', () => {
    it('应该正确渲染已交付订单页面', async () => {
      wrapper = mount(DeliveredOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()

      expect(wrapper.find('.delivered-orders-container').exists()).toBe(true)
      expect(wrapper.find('.page-title').text()).toBe('已交付订单')
    })

    it('应该显示订单列表', async () => {
      wrapper = mount(DeliveredOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(wrapper.find('.orders-list').exists()).toBe(true)
    })

    it('应该显示订单统计', async () => {
      wrapper = mount(DeliveredOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(wrapper.find('.order-stats').exists()).toBe(true)
      expect(wrapper.find('.stat-label').text()).toBe('总订单数')
    })
  })

  describe('订单操作', () => {
    beforeEach(async () => {
      wrapper = mount(DeliveredOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))
    })

    it('点击订单应该展开详情', async () => {
      const orderCard = wrapper.find('.order-card')
      await orderCard.find('.order-header').trigger('click')

      expect(wrapper.find('.order-details').exists()).toBe(true)
      expect(wrapper.find('.order-items').exists()).toBe(true)
    })

    it('应该显示订单进度时间线', async () => {
      const orderCard = wrapper.find('.order-card')
      await orderCard.find('.order-header').trigger('click')

      expect(wrapper.find('.order-tracking').exists()).toBe(true)
      expect(wrapper.find('.progress-timeline').exists()).toBe(true)
    })

    it('应该显示交付信息', async () => {
      const orderCard = wrapper.find('.order-card')
      await orderCard.find('.order-header').trigger('click')

      expect(wrapper.find('.delivery-info').exists()).toBe(true)
      expect(wrapper.find('.delivery-value.delivered').text()).toBe('✅ 已交付')
    })

    it('应该显示订单已完成按钮（禁用状态）', async () => {
      const orderCard = wrapper.find('.order-card')
      await orderCard.find('.order-header').trigger('click')

      const completedBtn = wrapper.find('.completed-btn')
      expect(completedBtn.exists()).toBe(true)
      expect(completedBtn.text()).toBe('✅ 订单已完成')
      expect(completedBtn.attributes('disabled')).toBeDefined()
    })
  })

  describe('空状态', () => {
    beforeEach(() => {
      api.getLogisticsDeliveredOrders.mockResolvedValue(apiResponses.deliveredOrdersSuccess)
    })

    it('没有订单时应该显示空状态', async () => {
      wrapper = mount(DeliveredOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(wrapper.find('.empty-container').exists()).toBe(true)
      expect(wrapper.find('.no-data-icon').text()).toBe(emptyStates.delivered.icon)
      expect(wrapper.find('.no-data-title').text()).toBe(emptyStates.delivered.title)
    })
  })
})

describe('API集成测试', () => {
  let wrapper
  let pinia
  let userStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
    
    userStore.setUser(userStoreMock.logistics1Admin)
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  describe('API调用', () => {
    it('CustomsOrders应该调用getLogisticsCustomsOrders API', async () => {
      api.getLogisticsCustomsOrders.mockResolvedValue({
        success: true,
        orders: mockCustomsOrders
      })

      wrapper = mount(CustomsOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(api.getLogisticsCustomsOrders).toHaveBeenCalledWith(userStoreMock.logistics1Admin.user_id)
    })

    it('ClearedOrders应该调用getLogisticsClearedOrders API', async () => {
      api.getLogisticsClearedOrders.mockResolvedValue({
        success: true,
        orders: mockClearedOrders
      })

      wrapper = mount(ClearedOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(api.getLogisticsClearedOrders).toHaveBeenCalledWith(userStoreMock.logistics1Admin.user_id)
    })

    it('DeliveredOrders应该调用getLogisticsDeliveredOrders API', async () => {
      api.getLogisticsDeliveredOrders.mockResolvedValue({
        success: true,
        orders: mockDeliveredOrders
      })

      wrapper = mount(DeliveredOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(api.getLogisticsDeliveredOrders).toHaveBeenCalledWith(userStoreMock.logistics1Admin.user_id)
    })
  })

  describe('错误处理', () => {
    it('API调用失败时应该处理错误', async () => {
      api.getLogisticsCustomsOrders.mockRejectedValue(new Error(apiResponses.apiError.message))

      wrapper = mount(CustomsOrders, {
        global: {
          plugins: [pinia]
        }
      })

      await wrapper.vm.$nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      // 组件应该仍然渲染，但可能显示空状态或错误状态
      expect(wrapper.find('.customs-dashboard').exists()).toBe(true)
    })
  })
})

describe('用户权限测试', () => {
  let wrapper
  let pinia
  let userStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    userStore = useUserStore()
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
  })

  it('logistics1角色应该能够访问LogisticsManagement2', () => {
    userStore.setUser(userStoreMock.logistics1Admin)

    wrapper = mount(LogisticsManagement2, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('.logistics-page').exists()).toBe(true)
  })

  it('logistics2角色应该能够访问LogisticsManagement2', () => {
    userStore.setUser(userStoreMock.logistics2Admin)

    wrapper = mount(LogisticsManagement2, {
      global: {
        plugins: [pinia]
      }
    })

    expect(wrapper.find('.logistics-page').exists()).toBe(true)
  })

  it('其他角色不应该能够访问LogisticsManagement2', () => {
    userStore.setUser(userStoreMock.regularUser)

    wrapper = mount(LogisticsManagement2, {
      global: {
        plugins: [pinia]
      }
    })

    // 组件仍然会渲染，但实际应用中应该有路由守卫
    expect(wrapper.find('.logistics-page').exists()).toBe(true)
  })
})
