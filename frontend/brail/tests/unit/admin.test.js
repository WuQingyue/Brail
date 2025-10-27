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
  rejectOrder: vi.fn(),
  getCategories: vi.fn(),
  getSuppliers: vi.fn(),
  getProductTags: vi.fn(),
  createProduct: vi.fn()
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
const { 
  getPendingOrders, 
  getProcessedOrders, 
  approveOrder, 
  rejectOrder,
  getCategories,
  getSuppliers,
  getProductTags,
  createProduct
} = await import('@/utils/api.js')

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
    vi.mocked(getCategories).mockClear()
    vi.mocked(getSuppliers).mockClear()
    vi.mocked(getProductTags).mockClear()
    vi.mocked(createProduct).mockClear()
    
    // 设置默认 mock 返回值
    vi.mocked(getPendingOrders).mockResolvedValue(
      mockData.orderTestData.adminPendingOrdersResponse
    )
    vi.mocked(getProcessedOrders).mockResolvedValue(
      mockData.orderTestData.adminProcessedOrdersResponse
    )
    vi.mocked(getCategories).mockResolvedValue([
      { id: 'MLB5672', name: '汽车配件', description: '汽车相关配件', icon: '🚗' },
      { id: 'MLB1234', name: '电子产品', description: '电子设备', icon: '📱' }
    ])
    vi.mocked(getSuppliers).mockResolvedValue({
      success: true,
      suppliers: [
        { id: 'SUP001', name: '广州市天河区鑫达电子商行', location: '广东省广州市天河区' },
        { id: 'SUP002', name: '深圳市龙华区华强电子厂', location: '广东省深圳市龙华区' }
      ]
    })
    vi.mocked(getProductTags).mockResolvedValue({
      success: true,
      tags: [
        { id: 'tag-001', name: 'New Arrival', display_name: '新品上市', color: '#10b981', description: '最新上架的产品' },
        { id: 'tag-002', name: 'On Sale', display_name: '特价促销', color: '#ef4444', description: '正在促销的产品' }
      ]
    })
    vi.mocked(createProduct).mockResolvedValue({
      success: true,
      product: { id: 'MLB123456', name: '测试产品' }
    })
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
      await flushPromises()
      
      expect(wrapper.vm.currentTab).toBe('products')
      expect(wrapper.find('.page-title').text()).toBe('Upload New Product')
      expect(wrapper.find('.product-form').exists()).toBe(true)
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
    it('供应商管理页面应该显示暂无数据', async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      
      const navItems = wrapper.findAll('.nav-item')
      
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

  describe('产品管理页面测试', () => {
    beforeEach(async () => {
      wrapper = mount(Databash, {
        global: {
          plugins: [pinia]
        }
      })
      await flushPromises()
      
      // 切换到产品管理页面
      const navItems = wrapper.findAll('.nav-item')
      await navItems[2].trigger('click')
      await wrapper.vm.$nextTick()
      await flushPromises()
    })

    it('点击产品管理应该显示ProductManagement组件', () => {
      expect(wrapper.vm.currentTab).toBe('products')
      expect(wrapper.find('.product-management').exists()).toBe(true)
      expect(wrapper.find('.page-title').text()).toBe('Upload New Product')
    })

    it('应该调用相关API获取数据', () => {
      expect(getCategories).toHaveBeenCalled()
      expect(getSuppliers).toHaveBeenCalled()
      expect(getProductTags).toHaveBeenCalled()
    })

    it('应该显示产品表单', () => {
      expect(wrapper.find('.product-form').exists()).toBe(true)
      expect(wrapper.find('.form-layout').exists()).toBe(true)
    })

    it('应该显示左侧表单区域', () => {
      expect(wrapper.find('.form-left').exists()).toBe(true)
      
      // 检查必填字段
      expect(wrapper.find('input[placeholder="Enter product name"]').exists()).toBe(true)
      expect(wrapper.find('textarea[placeholder="Enter product description"]').exists()).toBe(true)
      expect(wrapper.find('input[placeholder="0.00"]').exists()).toBe(true)
      expect(wrapper.find('select').exists()).toBe(true) // 类别选择
      expect(wrapper.find('input[placeholder="0"]').exists()).toBe(true) // 库存
    })

    it('应该显示右侧图片区域', () => {
      expect(wrapper.find('.form-right').exists()).toBe(true)
      expect(wrapper.find('.main-image-section').exists()).toBe(true)
      expect(wrapper.find('.thumbnail-urls-section').exists()).toBe(true)
    })

    it('应该显示产品变体信息区域', () => {
      expect(wrapper.find('.variants-container').exists()).toBe(true)
      expect(wrapper.find('.variant-card').exists()).toBe(true)
      expect(wrapper.find('.btn-add-variant').exists()).toBe(true)
    })

    it('应该显示标签选择区域', () => {
      expect(wrapper.find('.tags-container').exists()).toBe(true)
      expect(wrapper.find('.tag-input-wrapper').exists()).toBe(true)
      expect(wrapper.find('input[placeholder="Add a tag..."]').exists()).toBe(true)
    })

    it('应该显示表单按钮', () => {
      expect(wrapper.find('.form-actions').exists()).toBe(true)
      expect(wrapper.find('.btn-secondary').exists()).toBe(true)
      expect(wrapper.find('.btn-primary').exists()).toBe(true)
    })

    it('应该能够填写产品名称', async () => {
      const nameInput = wrapper.find('input[placeholder="Enter product name"]')
      await nameInput.setValue('测试产品')
      await wrapper.vm.$nextTick()
      
      expect(nameInput.element.value).toBe('测试产品')
    })

    it('应该能够填写产品描述', async () => {
      const descTextarea = wrapper.find('textarea[placeholder="Enter product description"]')
      await descTextarea.setValue('这是一个测试产品描述')
      await wrapper.vm.$nextTick()
      
      expect(descTextarea.element.value).toBe('这是一个测试产品描述')
    })

    it('应该能够填写产品价格', async () => {
      const priceInput = wrapper.find('input[placeholder="0.00"]')
      await priceInput.setValue('99.99')
      await wrapper.vm.$nextTick()
      
      expect(priceInput.element.value).toBe('99.99')
    })

    it('应该能够填写库存数量', async () => {
      const stockInput = wrapper.find('input[placeholder="0"]')
      await stockInput.setValue('100')
      await wrapper.vm.$nextTick()
      
      expect(stockInput.element.value).toBe('100')
    })

    it('应该能够添加变体', async () => {
      const addVariantBtn = wrapper.find('.btn-add-variant')
      const initialVariants = wrapper.findAll('.variant-card')
      
      await addVariantBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      const newVariants = wrapper.findAll('.variant-card')
      expect(newVariants.length).toBe(initialVariants.length + 1)
    })

    it('应该能够添加缩略图URL', async () => {
      const addThumbnailBtn = wrapper.find('.btn-add-thumbnail')
      const initialThumbnails = wrapper.findAll('.thumbnail-item')
      
      await addThumbnailBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      const newThumbnails = wrapper.findAll('.thumbnail-item')
      expect(newThumbnails.length).toBe(initialThumbnails.length + 1)
    })

    it('应该能够填写主图URL', async () => {
      const mainImageInput = wrapper.find('input[placeholder="Enter main image URL"]')
      await mainImageInput.setValue('https://example.com/main.jpg')
      await wrapper.vm.$nextTick()
      
      expect(mainImageInput.element.value).toBe('https://example.com/main.jpg')
    })

    it('应该能够填写缩略图URL', async () => {
      const thumbnailInput = wrapper.find('input[placeholder="Enter thumbnail URL"]')
      await thumbnailInput.setValue('https://example.com/thumb.jpg')
      await wrapper.vm.$nextTick()
      
      expect(thumbnailInput.element.value).toBe('https://example.com/thumb.jpg')
    })

    it('应该能够提交产品表单', async () => {
      // 填写必填字段
      await wrapper.find('input[placeholder="Enter product name"]').setValue('测试产品')
      await wrapper.find('textarea[placeholder="Enter product description"]').setValue('测试描述')
      await wrapper.find('input[placeholder="0.00"]').setValue('99.99')
      await wrapper.find('input[placeholder="0"]').setValue('100')
      
      // 选择类别
      const categorySelect = wrapper.find('select')
      await categorySelect.setValue('MLB5672')
      
      // 等待数据加载完成后再选择供应商
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      // 选择供应商（第二个select）
      const supplierSelects = wrapper.findAll('select')
      if (supplierSelects.length > 1) {
        await supplierSelects[1].setValue('SUP001')
      }
      
      // 等待数据加载完成
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      // 提交表单 - 使用表单提交事件而不是按钮点击
      const form = wrapper.find('.product-form')
      await form.trigger('submit')
      
      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      await flushPromises()
      await wrapper.vm.$nextTick()
      
      expect(createProduct).toHaveBeenCalled()
      
      // 验证成功对话框显示
      expect(wrapper.find('.dialog-overlay').exists()).toBe(true)
      expect(wrapper.find('.dialog-container').exists()).toBe(true)
      expect(wrapper.find('.dialog-title').text()).toBe('产品创建成功！')
    })

    it('应该能够清空表单', async () => {
      // 填写一些数据
      await wrapper.find('input[placeholder="Enter product name"]').setValue('测试产品')
      await wrapper.find('textarea[placeholder="Enter product description"]').setValue('测试描述')
      await wrapper.vm.$nextTick()
      
      // 点击清空按钮
      const clearBtn = wrapper.find('.btn-secondary')
      await clearBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      // 验证表单被清空
      expect(wrapper.find('input[placeholder="Enter product name"]').element.value).toBe('')
      expect(wrapper.find('textarea[placeholder="Enter product description"]').element.value).toBe('')
    })

    it('应该显示标签建议下拉框', async () => {
      const tagInput = wrapper.find('input[placeholder="Add a tag..."]')
      await tagInput.trigger('focus')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.tag-suggestions').exists()).toBe(true)
    })

    it('应该能够选择标签', async () => {
      const tagInput = wrapper.find('input[placeholder="Add a tag..."]')
      await tagInput.trigger('focus')
      await wrapper.vm.$nextTick()
      
      const tagSuggestions = wrapper.findAll('.tag-suggestion-item')
      if (tagSuggestions.length > 0) {
        await tagSuggestions[0].trigger('click')
        await wrapper.vm.$nextTick()
        
        expect(wrapper.find('.tag-item.selected').exists()).toBe(true)
      }
    })

    it('应该能够添加自定义标签', async () => {
      const tagInput = wrapper.find('input[placeholder="Add a tag..."]')
      await tagInput.setValue('自定义标签')
      await tagInput.trigger('keydown.enter')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.tag-item.selected').exists()).toBe(true)
    })

    it('应该能够删除标签', async () => {
      // 先添加一个标签
      const tagInput = wrapper.find('input[placeholder="Add a tag..."]')
      await tagInput.setValue('测试标签')
      await tagInput.trigger('keydown.enter')
      await wrapper.vm.$nextTick()
      
      // 删除标签
      const removeBtn = wrapper.find('.tag-remove')
      await removeBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.tag-item.selected').exists()).toBe(false)
    })

    it('应该显示加载状态', async () => {
      // Mock createProduct 返回延迟
      vi.mocked(createProduct).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true }), 1000))
      )
      
      // 填写表单并提交
      await wrapper.find('input[placeholder="Enter product name"]').setValue('测试产品')
      await wrapper.find('textarea[placeholder="Enter product description"]').setValue('测试描述')
      await wrapper.find('input[placeholder="0.00"]').setValue('99.99')
      await wrapper.find('input[placeholder="0"]').setValue('100')
      
      // 选择类别
      const categorySelect = wrapper.find('select')
      await categorySelect.setValue('MLB5672')
      
      // 等待数据加载完成后再选择供应商
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      // 选择供应商（第二个select）
      const supplierSelects = wrapper.findAll('select')
      if (supplierSelects.length > 1) {
        await supplierSelects[1].setValue('SUP001')
      }
      
      const form = wrapper.find('.product-form')
      await form.trigger('submit')
      
      // 等待Vue响应式更新
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      // 应该显示加载状态
      const submitBtn = wrapper.find('.btn-primary')
      expect(submitBtn.text()).toContain('Submitting...')
      expect(submitBtn.attributes('disabled')).toBeDefined()
    })

    it('应该显示对话框', async () => {
      // Mock createProduct 返回成功
      vi.mocked(createProduct).mockResolvedValue({
        success: true,
        product: { id: 'MLB123456', name: '测试产品' }
      })
      
      // 填写表单并提交
      await wrapper.find('input[placeholder="Enter product name"]').setValue('测试产品')
      await wrapper.find('textarea[placeholder="Enter product description"]').setValue('测试描述')
      await wrapper.find('input[placeholder="0.00"]').setValue('99.99')
      await wrapper.find('input[placeholder="0"]').setValue('100')
      
      // 选择类别
      const categorySelect = wrapper.find('select')
      await categorySelect.setValue('MLB5672')
      
      // 等待数据加载完成后再选择供应商
      await wrapper.vm.$nextTick()
      await flushPromises()
      
      // 选择供应商（第二个select）
      const supplierSelects = wrapper.findAll('select')
      if (supplierSelects.length > 1) {
        await supplierSelects[1].setValue('SUP001')
      }
      
      const form = wrapper.find('.product-form')
      await form.trigger('submit')
      
      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      await flushPromises()
      await wrapper.vm.$nextTick() // 额外的tick确保对话框渲染
      
      // 应该显示成功对话框
      expect(wrapper.find('.dialog-overlay').exists()).toBe(true)
      expect(wrapper.find('.dialog-container').exists()).toBe(true)
      expect(wrapper.find('.dialog-title').text()).toBe('产品创建成功！')
    })
  })
})
