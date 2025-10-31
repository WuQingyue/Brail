import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ProductDetail from '../../src/components/Product/ProductDetail.vue'
import { createPixPaymentIntent, createSampleOrder, checkSamplePurchase, getProductDetail } from '../../src/utils/api.js'
import { useUserStore } from '../../src/stores/user.js'
import mockData from '../fixtures/mock-data.json'

// Mock Stripe
const mockStripe = {
  confirmPixPayment: vi.fn(),
  retrievePaymentIntent: vi.fn()
}

// 模拟window.Stripe - 不要覆盖整个window对象
window.Stripe = vi.fn(() => mockStripe)

// Mock useUserStore
vi.mock('../../src/stores/user.js', () => ({
  useUserStore: () => ({
    getUserId: () => 1,
    isLoggedIn: true,
    user: { 
      user_id: 1, 
      user_name: '测试用户', 
      user_email: 'test@example.com',
      name: '测试用户',
      email: 'test@example.com'
    }
  })
}))

// Mock API functions
vi.mock('../../src/utils/api.js', async () => {
  const actual = await vi.importActual('../../src/utils/api.js')
  return {
    ...actual,
    getProductDetail: vi.fn().mockResolvedValue({
      success: true,
      code: 200,
      product: {
        id: 1,
        name: '测试产品',
        description: '测试产品描述',
        selling_price: 28.90,
        stock_quantity: 100,
        user_limit_quantity: 1,
        variations: []
      }
    }),
    createPixPaymentIntent: vi.fn(),
    createSampleOrder: vi.fn(),
    checkSamplePurchase: vi.fn().mockResolvedValue({
      success: true,
      has_purchased: false
    }),
    addToCart: vi.fn().mockResolvedValue({ success: true })
  }
})

