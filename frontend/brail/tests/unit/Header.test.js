import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Header from '@/components/Layout/Header.vue'
import mockData from '../fixtures/mock-data.json'
import { loginUser, registerUser, handleApiError } from '@/utils/api.js'

// Mock API functions
vi.mock('@/utils/api.js', () => ({
  loginUser: vi.fn(),
  registerUser: vi.fn(),
  handleApiError: vi.fn()
}))

describe('Header.vue 注册功能单元测试', () => {
  let wrapper

  beforeEach(() => {
    // 为每个测试创建新的 Pinia 实例
    setActivePinia(createPinia())
    
    wrapper = mount(Header, {
      global: {
        plugins: [createPinia()]
      }
    })
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染Header组件', () => {
      expect(wrapper.find('.header').exists()).toBe(true)
      expect(wrapper.find('.logo').exists()).toBe(true)
      expect(wrapper.find('.nav').exists()).toBe(true)
      expect(wrapper.find('.user-actions').exists()).toBe(true)
    })

    it('应该显示购物车图标', () => {
      expect(wrapper.find('.cart-btn').exists()).toBe(true)
      expect(wrapper.find('.cart-icon').exists()).toBe(true)
      expect(wrapper.find('.cart-icon').text()).toBe('🛒')
    })

    it('应该显示注册和登录按钮', () => {
      const buttons = wrapper.findAll('button')
      const buttonTexts = buttons.map(btn => btn.text())
      
      expect(buttonTexts).toContain('注册')
      expect(buttonTexts).toContain('登录')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('点击注册按钮应该打开注册模态框', async () => {
      const registerBtn = wrapper.findAll('button').find(btn => btn.text().includes('注册'))
      await registerBtn.trigger('click')
      
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
      expect(wrapper.find('.register-form').exists()).toBe(true)
    })
  })

  describe('注册表单字段测试', () => {
    beforeEach(async () => {
      // 打开注册模态框
      const registerBtn = wrapper.findAll('button').find(btn => btn.text().includes('注册'))
      await registerBtn.trigger('click')
    })

    it('应该渲染所有必需的注册字段', () => {
      // 检查所有输入字段
      expect(wrapper.find('#name').exists()).toBe(true)
      expect(wrapper.find('#cnpj').exists()).toBe(true)
      expect(wrapper.find('#email').exists()).toBe(true)
      expect(wrapper.find('#password').exists()).toBe(true)
      expect(wrapper.find('#phone').exists()).toBe(true)
      expect(wrapper.find('#employeeCount').exists()).toBe(true)
      expect(wrapper.find('#monthlyRevenue').exists()).toBe(true)
    })

    it('应该显示正确的标签文本', () => {
      const labels = wrapper.findAll('label')
      const labelTexts = labels.map(label => label.text())
      
      expect(labelTexts).toContain('企业名称 *')
      expect(labelTexts).toContain('CNPJ *')
      expect(labelTexts).toContain('邮箱 *')
      expect(labelTexts).toContain('密码 *')
      expect(labelTexts).toContain('联系电话 *')
      expect(labelTexts).toContain('员工数量 *')
      expect(labelTexts).toContain('月营业额 *')
    })

    it('应该显示正确的占位符文本', () => {
      expect(wrapper.find('#cnpj').attributes('placeholder')).toBe('00.000.000/0000-00')
      expect(wrapper.find('#phone').attributes('placeholder')).toBe('(00) 00000-0000')
    })
  })

  describe('表单验证测试', () => {
    beforeEach(async () => {
      const registerBtn = wrapper.findAll('button').find(btn => btn.text().includes('注册'))
      await registerBtn.trigger('click')
    })

    it('应该验证CNPJ格式', async () => {
      const cnpjInput = wrapper.find('#cnpj')
      
      // 测试无效CNPJ
      await cnpjInput.setValue('123456789')
      await cnpjInput.trigger('blur')
      
      expect(wrapper.find('.error-message').text()).toContain('CNPJ必须是14位数字')
    })

    it('应该验证邮箱格式', async () => {
      const emailInput = wrapper.find('#email')
      
      // 测试无效邮箱
      await emailInput.setValue('invalid-email')
      await emailInput.trigger('blur')
      
      expect(wrapper.find('.error-message').text()).toContain('请输入有效的邮箱地址')
    })

    it('应该验证密码长度', async () => {
      const passwordInput = wrapper.find('#password')
      
      // 测试短密码
      await passwordInput.setValue('123')
      await passwordInput.trigger('blur')
      
      expect(wrapper.find('.error-message').text()).toContain('密码至少6个字符')
    })

    it('应该验证电话号码格式', async () => {
      const phoneInput = wrapper.find('#phone')
      
      // 测试无效电话
      await phoneInput.setValue('123')
      await phoneInput.trigger('blur')
      
      expect(wrapper.find('.error-message').text()).toContain('请输入有效的电话号码')
    })
  })


  describe('按钮状态测试', () => {
    beforeEach(async () => {
      const registerBtn = wrapper.findAll('button').find(btn => btn.text().includes('注册'))
      await registerBtn.trigger('click')
    })

    it('无效表单时注册按钮应该被禁用', () => {
      const submitBtn = wrapper.find('button[type="submit"]')
      expect(submitBtn.attributes('disabled')).toBeDefined()
    })

    it('有效表单时注册按钮应该可用', async () => {
      const validData = mockData.validRegistrationData[0]
      
      // 填写有效数据
      await wrapper.find('#name').setValue(validData.name)
      await wrapper.find('#cnpj').setValue(validData.cnpj)
      await wrapper.find('#email').setValue(validData.email)
      await wrapper.find('#password').setValue(validData.password)
      await wrapper.find('#phone').setValue(validData.phone)
      await wrapper.find('#employeeCount').setValue(validData.employeeCount)
      await wrapper.find('#monthlyRevenue').setValue(validData.monthlyRevenue)

      const submitBtn = wrapper.find('button[type="submit"]')
      expect(submitBtn.attributes('disabled')).toBeUndefined()
    })

    it('提交时按钮应该显示加载状态', async () => {
      const validData = mockData.validRegistrationData[0]
      
      // 模拟慢速API响应
      registerUser.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ success: true, user: {} }), 100)
      ))
      
      // 填写有效数据
      await wrapper.find('#name').setValue(validData.name)
      await wrapper.find('#cnpj').setValue(validData.cnpj)
      await wrapper.find('#email').setValue(validData.email)
      await wrapper.find('#password').setValue(validData.password)
      await wrapper.find('#phone').setValue(validData.phone)
      await wrapper.find('#employeeCount').setValue(validData.employeeCount)
      await wrapper.find('#monthlyRevenue').setValue(validData.monthlyRevenue)

      // 提交表单
      const form = wrapper.find('.register-form')
      await form.trigger('submit')

      // 检查按钮文本变化
      expect(wrapper.find('button[type="submit"]').text()).toBe('注册中...')
    })

    it('注册成功时应该显示成功消息但不自动登录', async () => {
      const validData = mockData.validRegistrationData[0]
      const mockResponse = mockData.apiResponses.successfulRegistration
      
      registerUser.mockResolvedValue(mockResponse)
      
      // 填写有效数据
      await wrapper.find('#name').setValue(validData.name)
      await wrapper.find('#cnpj').setValue(validData.cnpj)
      await wrapper.find('#email').setValue(validData.email)
      await wrapper.find('#password').setValue(validData.password)
      await wrapper.find('#phone').setValue(validData.phone)
      await wrapper.find('#employeeCount').setValue(validData.employeeCount)
      await wrapper.find('#monthlyRevenue').setValue(validData.monthlyRevenue)

      // 提交表单
      const form = wrapper.find('.register-form')
      await form.trigger('submit')
      
      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      
      // 注册成功后不应该自动登录（根据需求，只有登录才会设置用户状态）
      expect(wrapper.vm.isLoggedIn).toBe(false)
      expect(wrapper.vm.user).toBeNull()
      
      // 但应该显示成功消息
      expect(wrapper.vm.message).toBe('注册成功！欢迎加入Brail平台！')
      expect(wrapper.vm.messageType).toBe('success')
      
      // 提交按钮应该重置为"创建账户"（不是"注册中..."）
      expect(wrapper.vm.isSubmitting).toBe(false)
    })

    it('注册失败时应该显示错误消息', async () => {
      const validData = mockData.validRegistrationData[0]
      const mockResponse = mockData.apiResponses.failedRegistration
      
      registerUser.mockResolvedValue(mockResponse)
      
      // 填写有效数据
      await wrapper.find('#name').setValue(validData.name)
      await wrapper.find('#cnpj').setValue(validData.cnpj)
      await wrapper.find('#email').setValue(validData.email)
      await wrapper.find('#password').setValue(validData.password)
      await wrapper.find('#phone').setValue(validData.phone)
      await wrapper.find('#employeeCount').setValue(validData.employeeCount)
      await wrapper.find('#monthlyRevenue').setValue(validData.monthlyRevenue)

      // 提交表单
      const form = wrapper.find('.register-form')
      await form.trigger('submit')
      
      // 等待异步操作完成
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.message.error').text()).toBe('邮箱已被注册')
    })
  })

  describe('模态框交互测试', () => {
    it('应该能够打开和关闭注册模态框', async () => {
      // 打开模态框
      const registerBtn = wrapper.findAll('button').find(btn => btn.text().includes('注册'))
      await registerBtn.trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      // 关闭模态框
      const closeBtn = wrapper.find('.close-btn')
      await closeBtn.trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('点击模态框外部应该关闭模态框', async () => {
      // 打开模态框
      const registerBtn = wrapper.findAll('button').find(btn => btn.text().includes('注册'))
      await registerBtn.trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      // 点击模态框外部
      await wrapper.find('.modal-overlay').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('取消按钮应该关闭模态框', async () => {
      // 打开模态框
      const registerBtn = wrapper.findAll('button').find(btn => btn.text().includes('注册'))
      await registerBtn.trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      // 点击取消按钮
      const cancelBtn = wrapper.find('button[type="button"]')
      await cancelBtn.trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })
  })

  describe('登录功能测试', () => {
    beforeEach(async () => {
      // 确保用户已退出登录
      if (wrapper.vm.isLoggedIn) {
        wrapper.vm.userStore.clearUser()
        await wrapper.vm.$nextTick()
      }
      
      // 打开登录模态框
      wrapper.vm.showLoginModal = true
      await wrapper.vm.$nextTick()
    })

    it('应该渲染登录表单字段', () => {
      expect(wrapper.find('#loginEmail').exists()).toBe(true)
      expect(wrapper.find('#loginPassword').exists()).toBe(true)
    })

    it('应该显示正确的登录标签', () => {
      const labels = wrapper.findAll('label')
      const labelTexts = labels.map(label => label.text())
      
      expect(labelTexts).toContain('邮箱')
      expect(labelTexts).toContain('密码')
    })

    it('登录成功时应该更新用户状态', async () => {
      const mockResponse = mockData.apiResponses.successfulLogin
      loginUser.mockResolvedValue(mockResponse)
      
      // 填写登录信息
      await wrapper.find('#loginEmail').setValue('test@example.com')
      await wrapper.find('#loginPassword').setValue('password123')
      
      // 提交表单
      const form = wrapper.find('.login-form')
      await form.trigger('submit')
      
      // 等待所有异步操作完成
      await flushPromises()
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.isLoggedIn).toBe(true)
      // Store 中的用户对象格式为 user_id, user_email, user_name
      expect(wrapper.vm.user.user_id).toBe(mockResponse.user.id)
      expect(wrapper.vm.user.user_email).toBe(mockResponse.user.email)
      expect(wrapper.vm.user.user_name).toBe(mockResponse.user.name)
      
      // 检查用户下拉菜单是否显示
      expect(wrapper.find('.user-dropdown').exists()).toBe(true)
      expect(wrapper.find('.user-name').text()).toBe('测试用户')
    })

    it('登录失败时应该显示错误消息', async () => {
      const mockResponse = mockData.apiResponses.failedLogin
      loginUser.mockResolvedValue(mockResponse)
      
      // 填写登录信息
      await wrapper.find('#loginEmail').setValue('wrong@example.com')
      await wrapper.find('#loginPassword').setValue('wrongpassword')
      
      // 提交表单
      const form = wrapper.find('.login-form')
      await form.trigger('submit')
      
      // 等待异步操作完成
      await flushPromises()
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.message.error').text()).toBe('邮箱或密码错误')
    })

    it('登录时应该显示加载状态', async () => {
      // 模拟慢速API响应
      loginUser.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({ success: true, user: { id: 1, name: '测试', email: 'test@test.com', role: 'user' } }), 100)
      ))
      
      // 填写登录信息
      await wrapper.find('#loginEmail').setValue('test@example.com')
      await wrapper.find('#loginPassword').setValue('password123')
      
      // 提交表单
      const form = wrapper.find('.login-form')
      await form.trigger('submit')
      await wrapper.vm.$nextTick()
      
      // 检查按钮文本变化
      const submitBtn = wrapper.find('.login-form button[type="submit"]')
      expect(submitBtn.text()).toBe('登录中...')
    })

    it('登录模态框应该能够正确关闭', async () => {
      // 点击关闭按钮
      const closeBtns = wrapper.findAll('.close-btn')
      if (closeBtns.length > 1) {
        await closeBtns.at(1).trigger('click')
      } else {
        await closeBtns.at(0).trigger('click')
      }
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.showLoginModal).toBe(false)
    })

    it('点击模态框外部应该关闭登录模态框', async () => {
      // 点击模态框外部
      const overlays = wrapper.findAll('.modal-overlay')
      await overlays.at(overlays.length - 1).trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.showLoginModal).toBe(false)
    })
  })

  describe('用户下拉菜单测试', () => {
    beforeEach(async () => {
      // 通过 store 设置登录状态
      const userStore = wrapper.vm.userStore
      userStore.setUser({
        user_id: '1',
        user_email: 'test@example.com',
        user_name: '测试用户',
        role: 'user'
      })
      // 等待多个 tick 和 Promise 确保 DOM 完全更新
      await flushPromises()
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
    })

    it('应该显示用户头像和用户名', async () => {
      // 再次等待确保渲染完成
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.user-dropdown').exists()).toBe(true)
      expect(wrapper.find('.avatar-circle').exists()).toBe(true)
      expect(wrapper.find('.user-name').text()).toBe('测试用户')
      expect(wrapper.find('.online-indicator').exists()).toBe(true)
    })

    it('应该显示用户姓名首字母', async () => {
      await wrapper.vm.$nextTick()
      
      const avatarText = wrapper.find('.avatar-text')
      expect(avatarText.exists()).toBe(true)
      expect(avatarText.text()).toBe('测试')
    })

    it('getUserInitials函数应该正确处理不同格式的姓名', () => {
      const testData = mockData.userDropdownTestData
      const expectedInitials = testData.expectedInitials
      
      // 测试纯中文姓名
      expect(wrapper.vm.getUserInitials(testData.chineseNames.singleName)).toBe(expectedInitials['张三'])
      
      // 测试包含空格的中文姓名
      const result = wrapper.vm.getUserInitials(testData.chineseNames.doubleName)
      console.log('实际结果:', result)
      expect(result).toBe(expectedInitials['张三 李四'])
      
      // 测试英文姓名
      expect(wrapper.vm.getUserInitials(testData.englishNames.fullName)).toBe(expectedInitials['John Doe'])
      
      // 测试空值
      expect(wrapper.vm.getUserInitials('')).toBe('U')
      expect(wrapper.vm.getUserInitials(null)).toBe('U')
    })

    it('点击用户下拉菜单应该打开下拉菜单', async () => {
      const userDropdown = wrapper.find('.user-dropdown')
      await userDropdown.trigger('click')
      
      expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
      expect(wrapper.find('.dropdown-arrow').classes()).toContain('rotated')
    })

    it('下拉菜单应该显示用户信息', async () => {
      await wrapper.vm.$nextTick()
      
      const userDropdown = wrapper.find('.user-dropdown')
      await userDropdown.trigger('click')
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.dropdown-header').exists()).toBe(true)
      expect(wrapper.find('.user-name-large').text()).toBe('测试用户')
      expect(wrapper.find('.user-email').text()).toBe('test@example.com')
    })

    it('下拉菜单应该显示菜单项', async () => {
      const userDropdown = wrapper.find('.user-dropdown')
      await userDropdown.trigger('click')
      
      const dropdownItems = wrapper.findAll('.dropdown-item')
      expect(dropdownItems).toHaveLength(2)
      
      expect(dropdownItems[0].find('.item-text').text()).toBe('我的请求')
      expect(dropdownItems[1].find('.item-text').text()).toBe('管理账户')
    })

    it('应该显示退出登录按钮', async () => {
      const userDropdown = wrapper.find('.user-dropdown')
      await userDropdown.trigger('click')
      
      expect(wrapper.find('.logout-btn').exists()).toBe(true)
      expect(wrapper.find('.logout-text').text()).toBe('退出登录')
    })

    it('点击我的请求应该关闭下拉菜单', async () => {
      const userDropdown = wrapper.find('.user-dropdown')
      await userDropdown.trigger('click')
      
      const requestsItem = wrapper.find('.dropdown-item')
      await requestsItem.trigger('click')
      
      expect(wrapper.vm.showUserDropdown).toBe(false)
    })

    it('点击管理账户应该关闭下拉菜单', async () => {
      const userDropdown = wrapper.find('.user-dropdown')
      await userDropdown.trigger('click')
      
      const accountItems = wrapper.findAll('.dropdown-item')
      await accountItems[1].trigger('click')
      
      expect(wrapper.vm.showUserDropdown).toBe(false)
    })

    it('点击退出登录应该退出用户', async () => {
      const userDropdown = wrapper.find('.user-dropdown')
      await userDropdown.trigger('click')
      
      const logoutBtn = wrapper.find('.logout-btn')
      await logoutBtn.trigger('click')
      
      expect(wrapper.vm.isLoggedIn).toBe(false)
      expect(wrapper.vm.user).toBeNull()
      expect(wrapper.vm.showUserDropdown).toBe(false)
    })
  })

  describe('购物车功能测试', () => {
    it('购物车图标应该存在', () => {
      const cartBtn = wrapper.find('.cart-btn')
      expect(cartBtn.exists()).toBe(true)
    })

    it('购物车图标应该显示正确的图标', () => {
      const cartIcon = wrapper.find('.cart-icon')
      expect(cartIcon.exists()).toBe(true)
      expect(cartIcon.text()).toBe('🛒')
    })
  })

})
