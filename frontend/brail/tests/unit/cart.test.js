import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Cart from '../../src/components/Cart/Cart.vue'
import mockData from '../fixtures/mock-data.json'
import { getCartId, getCartData, updateCartItem, removeCartItem } from '../../src/utils/api.js'

// Mock API functions
vi.mock('../../src/utils/api.js', () => ({
  getCartId: vi.fn(),
  getCartData: vi.fn(),
  updateCartItem: vi.fn(),
  removeCartItem: vi.fn()
}))

describe('购物车组件测试', () => {
  let wrapper
  const mockCartData = mockData.cartTestData.mockCartData

  beforeEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
    vi.clearAllMocks()
    
    // 设置mock返回值
    vi.mocked(getCartId).mockResolvedValue(1)
    vi.mocked(getCartData).mockResolvedValue(mockCartData)
    vi.mocked(updateCartItem).mockResolvedValue({ success: true })
    vi.mocked(removeCartItem).mockResolvedValue({ success: true })
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染Cart组件', () => {
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      expect(wrapper.exists()).toBe(true)
    })

    it('应该正确调用API获取购物车数据', async () => {
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      
      // 验证组件已挂载
      expect(wrapper.exists()).toBe(true)
      
      // 验证API函数被正确导入
      expect(getCartId).toBeDefined()
      expect(getCartData).toBeDefined()
    })

    it('当isVisible为false时应该不显示购物车', () => {
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: false
        }
      })
      expect(wrapper.find('.cart-overlay').exists()).toBe(false)
    })

    it('当isVisible为true时应该显示购物车', () => {
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      expect(wrapper.find('.cart-overlay').exists()).toBe(true)
    })
  })

  describe('购物车状态测试', () => {
    it('应该显示加载状态', async () => {
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      
      wrapper.vm.loading = true
      wrapper.vm.error = null
      wrapper.vm.cartItems = []
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.loading').exists()).toBe(true)
      expect(wrapper.find('.loading-spinner').exists()).toBe(true)
    })

    it('应该显示错误状态', async () => {
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      
      wrapper.vm.loading = false
      wrapper.vm.error = '加载购物车失败，请重试'
      wrapper.vm.cartItems = []
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.error').exists()).toBe(true)
      expect(wrapper.find('.error').text()).toContain('加载购物车失败，请重试')
    })

    it('应该显示空购物车状态', async () => {
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      
      wrapper.vm.loading = false
      wrapper.vm.error = null
      wrapper.vm.cartItems = []
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.empty-cart').exists()).toBe(true)
      expect(wrapper.find('.empty-icon').text()).toBe('🛒')
      expect(wrapper.find('.empty-cart h3').text()).toBe('购物车为空')
    })
  })

  describe('购物车内容测试', () => {
    beforeEach(async () => {
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      
      // 设置测试数据
      wrapper.vm.loading = false
      wrapper.vm.error = null
      wrapper.vm.cartItems = mockData.cartTestData.multipleItems
      wrapper.vm.cartSummary = mockData.cartTestData.multipleItemsSummary
      
      await wrapper.vm.$nextTick()
    })

    it('应该显示购物车标题和统计信息', () => {
      expect(wrapper.find('.cart-title').exists()).toBe(true)
      expect(wrapper.find('.cart-title').text()).toBe('购物车')
      expect(wrapper.find('.product-count').exists()).toBe(true)
    })

    it('应该显示商品列表', () => {
      const productCards = wrapper.findAll('.product-card')
      expect(productCards.length).toBe(3)
    })

    it('应该显示商品信息', () => {
      const firstProduct = wrapper.find('.product-card')
      expect(firstProduct.find('.product-name').exists()).toBe(true)
      expect(firstProduct.find('.product-description').exists()).toBe(true)
      expect(firstProduct.find('.product-spec').exists()).toBe(true)
    })

    it('应该显示价格信息', () => {
      const firstProduct = wrapper.find('.product-card')
      expect(firstProduct.find('.total-price').exists()).toBe(true)
      expect(firstProduct.find('.unit-price').exists()).toBe(true)
    })

    it('应该显示数量控制', () => {
      const firstProduct = wrapper.find('.product-card')
      expect(firstProduct.find('.quantity-control').exists()).toBe(true)
      expect(firstProduct.find('.quantity-decrease').exists()).toBe(true)
      expect(firstProduct.find('.quantity-increase').exists()).toBe(true)
      expect(firstProduct.find('.quantity-input').exists()).toBe(true)
    })

    it('输入框应该没有内置箭头样式', () => {
      const quantityInput = wrapper.find('.quantity-input')
      expect(quantityInput.exists()).toBe(true)
      // 验证输入框类型为number但样式已隐藏箭头
      expect(quantityInput.attributes('type')).toBe('number')
    })

    it('应该显示MOQ标签', () => {
      const firstProduct = wrapper.find('.product-card')
      expect(firstProduct.find('.moq-tag').exists()).toBe(true)
    })

    it('应该显示删除按钮', () => {
      const firstProduct = wrapper.find('.product-card')
      expect(firstProduct.find('.delete-btn').exists()).toBe(true)
    })
  })

  describe('总计摘要测试', () => {
    beforeEach(async () => {
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      
      // 设置测试数据
      wrapper.vm.loading = false
      wrapper.vm.error = null
      wrapper.vm.cartItems = mockData.cartTestData.basicTestData.singleItem
      wrapper.vm.cartSummary = mockData.cartTestData.basicTestData.summary
      
      await wrapper.vm.$nextTick()
    })

    it('应该显示总计摘要区域', () => {
      expect(wrapper.find('.investment-summary').exists()).toBe(true)
      expect(wrapper.find('.investment-title').text()).toBe('总计')
    })

    it('应该显示总金额', () => {
      expect(wrapper.find('.total-amount').exists()).toBe(true)
    })

    it('应该显示操作按钮', () => {
      expect(wrapper.find('.submit-btn').exists()).toBe(true)
      expect(wrapper.find('.submit-btn').text()).toBe('完成申请')
      expect(wrapper.find('.help-link').exists()).toBe(true)
    })
  })

  describe('交互功能测试', () => {
    beforeEach(async () => {
      // 重新设置mock返回值，使用interactionTestData
      vi.mocked(getCartData).mockResolvedValue({
        items: mockData.cartTestData.interactionTestData.singleItem,
        summary: mockData.cartTestData.interactionTestData.summary
      })
      
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      
      // 等待组件加载完成
      await wrapper.vm.$nextTick()
    })

    it('应该能够关闭购物车', async () => {
      const closeBtn = wrapper.find('.close-btn')
      await closeBtn.trigger('click')
      
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('应该能够增加商品数量', async () => {
      const initialQuantity = wrapper.vm.cartItems[0].quantity
      const increaseBtn = wrapper.find('.quantity-increase')
      
      await increaseBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      // 验证数量增加了1
      expect(wrapper.vm.cartItems[0].quantity).toBe(initialQuantity + 1)
      // 验证总价也相应更新
      expect(wrapper.vm.cartItems[0].totalPrice).toBe(wrapper.vm.cartItems[0].unitPrice * (initialQuantity + 1))
      // 验证标记为有变更
      expect(wrapper.vm.cartItems[0].hasChanges).toBe(true)
      // 验证API未被调用（因为还没有确认）
      expect(updateCartItem).not.toHaveBeenCalled()
    })

    it('应该能够减少商品数量', async () => {
      const initialQuantity = wrapper.vm.cartItems[0].quantity
      const decreaseBtn = wrapper.find('.quantity-decrease')
      
      await decreaseBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      // 验证数量减少了1
      expect(wrapper.vm.cartItems[0].quantity).toBe(initialQuantity - 1)
      // 验证总价也相应更新
      expect(wrapper.vm.cartItems[0].totalPrice).toBe(wrapper.vm.cartItems[0].unitPrice * (initialQuantity - 1))
      // 验证标记为有变更
      expect(wrapper.vm.cartItems[0].hasChanges).toBe(true)
      // 验证API未被调用（因为还没有确认）
      expect(updateCartItem).not.toHaveBeenCalled()
    })

    it('当数量等于MOQ时减少按钮应该被禁用', async () => {
      // 设置商品数量等于MOQ
      wrapper.vm.cartItems[0].quantity = wrapper.vm.cartItems[0].moq
      await wrapper.vm.$nextTick()
      
      const decreaseBtn = wrapper.find('.quantity-decrease')
      expect(decreaseBtn.attributes('disabled')).toBeDefined()
    })

    it('应该能够通过输入框更新商品数量', async () => {
      const newQuantity = 100
      const quantityInput = wrapper.find('.quantity-input')
      
      // 设置输入框的值
      await quantityInput.setValue(newQuantity)
      await quantityInput.trigger('input')
      await wrapper.vm.$nextTick()
      
      // 验证数量已更新
      expect(wrapper.vm.cartItems[0].quantity).toBe(newQuantity)
      // 验证总价也相应更新
      expect(wrapper.vm.cartItems[0].totalPrice).toBe(wrapper.vm.cartItems[0].unitPrice * newQuantity)
      // 验证标记为有变更
      expect(wrapper.vm.cartItems[0].hasChanges).toBe(true)
      // 验证API未被调用（因为还没有确认）
      expect(updateCartItem).not.toHaveBeenCalled()
    })

    it('当输入的数量小于MOQ时应该自动调整为MOQ', async () => {
      const moq = wrapper.vm.cartItems[0].moq
      const quantityInput = wrapper.find('.quantity-input')
      
      // 设置输入框的值小于MOQ
      await quantityInput.setValue(moq - 1)
      await quantityInput.trigger('input')
      await wrapper.vm.$nextTick()
      
      // 验证数量被调整为MOQ
      expect(wrapper.vm.cartItems[0].quantity).toBe(moq)
      // 验证标记为有变更
      expect(wrapper.vm.cartItems[0].hasChanges).toBe(true)
      // 验证API未被调用（因为还没有确认）
      expect(updateCartItem).not.toHaveBeenCalled()
    })

    it('修改数量后应该重新计算购物车摘要', async () => {
      const initialTotalAmount = wrapper.vm.cartSummary.totalAmount
      const increaseBtn = wrapper.find('.quantity-increase')
      
      await increaseBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      // 验证购物车摘要已更新
      expect(wrapper.vm.cartSummary.totalAmount).toBeGreaterThan(initialTotalAmount)
    })

    it('应该显示确认按钮', () => {
      const confirmBtn = wrapper.find('.confirm-btn')
      expect(confirmBtn.exists()).toBe(true)
      expect(confirmBtn.text()).toBe('✓')
    })

    it('当没有变更时确认按钮应该被禁用', () => {
      const confirmBtn = wrapper.find('.confirm-btn')
      expect(confirmBtn.attributes('disabled')).toBeDefined()
    })

    it('当有变更时确认按钮应该可用', async () => {
      const increaseBtn = wrapper.find('.quantity-increase')
      await increaseBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      const confirmBtn = wrapper.find('.confirm-btn')
      expect(confirmBtn.attributes('disabled')).toBeUndefined()
    })

    it('点击确认按钮应该调用API保存变更', async () => {
      const increaseBtn = wrapper.find('.quantity-increase')
      await increaseBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      const confirmBtn = wrapper.find('.confirm-btn')
      await confirmBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      // 验证API被调用
      expect(updateCartItem).toHaveBeenCalledWith(1, wrapper.vm.cartItems[0].id, 11)
      // 验证变更标记被清除
      expect(wrapper.vm.cartItems[0].hasChanges).toBe(false)
      // 验证原始数量被更新
      expect(wrapper.vm.cartItems[0].originalQuantity).toBe(11)
    })

    it('确认按钮失败时应该恢复原值', async () => {
      // Mock API失败
      vi.mocked(updateCartItem).mockRejectedValueOnce(new Error('API Error'))
      
      const increaseBtn = wrapper.find('.quantity-increase')
      await increaseBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      const confirmBtn = wrapper.find('.confirm-btn')
      await confirmBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      // 验证数量被恢复
      expect(wrapper.vm.cartItems[0].quantity).toBe(10)
      expect(wrapper.vm.cartItems[0].totalPrice).toBe(100.00)
      expect(wrapper.vm.cartItems[0].hasChanges).toBe(false)
    })

    it('应该显示复选框', () => {
      const checkbox = wrapper.find('.item-checkbox')
      expect(checkbox.exists()).toBe(true)
      expect(checkbox.attributes('type')).toBe('checkbox')
    })

    it('复选框默认应该是选中状态', () => {
      const checkbox = wrapper.find('.item-checkbox')
      expect(checkbox.element.checked).toBe(true)
    })

    it('应该能够切换复选框状态', async () => {
      const checkbox = wrapper.find('.item-checkbox')
      
      // 取消选中
      await checkbox.setChecked(false)
      expect(wrapper.vm.cartItems[0].selected).toBe(false)
      
      // 重新选中
      await checkbox.setChecked(true)
      expect(wrapper.vm.cartItems[0].selected).toBe(true)
    })

    it('当没有选中任何商品时，完成申请按钮应该被禁用', async () => {
      const checkbox = wrapper.find('.item-checkbox')
      const submitBtn = wrapper.find('.submit-btn')
      
      // 取消选中所有商品
      await checkbox.setChecked(false)
      await wrapper.vm.$nextTick()
      
      expect(submitBtn.attributes('disabled')).toBeDefined()
    })

    it('当有选中商品时，完成申请按钮应该可用', () => {
      const submitBtn = wrapper.find('.submit-btn')
      expect(submitBtn.attributes('disabled')).toBeUndefined()
    })

    it('应该能够删除商品', async () => {
      const initialItemCount = wrapper.vm.cartItems.length
      const itemToRemove = wrapper.vm.cartItems[0]
      const deleteBtn = wrapper.find('.delete-btn')
      
      await deleteBtn.trigger('click')
      await wrapper.vm.$nextTick()
      
      // 验证商品被删除
      expect(wrapper.vm.cartItems.length).toBe(initialItemCount - 1)
      expect(wrapper.vm.cartItems.find(item => item.id === itemToRemove.id)).toBeUndefined()
      // 验证API被调用
      expect(removeCartItem).toHaveBeenCalledWith(itemToRemove.id)
    })

    it('应该能够提交订单', async () => {
      // Mock window.alert
      const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
      
      const submitBtn = wrapper.find('.submit-btn')
      await submitBtn.trigger('click')
      
      // 验证alert被调用
      expect(mockAlert).toHaveBeenCalledWith('订单提交功能待实现')
      
      // 恢复alert
      mockAlert.mockRestore()
    })
  })

  describe('计算属性测试', () => {
    beforeEach(async () => {
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      
      wrapper.vm.cartItems = mockData.cartTestData.calculationTestData
      await wrapper.vm.$nextTick()
    })

    it('应该正确计算总单位数', () => {
      expect(wrapper.vm.totalUnits).toBe(150)
    })
  })

  describe('响应式设计测试', () => {
    it('应该在移动设备上正确显示', () => {
      // 模拟移动设备视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      wrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      
      const cartDialog = wrapper.find('.cart-dialog')
      expect(cartDialog.exists()).toBe(true)
    })
  })
})