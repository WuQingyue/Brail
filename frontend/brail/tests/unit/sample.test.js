import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Sample from '../../src/components/Sample/Sample.vue'
import mockData from '../fixtures/mock-data.json'

// Mock document methods
global.document.addEventListener = vi.fn()
global.document.removeEventListener = vi.fn()

// Mock API functions
vi.mock('../../src/utils/api.js', () => ({
  getCategories: vi.fn(),
  getSampleProducts: vi.fn(),
  getAllSampleProducts: vi.fn()
}))

// Mock ProductDetail component
vi.mock('../../src/components/Product/ProductDetail.vue', () => ({
  default: {
    name: 'ProductDetail',
    template: '<div class="product-detail-mock">Product Detail</div>',
    props: ['productId', 'isSample'],
    emits: ['add-to-cart']
  }
}))

// Import mocked functions
const { getCategories, getSampleProducts, getAllSampleProducts } = await import('../../src/utils/api.js')

describe('先试后用页面组件测试', () => {
  let wrapper
  const mockProducts = mockData.sampleTestData.sampleProducts
  const mockCategories = [
    { id: 'MLB5672', name: '汽车配件', icon: '🚗' },
    { id: 'MLB5726', name: '电子产品', icon: '📱' },
    { id: 'MLB1000', name: '数码影音', icon: '🎵' }
  ]

  beforeEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
    
    // 设置默认mock返回值
    vi.mocked(getCategories).mockResolvedValue(mockCategories)
    vi.mocked(getAllSampleProducts).mockResolvedValue({
      success: true,
      code: 200,
      count: mockProducts.length,
      products: mockProducts
    })
    vi.mocked(getSampleProducts).mockResolvedValue({
      success: true,
      code: 200,
      count: mockProducts.length,
      category_id: 'MLB5672',
      category_name: '汽车配件',
      products: mockProducts
    })
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染Sample组件', () => {
      wrapper = mount(Sample)
      expect(wrapper.exists()).toBe(true)
    })

    it('应该显示banner标题', () => {
      wrapper = mount(Sample)
      const banner = wrapper.find('.banner')
      expect(banner.exists()).toBe(true)
      expect(banner.text()).toContain('0元先试')
    })

    it('应该显示信息栏', () => {
      wrapper = mount(Sample)
      const infoBar = wrapper.find('.info-bar')
      expect(infoBar.exists()).toBe(true)
    })

    it('应该显示导航栏', () => {
      wrapper = mount(Sample)
      const navBar = wrapper.find('.nav-bar')
      expect(navBar.exists()).toBe(true)
    })

    it('应该显示品类下拉框', () => {
      wrapper = mount(Sample)
      const dropdown = wrapper.find('.nav-item.dropdown')
      expect(dropdown.exists()).toBe(true)
      expect(dropdown.text()).toContain('品类')
    })
  })

  describe('数据加载测试', () => {
    it('组件挂载时应该调用getCategories获取品类数据', async () => {
      wrapper = mount(Sample)
      await flushPromises()
      
      expect(getCategories).toHaveBeenCalled()
    })

    it('组件挂载时应该调用getAllSampleProducts获取所有产品', async () => {
      wrapper = mount(Sample)
      await flushPromises()
      
      expect(getAllSampleProducts).toHaveBeenCalled()
    })

    it('应该正确渲染产品列表', async () => {
      wrapper = mount(Sample)
      await flushPromises()
      
      const productCards = wrapper.findAll('.product-card')
      // 由于分页，应该显示最多8个产品（itemsPerPage = 8）
      expect(productCards.length).toBeLessThanOrEqual(8)
    })

    it('当没有产品时应该显示空状态', async () => {
      vi.mocked(getAllSampleProducts).mockResolvedValue({
        success: true,
        code: 200,
        count: 0,
        products: []
      })
      
      wrapper = mount(Sample)
      await flushPromises()
      
      const emptyState = wrapper.find('.empty-state')
      expect(emptyState.exists()).toBe(true)
      expect(emptyState.text()).toContain('暂无产品')
    })
  })

  describe('品类选择测试', () => {
    it('应该能够切换品类下拉框', async () => {
      wrapper = mount(Sample)
      await flushPromises()
      
      const dropdown = wrapper.find('.nav-item.dropdown')
      
      // 初始状态下拉框应该关闭
      let dropdownMenu = wrapper.find('.dropdown-menu')
      expect(dropdownMenu.exists()).toBe(false)
      
      // 点击打开下拉框
      await dropdown.trigger('click')
      await wrapper.vm.$nextTick()
      
      dropdownMenu = wrapper.find('.dropdown-menu')
      expect(dropdownMenu.exists()).toBe(true)
    })

    it('应该显示品类列表', async () => {
      wrapper = mount(Sample)
      await flushPromises()
      
      const dropdown = wrapper.find('.nav-item.dropdown')
      await dropdown.trigger('click')
      await wrapper.vm.$nextTick()
      
      const categoryItems = wrapper.findAll('.dropdown-item')
      // 排除调试信息项
      const validItems = categoryItems.filter(item => 
        !item.classes().includes('debug-info')
      )
      expect(validItems.length).toBeGreaterThan(0)
    })

    it('选择品类后应该调用getSampleProducts', async () => {
      wrapper = mount(Sample)
      await flushPromises()
      
      // 模拟选择品类
      const category = mockCategories[0]
      await wrapper.vm.selectCategory(category)
      await flushPromises()
      
      expect(getSampleProducts).toHaveBeenCalledWith(category.id)
      expect(wrapper.vm.selectedCategory).toEqual(category)
    })

    it('选择品类后应该关闭下拉框', async () => {
      wrapper = mount(Sample)
      await flushPromises()
      
      const category = mockCategories[0]
      await wrapper.vm.selectCategory(category)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.showCategoryDropdown).toBe(false)
    })
  })

  describe('分页功能测试', () => {
    beforeEach(async () => {
      // 创建更多产品用于分页测试
      const manyProducts = Array.from({ length: 20 }, (_, i) => ({
        ...mockProducts[0],
        id: i + 1,
        name: `产品 ${i + 1}`
      }))
      
      vi.mocked(getAllSampleProducts).mockResolvedValue({
        success: true,
        code: 200,
        count: manyProducts.length,
        products: manyProducts
      })
      
      wrapper = mount(Sample)
      await flushPromises()
    })

    it('应该正确计算总页数', () => {
      // 20个产品，每页8个，应该有3页
      expect(wrapper.vm.totalPages).toBe(3)
    })

    it('应该正确显示当前页的产品', () => {
      expect(wrapper.vm.paginatedProducts.length).toBeLessThanOrEqual(8)
    })

    it('应该能够切换到下一页', async () => {
      const initialPage = wrapper.vm.currentPage
      await wrapper.vm.nextPage()
      
      expect(wrapper.vm.currentPage).toBe(initialPage + 1)
    })

    it('应该能够切换到上一页', async () => {
      wrapper.vm.currentPage = 2
      await wrapper.vm.$nextTick()
      
      await wrapper.vm.prevPage()
      expect(wrapper.vm.currentPage).toBe(1)
    })

    it('在第一页时不应该能够切换到上一页', async () => {
      wrapper.vm.currentPage = 1
      await wrapper.vm.$nextTick()
      
      await wrapper.vm.prevPage()
      expect(wrapper.vm.currentPage).toBe(1)
    })

    it('在最后一页时不应该能够切换到下一页', async () => {
      wrapper.vm.currentPage = wrapper.vm.totalPages
      await wrapper.vm.$nextTick()
      
      await wrapper.vm.nextPage()
      expect(wrapper.vm.currentPage).toBe(wrapper.vm.totalPages)
    })

    it('应该能够跳转到指定页面', async () => {
      await wrapper.vm.goToPage(2)
      expect(wrapper.vm.currentPage).toBe(2)
    })

    it('不应该跳转到无效页面', async () => {
      const initialPage = wrapper.vm.currentPage
      await wrapper.vm.goToPage(999)
      expect(wrapper.vm.currentPage).toBe(initialPage)
    })

    it('应该正确生成分页页码数组', () => {
      const pages = wrapper.vm.paginationPages
      expect(Array.isArray(pages)).toBe(true)
      expect(pages.length).toBeGreaterThan(0)
    })
  })

  describe('产品详情弹窗测试', () => {
    beforeEach(async () => {
      wrapper = mount(Sample)
      await flushPromises()
    })

    it('点击立即试用按钮应该打开产品详情弹窗', async () => {
      const productCard = wrapper.find('.product-card')
      const button = productCard.find('.action-btn')
      
      await button.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.showProductDetail).toBe(true)
      expect(wrapper.vm.selectedProductId).toBeDefined()
    })

    it('应该显示产品详情模态框', async () => {
      wrapper.vm.showProductDetail = true
      wrapper.vm.selectedProductId = mockProducts[0].id
      await wrapper.vm.$nextTick()
      
      const modal = wrapper.find('.product-detail-modal')
      expect(modal.exists()).toBe(true)
    })

    it('点击关闭按钮应该关闭产品详情弹窗', async () => {
      wrapper.vm.showProductDetail = true
      wrapper.vm.selectedProductId = mockProducts[0].id
      await wrapper.vm.$nextTick()
      
      await wrapper.vm.closeProductDetail()
      
      expect(wrapper.vm.showProductDetail).toBe(false)
      expect(wrapper.vm.selectedProductId).toBeNull()
    })

    it('点击遮罩层应该关闭产品详情弹窗', async () => {
      wrapper.vm.showProductDetail = true
      wrapper.vm.selectedProductId = mockProducts[0].id
      await wrapper.vm.$nextTick()
      
      const overlay = wrapper.find('.modal-overlay')
      await overlay.trigger('click')
      
      expect(wrapper.vm.showProductDetail).toBe(false)
    })

    it('应该传递正确的props给ProductDetail组件', async () => {
      const productId = mockProducts[0].id
      wrapper.vm.showProductDetail = true
      wrapper.vm.selectedProductId = productId
      await wrapper.vm.$nextTick()
      
      const productDetail = wrapper.findComponent({ name: 'ProductDetail' })
      expect(productDetail.exists()).toBe(true)
      expect(productDetail.props('productId')).toBe(productId)
      expect(productDetail.props('isSample')).toBe(true)
    })
  })

  describe('加载状态测试', () => {
    it('fetchAllProducts函数应该正确设置isLoading状态', async () => {
      // 确保 getAllSampleProducts mock 立即返回
      vi.mocked(getAllSampleProducts).mockResolvedValue({
        success: true,
        code: 200,
        count: 0,
        products: []
      })
      
      wrapper = mount(Sample)
      await flushPromises()
      
      // 手动调用 fetchAllProducts 并等待完成
      await wrapper.vm.fetchAllProducts()
      await flushPromises()
      await wrapper.vm.$nextTick()
      
      // 加载完成后，isLoading应该是false
      expect(wrapper.vm.isLoading).toBe(false)
    })

    it('组件挂载后最终isLoading应该为false', async () => {
      // 确保所有 mock 立即返回结果
      vi.mocked(getAllSampleProducts).mockResolvedValue({
        success: true,
        code: 200,
        count: 0,
        products: []
      })
      
      wrapper = mount(Sample)
      
      // 等待所有异步操作完成
      await flushPromises()
      await wrapper.vm.$nextTick()
      
      // 再等待一轮，确保所有操作完成
      await flushPromises()
      await wrapper.vm.$nextTick()
      
      // 最终，isLoading应该是false
      expect(wrapper.vm.isLoading).toBe(false)
    })
  })

  describe('错误处理测试', () => {
    it('当获取品类失败时应该处理错误', async () => {
      vi.mocked(getCategories).mockRejectedValue(new Error('获取品类失败'))
      
      wrapper = mount(Sample)
      await flushPromises()
      
      // 组件应该仍然能够渲染
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.vm.categories).toEqual([])
    })

    it('当获取产品失败时应该处理错误', async () => {
      vi.mocked(getAllSampleProducts).mockRejectedValue(new Error('获取产品失败'))
      
      wrapper = mount(Sample)
      await flushPromises()
      
      // 组件应该仍然能够渲染
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.vm.allProducts).toEqual([])
    })

    it('当选择品类后获取产品失败时应该处理错误', async () => {
      wrapper = mount(Sample)
      await flushPromises()
      
      vi.mocked(getSampleProducts).mockRejectedValue(new Error('获取产品失败'))
      
      const category = mockCategories[0]
      await wrapper.vm.selectCategory(category)
      await flushPromises()
      
      // 组件应该仍然能够渲染，但产品列表可能为空
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('产品数据映射测试', () => {
    it('应该正确映射API返回的产品数据', async () => {
      const apiProduct = {
        id: 'MLB123456',
        title: '测试产品',
        selling_price: 99.99,
        img: 'https://example.com/image.jpg',
        user_limit_quantity: 1
      }
      
      vi.mocked(getAllSampleProducts).mockResolvedValue({
        success: true,
        code: 200,
        count: 1,
        products: [apiProduct]
      })
      
      wrapper = mount(Sample)
      await flushPromises()
      
      const mappedProduct = wrapper.vm.allProducts[0]
      expect(mappedProduct.id).toBe(apiProduct.id)
      expect(mappedProduct.name).toBe(apiProduct.title)
      expect(mappedProduct.price).toBe(apiProduct.selling_price)
      expect(mappedProduct.image).toBe(apiProduct.img)
      expect(mappedProduct.user_limit_quantity).toBe(apiProduct.user_limit_quantity)
    })
  })
})
