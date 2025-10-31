import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ProductDetail from '../../src/components/Product/ProductDetail.vue'
import Cart from '../../src/components/Cart/Cart.vue'
import { createPixPaymentIntent, createSampleOrder, checkSamplePurchase, getProductDetail, getCartId, getCartData, createOrder } from '../../src/utils/api.js'
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
    },
    setUser: vi.fn(),
    clearUser: vi.fn(),
    initUserFromStorage: vi.fn()
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
    addToCart: vi.fn().mockResolvedValue({ success: true }),
    getCartId: vi.fn().mockResolvedValue(1),
    getCartData: vi.fn().mockResolvedValue({
      items: [
        {
          id: 1,
          product_id: 1,
          name: '测试产品',
          description: '测试产品描述',
          image: 'https://example.com/test.jpg',
          quantity: 2,
          unitPrice: 28.90,
          totalPrice: 57.80,
          moq: 1,
          specification: '标准版本',
          selected: true
        }
      ],
      summary: {
        totalAmount: 57.80
      }
    }),
    createOrder: vi.fn().mockResolvedValue({
      success: true,
      order_id: 'ORD-12345678',
      message: '订单创建成功'
    })
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

  describe('购物车银行票据上传测试', () => {
    let cartWrapper
    const { mockCartData } = mockData.payTestData.cartReceiptUploadTestData

    beforeEach(async () => {
      vi.clearAllMocks()
      vi.mocked(getCartId).mockResolvedValue(1)
      vi.mocked(getCartData).mockResolvedValue(mockCartData)
      
      cartWrapper = mount(Cart, {
        props: {
          userId: 1,
          isVisible: true
        }
      })
      
      // 等待组件加载
      await flushPromises()
      
      // 设置购物车数据
      cartWrapper.vm.loading = false
      cartWrapper.vm.error = null
      cartWrapper.vm.cartItems = mockCartData.items.map(item => ({
        ...item,
        originalQuantity: item.quantity,
        hasChanges: false,
        selected: true
      }))
      cartWrapper.vm.cartSummary = mockCartData.summary
      
      await cartWrapper.vm.$nextTick()
    })

    afterEach(() => {
      if (cartWrapper) {
        cartWrapper.unmount()
      }
    })

    describe('订单确认模态框测试', () => {
      it('点击完成申请应该显示订单确认模态框', async () => {
        const submitButton = cartWrapper.find('.submit-btn')
        expect(submitButton.exists()).toBe(true)
        
        await submitButton.trigger('click')
        await flushPromises()
        
        const modal = cartWrapper.find('.order-confirm-modal')
        expect(modal.exists()).toBe(true)
        expect(cartWrapper.find('.modal-title').text()).toBe('订单确认与票据上传')
      })

      it('模态框应该显示正确的说明文字', async () => {
        const submitButton = cartWrapper.find('.submit-btn')
        await submitButton.trigger('click')
        await flushPromises()
        
        const instruction = cartWrapper.find('.modal-instruction p')
        expect(instruction.exists()).toBe(true)
        expect(instruction.text()).toBe('请上传您的银行付款票据以完成订单。')
      })

      it('应该可以关闭模态框', async () => {
        const submitButton = cartWrapper.find('.submit-btn')
        await submitButton.trigger('click')
        await flushPromises()
        
        expect(cartWrapper.find('.order-confirm-modal').exists()).toBe(true)
        
        const closeButton = cartWrapper.find('.modal-close-btn')
        await closeButton.trigger('click')
        await flushPromises()
        
        expect(cartWrapper.find('.order-confirm-modal').exists()).toBe(false)
      })

      it('点击取消按钮应该关闭模态框', async () => {
        const submitButton = cartWrapper.find('.submit-btn')
        await submitButton.trigger('click')
        await flushPromises()
        
        const cancelButton = cartWrapper.find('.btn-cancel')
        await cancelButton.trigger('click')
        await flushPromises()
        
        expect(cartWrapper.find('.order-confirm-modal').exists()).toBe(false)
      })
    })

    describe('文件上传测试', () => {
      beforeEach(async () => {
        const submitButton = cartWrapper.find('.submit-btn')
        await submitButton.trigger('click')
        await flushPromises()
      })

      it('应该显示上传区域', () => {
        const uploadArea = cartWrapper.find('.upload-area')
        expect(uploadArea.exists()).toBe(true)
      })

      it('应该显示上传要求说明', () => {
        const requirements = cartWrapper.find('.upload-requirements')
        expect(requirements.exists()).toBe(true)
        
        const listItems = cartWrapper.findAll('.upload-requirements li')
        expect(listItems.length).toBe(3)
      })

      it('点击上传区域应该触发文件选择', async () => {
        const uploadArea = cartWrapper.find('.upload-area')
        const fileInput = cartWrapper.find('input[type="file"]')
        
        // Mock文件输入
        const mockFile = new File(['test content'], 'test-receipt.jpg', { type: 'image/jpeg' })
        const mockFileList = {
          0: mockFile,
          length: 1,
          item: (index) => index === 0 ? mockFile : null
        }
        
        // 创建事件对象
        const mockEvent = {
          target: {
            files: mockFileList
          }
        }
        
        // 模拟文件选择
        await cartWrapper.vm.handleFileSelect(mockEvent)
        await flushPromises()
        
        expect(cartWrapper.vm.uploadedFile).toBeDefined()
        expect(cartWrapper.vm.uploadedFile.name).toBe('test-receipt.jpg')
      })

      it('应该支持拖拽上传', async () => {
        const uploadArea = cartWrapper.find('.upload-area')
        const mockFile = new File(['test content'], 'test-receipt.pdf', { type: 'application/pdf' })
        
        const mockEvent = {
          preventDefault: vi.fn(),
          dataTransfer: {
            files: [mockFile]
          }
        }
        
        await cartWrapper.vm.handleDrop(mockEvent)
        await flushPromises()
        
        expect(cartWrapper.vm.uploadedFile).toBeDefined()
        expect(cartWrapper.vm.uploadedFile.name).toBe('test-receipt.pdf')
      })

      it('上传文件后应该显示文件信息', async () => {
        const mockFile = new File(['test content'], 'receipt.png', { type: 'image/png' })
        cartWrapper.vm.uploadedFile = mockFile
        await cartWrapper.vm.$nextTick()
        
        const uploadedFileDiv = cartWrapper.find('.uploaded-file')
        expect(uploadedFileDiv.exists()).toBe(true)
        
        const fileName = cartWrapper.find('.file-name')
        expect(fileName.exists()).toBe(true)
        expect(fileName.text()).toBe('receipt.png')
      })

      it('应该可以删除已上传的文件', async () => {
        const mockFile = new File(['test content'], 'receipt.jpg', { type: 'image/jpeg' })
        cartWrapper.vm.uploadedFile = mockFile
        await cartWrapper.vm.$nextTick()
        
        const removeButton = cartWrapper.find('.remove-file-btn')
        await removeButton.trigger('click')
        await flushPromises()
        
        expect(cartWrapper.vm.uploadedFile).toBeNull()
      })
    })

    describe('文件验证测试', () => {
      beforeEach(async () => {
        const submitButton = cartWrapper.find('.submit-btn')
        await submitButton.trigger('click')
        await flushPromises()
      })

      it('应该接受JPG格式的文件', async () => {
        const mockFile = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })
        const mockEvent = { target: { files: [mockFile] } }
        
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
        
        await cartWrapper.vm.handleFileSelect(mockEvent)
        await flushPromises()
        
        expect(cartWrapper.vm.uploadedFile).toBeDefined()
        expect(mockAlert).not.toHaveBeenCalled()
        
        mockAlert.mockRestore()
      })

      it('应该接受PNG格式的文件', async () => {
        const mockFile = new File(['test'], 'receipt.png', { type: 'image/png' })
        const mockEvent = { target: { files: [mockFile] } }
        
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
        
        await cartWrapper.vm.handleFileSelect(mockEvent)
        await flushPromises()
        
        expect(cartWrapper.vm.uploadedFile).toBeDefined()
        expect(mockAlert).not.toHaveBeenCalled()
        
        mockAlert.mockRestore()
      })

      it('应该接受PDF格式的文件', async () => {
        const mockFile = new File(['test'], 'receipt.pdf', { type: 'application/pdf' })
        const mockEvent = { target: { files: [mockFile] } }
        
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
        
        await cartWrapper.vm.handleFileSelect(mockEvent)
        await flushPromises()
        
        expect(cartWrapper.vm.uploadedFile).toBeDefined()
        expect(mockAlert).not.toHaveBeenCalled()
        
        mockAlert.mockRestore()
      })

      it('应该拒绝不支持的文件格式', async () => {
        const mockFile = new File(['test'], 'receipt.txt', { type: 'text/plain' })
        const mockEvent = { target: { files: [mockFile] } }
        
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
        
        await cartWrapper.vm.handleFileSelect(mockEvent)
        await flushPromises()
        
        expect(cartWrapper.vm.uploadedFile).toBeNull()
        expect(mockAlert).toHaveBeenCalledWith('不支持的文件格式。请上传 JPG, PNG 或 PDF 格式的文件。')
        
        mockAlert.mockRestore()
      })

      it('应该拒绝超过5MB的文件', async () => {
        // 创建6MB的文件
        const largeContent = new Array(6 * 1024 * 1024).fill('a').join('')
        const mockFile = new File([largeContent], 'large-receipt.jpg', { type: 'image/jpeg' })
        const mockEvent = { target: { files: [mockFile] } }
        
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
        
        await cartWrapper.vm.handleFileSelect(mockEvent)
        await flushPromises()
        
        expect(cartWrapper.vm.uploadedFile).toBeNull()
        expect(mockAlert).toHaveBeenCalledWith('文件大小不能超过 5MB。')
        
        mockAlert.mockRestore()
      })

      it('应该接受小于5MB的文件', async () => {
        // 创建1MB的文件
        const content = new Array(1024 * 1024).fill('a').join('')
        const mockFile = new File([content], 'receipt.jpg', { type: 'image/jpeg' })
        const mockEvent = { target: { files: [mockFile] } }
        
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
        
        await cartWrapper.vm.handleFileSelect(mockEvent)
        await flushPromises()
        
        expect(cartWrapper.vm.uploadedFile).toBeDefined()
        expect(mockAlert).not.toHaveBeenCalled()
        
        mockAlert.mockRestore()
      })
    })

    describe('确认下单测试', () => {
      beforeEach(async () => {
        const submitButton = cartWrapper.find('.submit-btn')
        await submitButton.trigger('click')
        await flushPromises()
      })

      it('未上传文件时确认按钮应该被禁用', () => {
        const confirmButton = cartWrapper.find('.btn-confirm')
        expect(confirmButton.exists()).toBe(true)
        expect(confirmButton.attributes('disabled')).toBeDefined()
      })

      it('上传文件后确认按钮应该可用', async () => {
        const mockFile = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })
        cartWrapper.vm.uploadedFile = mockFile
        await cartWrapper.vm.$nextTick()
        
        const confirmButton = cartWrapper.find('.btn-confirm')
        expect(confirmButton.attributes('disabled')).toBeUndefined()
      })

      it('未上传文件时点击确认按钮应该提示', async () => {
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
        
        await cartWrapper.vm.confirmOrder()
        await flushPromises()
        
        expect(mockAlert).toHaveBeenCalledWith('请先上传银行付款票据')
        expect(createOrder).not.toHaveBeenCalled()
        
        mockAlert.mockRestore()
      })

      it('上传文件并确认应该创建订单', async () => {
        const mockFile = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })
        cartWrapper.vm.uploadedFile = mockFile
        cartWrapper.vm.pendingOrderData = mockData.payTestData.cartReceiptUploadTestData.mockOrderData
        
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
        
        await cartWrapper.vm.confirmOrder()
        await flushPromises()
        
        expect(createOrder).toHaveBeenCalled()
        const orderCall = vi.mocked(createOrder).mock.calls[0][0]
        expect(orderCall.payment_receipt_file).toBe('receipt.jpg')
        expect(orderCall.notes).toContain('付款票据')
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('订单创建成功'))
        
        mockAlert.mockRestore()
      })

      it('订单创建成功后应该关闭模态框', async () => {
        const mockFile = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })
        cartWrapper.vm.uploadedFile = mockFile
        cartWrapper.vm.pendingOrderData = mockData.payTestData.cartReceiptUploadTestData.mockOrderDataMinimal
        cartWrapper.vm.showOrderConfirmModal = true
        
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
        
        await cartWrapper.vm.confirmOrder()
        await flushPromises()
        
        expect(cartWrapper.vm.showOrderConfirmModal).toBe(false)
        expect(cartWrapper.vm.uploadedFile).toBeNull()
        
        mockAlert.mockRestore()
      })

      it('订单创建失败应该显示错误信息', async () => {
        vi.mocked(createOrder).mockResolvedValueOnce({
          success: false,
          message: '订单创建失败'
        })
        
        const mockFile = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })
        cartWrapper.vm.uploadedFile = mockFile
        cartWrapper.vm.pendingOrderData = mockData.payTestData.cartReceiptUploadTestData.mockOrderDataMinimal
        
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
        
        await cartWrapper.vm.confirmOrder()
        await flushPromises()
        
        // 当API返回失败且有message时，应该显示response.message
        expect(mockAlert).toHaveBeenCalledWith('订单创建失败')
        
        mockAlert.mockRestore()
      })

      it('订单创建失败但没有message时应该显示默认错误信息', async () => {
        vi.mocked(createOrder).mockResolvedValueOnce({
          success: false
        })
        
        const mockFile = new File(['test'], 'receipt.jpg', { type: 'image/jpeg' })
        cartWrapper.vm.uploadedFile = mockFile
        cartWrapper.vm.pendingOrderData = mockData.payTestData.cartReceiptUploadTestData.mockOrderDataMinimal
        
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {})
        
        await cartWrapper.vm.confirmOrder()
        await flushPromises()
        
        // 当API返回失败且没有message时，应该显示默认消息
        expect(mockAlert).toHaveBeenCalledWith('订单提交失败，请重试')
        
        mockAlert.mockRestore()
      })
    })

    describe('文件图标显示测试', () => {
      it('JPG文件应该显示图片图标', () => {
        const icon = cartWrapper.vm.getFileIcon('receipt.jpg')
        expect(icon).toBe('🖼️')
      })

      it('PNG文件应该显示图片图标', () => {
        const icon = cartWrapper.vm.getFileIcon('receipt.png')
        expect(icon).toBe('🖼️')
      })

      it('PDF文件应该显示文档图标', () => {
        const icon = cartWrapper.vm.getFileIcon('receipt.pdf')
        expect(icon).toBe('📄')
      })

      it('未知格式应该显示默认图标', () => {
        const icon = cartWrapper.vm.getFileIcon('receipt.unknown')
        expect(icon).toBe('📎')
      })
    })

    describe('文件大小格式化测试', () => {
      it('应该正确格式化字节数', () => {
        expect(cartWrapper.vm.formatFileSize(0)).toBe('0 Bytes')
        expect(cartWrapper.vm.formatFileSize(1024)).toContain('KB')
        expect(cartWrapper.vm.formatFileSize(1024 * 1024)).toContain('MB')
      })
    })
  })
})

