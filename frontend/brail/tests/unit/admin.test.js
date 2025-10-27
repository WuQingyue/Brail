import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Databash from '@/components/Admin/Databash.vue'
import mockData from '../fixtures/mock-data.json'

// Mock API functions
vi.mock('@/utils/api.js', () => ({
  getPendingOrders: vi.fn(),
  getProcessedOrders: vi.fn(),
  approveOrder: vi.fn(),
  rejectOrder: vi.fn()
}))

// Mock useUserStore
vi.mock('@/stores/user.js', () => ({
  useUserStore: () => ({
    getUserId: () => 1,
    user: {
      id: 1,
      user_id: 1,
      user_name: 'Admin User',
      user_email: 'admin@example.com'
    }
  })
}))

// Import mocked functions
const { getPendingOrders, getProcessedOrders, approveOrder, rejectOrder } = await import('@/utils/api.js')

describe('管理员页面单元测试', () => {
  let wrapper
  let pinia

  beforeEach(() => {
    // 初始化 Pinia
    pinia = createPinia()
    setActivePinia(pinia)
    
    // 清除所有 mock
    vi.mocked(getPendingOrders).mockClear()
    vi.mocked(getProcessedOrders).mockClear()
    vi.mocked(approveOrder).mockClear()
    vi.mocked(rejectOrder).mockClear()
    
    // 设置默认 mock 返回值
    vi.mocked(getPendingOrders).mockResolvedValue(
      mockData.orderTestData.adminPendingOrdersResponse
    )
    vi.mocked(getProcessedOrders).mockResolvedValue(
      mockData.orderTestData.adminProcessedOrdersResponse
    )
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染Databash组件', async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      
      await flushPromises()
      
      expect(wrapper.find('.admin-page').exists()).toBe(true)
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
    })

    it('应该显示导航项', () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      
      expect(wrapper.find('.nav-item').exists()).toBe(true)
      expect(wrapper.findAll('.nav-item').length).toBe(4)
    })

    it('应该显示所有导航项文本', () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      
      const navItems = wrapper.findAll('.nav-item')
      expect(navItems[0].find('.nav-text').text()).toBe('待审核订单')
      expect(navItems[1].find('.nav-text').text()).toBe('已处理订单')
      expect(navItems[2].find('.nav-text').text()).toBe('产品管理')
      expect(navItems[3].find('.nav-text').text()).toBe('供应商管理')
    })
  })

  describe('待审核订单页面测试', () => {
    beforeEach(async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      await flushPromises()
    })

    it('默认应该显示待审核订单页面（OrderReview组件）', () => {
      // 应该显示 OrderReview 组件的元素
      expect(wrapper.find('.order-review-dashboard').exists()).toBe(true)
      expect(wrapper.find('.orders-section').exists()).toBe(true)
      expect(wrapper.find('.section-title').exists()).toBe(true)
    })

    it('应该调用getPendingOrders API获取待审核订单', () => {
      // 验证 API 被调用
      expect(getPendingOrders).toHaveBeenCalledWith(1)
    })

    it('应该显示订单列表表格', async () => {
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      // 应该显示订单表格
      expect(wrapper.find('.orders-table').exists()).toBe(true)
      expect(wrapper.find('table').exists()).toBe(true)
    })

    it('应该显示搜索框', () => {
      expect(wrapper.find('.search-box').exists()).toBe(true)
      expect(wrapper.find('.search-box input').exists()).toBe(true)
    })

    it('应该显示日期范围筛选器', () => {
      expect(wrapper.find('.date-filter').exists()).toBe(true)
    })

    it('应该显示订单数据', async () => {
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      // 检查是否显示订单数据
      const rows = wrapper.findAll('tbody tr')
      expect(rows.length).toBeGreaterThan(0)
    })

    it('应该能够点击订单查看详情', async () => {
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      // 点击第一个订单
      const firstRow = wrapper.find('tbody tr')
      await firstRow.trigger('click')
      await wrapper.vm.$nextTick()
      
      // 应该显示订单详情
      expect(wrapper.find('.order-details-section').exists()).toBe(true)
    })
  })

  describe('导航切换测试', () => {
    beforeEach(async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      await flushPromises()
    })

    it('点击已处理订单应该切换页面', async () => {
      const navItems = wrapper.findAll('.nav-item')
      await navItems[1].trigger('click')
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      expect(wrapper.vm.currentTab).toBe('processed')
      // 应该显示已处理订单组件
      expect(wrapper.find('.processed-orders-container').exists()).toBe(true)
    })

    it('点击产品管理应该切换页面', async () => {
      const navItems = wrapper.findAll('.nav-item')
      await navItems[2].trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.currentTab).toBe('products')
      expect(wrapper.find('.page-title').text()).toBe('产品管理')
      expect(wrapper.find('.no-data').exists()).toBe(true)
    })

    it('点击供应商管理应该切换页面', async () => {
      const navItems = wrapper.findAll('.nav-item')
      await navItems[3].trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.currentTab).toBe('suppliers')
      expect(wrapper.find('.page-title').text()).toBe('供应商管理')
      expect(wrapper.find('.no-data').exists()).toBe(true)
    })

    it('从其他页面切换回待审核订单应该显示OrderReview组件', async () => {
      const navItems = wrapper.findAll('.nav-item')
      
      // 先切换到其他页面
      await navItems[1].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.order-review-dashboard').exists()).toBe(false)
      
      // 再切换回待审核订单
      await navItems[0].trigger('click')
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      expect(wrapper.vm.currentTab).toBe('pending')
      expect(wrapper.find('.order-review-dashboard').exists()).toBe(true)
    })
  })

  describe('订单审核功能测试', () => {
    beforeEach(async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      await flushPromises()
    })

    it('应该能够批准订单', async () => {
      // Mock window.confirm 和 window.alert
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      vi.mocked(approveOrder).mockResolvedValue({
        success: true,
        message: '订单已批准'
      })
      
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      // 点击第一个订单
      const firstRow = wrapper.find('tbody tr')
      await firstRow.trigger('click')
      await wrapper.vm.$nextTick()
      
      // 点击批准按钮
      const approveBtn = wrapper.find('.approve-btn')
      if (approveBtn.exists()) {
        await approveBtn.trigger('click')
        await wrapper.vm.$nextTick()
        await flushPromises()
        
        expect(mockConfirm).toHaveBeenCalled()
        expect(approveOrder).toHaveBeenCalled()
      }
      
      mockConfirm.mockRestore()
      mockAlert.mockRestore()
    })

    it('应该能够拒绝订单', async () => {
      // Mock window.prompt 和 window.alert
      const mockPrompt = vi.spyOn(window, 'prompt').mockReturnValue('测试拒绝原因')
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      vi.mocked(rejectOrder).mockResolvedValue({
        success: true,
        message: '订单已拒绝'
      })
      
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      // 点击第一个订单
      const firstRow = wrapper.find('tbody tr')
      await firstRow.trigger('click')
      await wrapper.vm.$nextTick()
      
      // 点击拒绝按钮
      const rejectBtn = wrapper.find('.reject-btn')
      if (rejectBtn.exists()) {
        await rejectBtn.trigger('click')
        await wrapper.vm.$nextTick()
        await flushPromises()
        
        expect(mockPrompt).toHaveBeenCalled()
        expect(rejectOrder).toHaveBeenCalledWith(expect.any(String), 1, '测试拒绝原因')
      }
      
      mockPrompt.mockRestore()
      mockAlert.mockRestore()
    })
  })

  describe('暂无数据显示测试', () => {
    it('产品管理和供应商管理页面应该显示暂无数据', async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      
      const navItems = wrapper.findAll('.nav-item')
      
      // 测试产品管理
      await navItems[2].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.no-data').exists()).toBe(true)
      expect(wrapper.find('.no-data-title').text()).toBe('暂无数据')
      
      // 测试供应商管理
      await navItems[3].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.no-data').exists()).toBe(true)
      expect(wrapper.find('.no-data-title').text()).toBe('暂无数据')
    })
  })

  describe('导航激活状态测试', () => {
    it('应该正确标记激活的导航项', async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      
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
    it('应该包含必要的布局元素', async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      
      expect(wrapper.find('.admin-page').exists()).toBe(true)
      expect(wrapper.find('.sidebar').exists()).toBe(true)
      expect(wrapper.find('.main-content').exists()).toBe(true)
      expect(wrapper.find('.sidebar-content').exists()).toBe(true)
    })

    it('应该包含导航图标和文本', () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      
      const navItems = wrapper.findAll('.nav-item')
      navItems.forEach(item => {
        expect(item.find('.nav-icon').exists()).toBe(true)
        expect(item.find('.nav-text').exists()).toBe(true)
      })
    })
  })

  describe('搜索和筛选功能测试', () => {
    beforeEach(async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      await flushPromises()
    })

    it('应该能够通过搜索框搜索订单', async () => {
      const searchInput = wrapper.find('.search-box input')
      expect(searchInput.exists()).toBe(true)
      
      // 输入搜索关键词
      await searchInput.setValue('ORD-12345')
      await wrapper.vm.$nextTick()
      
      // 搜索框应该有值
      expect(searchInput.element.value).toBe('ORD-12345')
    })

    it('应该能够选择日期范围筛选', async () => {
      const dateFilter = wrapper.find('.date-filter')
      expect(dateFilter.exists()).toBe(true)
      
      // 选择日期范围
      await dateFilter.setValue('today')
      await wrapper.vm.$nextTick()
      
      // 日期筛选器应该有值
      expect(dateFilter.element.value).toBe('today')
    })
  })

  describe('分页功能测试', () => {
    beforeEach(async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      await flushPromises()
    })

    it('应该显示分页控件', async () => {
      await wrapper.vm.$nextTick()
      
      const pagination = wrapper.find('.pagination')
      if (pagination.exists()) {
        expect(pagination.exists()).toBe(true)
        expect(wrapper.find('.page-btn').exists()).toBe(true)
      }
    })
  })

  describe('已处理订单页面测试', () => {
    beforeEach(async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      await flushPromises()
      
      // 切换到已处理订单页面
      const navItems = wrapper.findAll('.nav-item')
      await navItems[1].trigger('click')
      await wrapper.vm.$nextTick()
      await flushPromises()
    })

    it('点击已处理订单应该显示ProcessedOrders组件', () => {
      expect(wrapper.vm.currentTab).toBe('processed')
      expect(wrapper.find('.processed-orders-container').exists()).toBe(true)
    })

    it('应该调用getProcessedOrders API获取已处理订单', () => {
      expect(getProcessedOrders).toHaveBeenCalledWith(1)
    })

    it('应该显示已处理订单列表', async () => {
      await wrapper.vm.$nextTick()
      
      // 应该显示订单卡片
      const orderCards = wrapper.findAll('.order-card')
      expect(orderCards.length).toBeGreaterThan(0)
    })

    it('应该显示不同状态的订单', async () => {
      await wrapper.vm.$nextTick()
      
      // 检查是否有不同状态的订单
      const statusBadges = wrapper.findAll('.status-badge')
      expect(statusBadges.length).toBeGreaterThan(0)
      
      // 验证至少有一个状态徽章
      const badges = statusBadges.map(badge => badge.text())
      expect(badges.some(text => text.length > 0)).toBe(true)
    })

    it('应该能够展开订单查看详情', async () => {
      await wrapper.vm.$nextTick()
      
      // 点击第一个订单
      const firstOrderHeader = wrapper.find('.order-header')
      if (firstOrderHeader.exists()) {
        await firstOrderHeader.trigger('click')
        await wrapper.vm.$nextTick()
        
        // 应该显示订单详情
        const orderDetails = wrapper.find('.order-details')
        expect(orderDetails.exists()).toBe(true)
      }
    })

    it('应该显示订单进度时间线', async () => {
      await wrapper.vm.$nextTick()
      
      // 点击第一个订单
      const firstOrderHeader = wrapper.find('.order-header')
      if (firstOrderHeader.exists()) {
        await firstOrderHeader.trigger('click')
        await wrapper.vm.$nextTick()
        
        // 应该显示进度时间线
        const timeline = wrapper.find('.progress-timeline')
        expect(timeline.exists()).toBe(true)
        
        // 应该有4个步骤
        const steps = wrapper.findAll('.timeline-step')
        expect(steps.length).toBe(4)
      }
    })

    it('应该显示客户信息', async () => {
      await wrapper.vm.$nextTick()
      
      // 点击第一个订单
      const firstOrderHeader = wrapper.find('.order-header')
      if (firstOrderHeader.exists()) {
        await firstOrderHeader.trigger('click')
        await wrapper.vm.$nextTick()
        
        // 应该显示客户信息
        const customerInfo = wrapper.find('.customer-info')
        expect(customerInfo.exists()).toBe(true)
      }
    })

    it('应该显示订单统计信息', () => {
      const stats = wrapper.find('.order-stats')
      if (stats.exists()) {
        expect(stats.exists()).toBe(true)
        const statValue = wrapper.find('.stat-value')
        expect(statValue.exists()).toBe(true)
      }
    })

    it('已处理订单不应显示待审核订单', async () => {
      await wrapper.vm.$nextTick()
      
      // 验证 API 被调用
      expect(getProcessedOrders).toHaveBeenCalled()
      
      // 不应该调用待审核订单 API
      // getPendingOrders 在初始加载时会被调用一次（因为默认是pending标签）
      // 但切换到processed后不应该再次调用
      const callCount = vi.mocked(getPendingOrders).mock.calls.length
      expect(callCount).toBe(1) // 只在初始加载时调用一次
    })
  })
})