describe('支付功能测试', () => {
  let wrapper

  const { mockUser, mockProduct } = mockData.payTestData

  beforeEach(() => {
    vi.clearAllMocks()
    
    wrapper = mount(ProductDetail, {
      props: {
        productId: 1,
        isSample: true
      }
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  describe('PIX支付弹窗测试', () => {
    it('应该显示PIX支付弹窗', async () => {
      await flushPromises()
      
      // 查找"立即下单"按钮
      const orderButton = wrapper.find('.add-to-cart-btn')
      expect(orderButton.exists()).toBe(true)
      expect(orderButton.text()).toBe('立即下单')
      
      // 点击按钮
      await orderButton.trigger('click')
      await flushPromises()
      
      // 验证弹窗是否显示
      const modalOverlay = wrapper.find('.modal-overlay')
      expect(modalOverlay.exists()).toBe(true)
      expect(wrapper.find('.payment-form').exists()).toBe(true)
    })

    it('应该自动填充用户信息到表单', async () => {
      await flushPromises()
      
      // 点击"立即下单"按钮显示弹窗
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      // 验证表单字段
      const nameInput = wrapper.find('#pix-name')
      const emailInput = wrapper.find('#pix-email')
      
      expect(nameInput.exists()).toBe(true)
      expect(emailInput.exists()).toBe(true)
      
      // 验证自动填充的值
      expect(nameInput.element.value).toBe(mockUser.user_name)
      expect(emailInput.element.value).toBe(mockUser.user_email)
    })

    it('应该显示支付金额', async () => {
      await flushPromises()
      
      // 点击按钮显示弹窗
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      // 验证金额显示
      const amountText = wrapper.find('.payment-amount').text()
      expect(amountText).toContain('R$ 28.90')
    })

    it('应该可以关闭弹窗', async () => {
      await flushPromises()
      
      // 打开弹窗
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      // 验证弹窗显示
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
      
      // 点击关闭按钮
      const closeButton = wrapper.find('.close-btn')
      await closeButton.trigger('click')
      await flushPromises()
      
      // 验证弹窗已关闭
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })
  })

  describe('支付流程测试', () => {
    it('应该成功创建PaymentIntent并显示二维码', async () => {
      await flushPromises()
      
      const { mockPaymentIntent, mockPaymentRequiresAction } = mockData.payTestData
      
      // 模拟API响应
      vi.mocked(createPixPaymentIntent).mockResolvedValue(mockPaymentIntent)
      mockStripe.confirmPixPayment.mockResolvedValue(mockPaymentRequiresAction)
      
      // 打开弹窗并提交表单
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      // 提交表单
      const form = wrapper.find('.payment-form')
      await form.trigger('submit')
      
      // 等待异步操作完成
      await flushPromises()
      
      // 验证API调用
      expect(createPixPaymentIntent).toHaveBeenCalledWith(28.90)
      expect(mockStripe.confirmPixPayment).toHaveBeenCalled()
    })

    it('应该成功处理支付成功状态', async () => {
      await flushPromises()
      
      const { mockPaymentIntent, mockPaymentSuccess, mockCreateOrderSuccess } = mockData.payTestData
      
      // 模拟API响应
      vi.mocked(createPixPaymentIntent).mockResolvedValue(mockPaymentIntent)
      mockStripe.confirmPixPayment.mockResolvedValue(mockPaymentSuccess)
      vi.mocked(createSampleOrder).mockResolvedValue(mockCreateOrderSuccess)
      
      // 打开弹窗并提交表单
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      const form = wrapper.find('.payment-form')
      await form.trigger('submit')
      
      // 等待异步操作
      await flushPromises()
      
      // 验证订单创建
      expect(createSampleOrder).toHaveBeenCalled()
    })

    it('应该正确处理支付失败状态', async () => {
      await flushPromises()
      
      const { mockPaymentIntent, mockPaymentRequiresMethod } = mockData.payTestData
      
      // 模拟API响应
      vi.mocked(createPixPaymentIntent).mockResolvedValue(mockPaymentIntent)
      mockStripe.confirmPixPayment.mockResolvedValue(mockPaymentRequiresMethod)
      
      // 打开弹窗并提交表单
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      const form = wrapper.find('.payment-form')
      await form.trigger('submit')
      
      // 等待异步操作
      await flushPromises()
      
      // 验证错误信息显示
      const errorMessage = wrapper.find('.error-message')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toContain('支付已取消或失败')
    })
  })

  describe('错误处理测试', () => {
    it('应该处理PaymentIntent创建失败', async () => {
      await flushPromises()
      
      const { mockPaymentIntentError } = mockData.payTestData
      
      // 模拟API失败
      vi.mocked(createPixPaymentIntent).mockResolvedValue(mockPaymentIntentError)
      
      // 打开弹窗并提交表单
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      const form = wrapper.find('.payment-form')
      await form.trigger('submit')
      
      await flushPromises()
      
      // 验证错误信息显示
      const errorMessage = wrapper.find('.error-message')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toContain('创建支付意图失败')
    })
  })

  describe('支付轮询测试', () => {
    it('应该成功处理轮询支付成功', async () => {
      vi.useFakeTimers()
      await flushPromises()
      
      const { mockPaymentIntent, mockPaymentRequiresAction, mockPollSucceeded, mockCreateOrderSuccess } = mockData.payTestData
      
      // 模拟API响应
      vi.mocked(createPixPaymentIntent).mockResolvedValue(mockPaymentIntent)
      mockStripe.confirmPixPayment.mockResolvedValue(mockPaymentRequiresAction)
      
      // 第一次轮询返回等待中，第二次返回成功
      mockStripe.retrievePaymentIntent
        .mockResolvedValueOnce(mockPaymentRequiresAction)
        .mockResolvedValueOnce(mockPollSucceeded)
      
      vi.mocked(createSampleOrder).mockResolvedValue(mockCreateOrderSuccess)
      
      // 打开弹窗并提交表单
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      const form = wrapper.find('.payment-form')
      await form.trigger('submit')
      await flushPromises()
      
      // 验证二维码显示
      expect(wrapper.find('.qr-code-image').exists()).toBe(true)
      
      // 推进1秒，触发第一次轮询
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()
      
      // 推进1秒，触发第二次轮询（支付成功）
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()
      
      // 验证订单创建
      expect(createSampleOrder).toHaveBeenCalled()
      expect(mockStripe.retrievePaymentIntent).toHaveBeenCalledTimes(2)
      
      vi.useRealTimers()
    })

    it('应该正确处理轮询支付失败', async () => {
      vi.useFakeTimers()
      await flushPromises()
      
      const { mockPaymentIntent, mockPaymentRequiresAction, mockPollRequiresMethod } = mockData.payTestData
      
      // 模拟API响应
      vi.mocked(createPixPaymentIntent).mockResolvedValue(mockPaymentIntent)
      mockStripe.confirmPixPayment.mockResolvedValue(mockPaymentRequiresAction)
      
      // 第一次轮询返回等待中，第二次返回失败
      mockStripe.retrievePaymentIntent
        .mockResolvedValueOnce(mockPaymentRequiresAction)
        .mockResolvedValueOnce(mockPollRequiresMethod)
      
      // 打开弹窗并提交表单
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      const form = wrapper.find('.payment-form')
      await form.trigger('submit')
      await flushPromises()
      
      // 推进1秒，触发第一次轮询
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()
      
      // 推进1秒，触发第二次轮询（支付失败）
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()
      
      // 验证错误信息显示
      const errorMessage = wrapper.find('.error-message')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toContain('支付已取消或失败')
      
      vi.useRealTimers()
    })

    it('应该处理轮询超时', async () => {
      vi.useFakeTimers()
      await flushPromises()
      
      const { mockPaymentIntent, mockPaymentRequiresAction, mockPollRequiresAction } = mockData.payTestData
      
      // 模拟API响应
      vi.mocked(createPixPaymentIntent).mockResolvedValue(mockPaymentIntent)
      mockStripe.confirmPixPayment.mockResolvedValue(mockPaymentRequiresAction)
      
      // 所有轮询都返回等待中（模拟120次）
      mockStripe.retrievePaymentIntent.mockResolvedValue(mockPollRequiresAction)
      
      // 打开弹窗并提交表单
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      const form = wrapper.find('.payment-form')
      await form.trigger('submit')
      await flushPromises()
      
      // 推进120秒（超过最大尝试次数）
      await vi.advanceTimersByTimeAsync(120000)
      await flushPromises()
      
      // 验证超时错误
      const errorMessage = wrapper.find('.error-message')
      expect(errorMessage.exists()).toBe(true)
      expect(errorMessage.text()).toContain('支付超时')
      
      vi.useRealTimers()
    })

    it('应该处理轮询网络错误', async () => {
      vi.useFakeTimers()
      await flushPromises()
      
      const { mockPaymentIntent, mockPaymentRequiresAction, mockPollError } = mockData.payTestData
      
      // 模拟API响应
      vi.mocked(createPixPaymentIntent).mockResolvedValue(mockPaymentIntent)
      mockStripe.confirmPixPayment.mockResolvedValue(mockPaymentRequiresAction)
      
      // 轮询返回错误
      mockStripe.retrievePaymentIntent.mockResolvedValue(mockPollError)
      
      // 打开弹窗并提交表单
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      const form = wrapper.find('.payment-form')
      await form.trigger('submit')
      await flushPromises()
      
      // 推进1秒，触发第一次轮询
      await vi.advanceTimersByTimeAsync(1000)
      await flushPromises()
      
      // 验证轮询被中断，没有继续
      expect(mockStripe.retrievePaymentIntent).toHaveBeenCalledTimes(1)
      
      vi.useRealTimers()
    })
  })

  describe('UI交互测试', () => {
    it('应该显示正确的表单字段', async () => {
      await flushPromises()
      
      const { mockTaxId } = mockData.payTestData
      
      // 打开弹窗
      const orderButton = wrapper.find('.add-to-cart-btn')
      await orderButton.trigger('click')
      await flushPromises()
      
      // 验证所有字段存在
      expect(wrapper.find('#pix-name').exists()).toBe(true)
      expect(wrapper.find('#pix-email').exists()).toBe(true)
      expect(wrapper.find('#pix-tax-id').exists()).toBe(true)
      
      // 验证税号默认值
      const taxInput = wrapper.find('#pix-tax-id')
      expect(taxInput.element.value).toBe(mockTaxId)
    })

    it('应该处理已购买状态', async () => {
      await flushPromises()
      
      // 模拟已购买状态
      wrapper.vm.hasPurchased = true
      await wrapper.vm.$nextTick()
      
      const orderButton = wrapper.find('.add-to-cart-btn')
      
      // 验证按钮被禁用
      expect(orderButton.attributes('disabled')).toBeDefined()
      expect(orderButton.classes('disabled')).toBe(true)
    })
  })
})

