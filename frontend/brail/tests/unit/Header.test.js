import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Header from '@/components/Layout/Header.vue'
import mockData from '../fixtures/mock-data.json'

describe('Header.vue 注册功能单元测试', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(Header)
  })

  describe('组件渲染测试', () => {
    it('应该正确渲染Header组件', () => {
      expect(wrapper.find('.header').exists()).toBe(true)
      expect(wrapper.find('.logo').exists()).toBe(true)
      expect(wrapper.find('.nav').exists()).toBe(true)
      expect(wrapper.find('.user-actions').exists()).toBe(true)
    })

    it('应该显示注册和登录按钮', () => {
      expect(wrapper.find('button').text()).toContain('注册')
      expect(wrapper.findAll('button').length).toBeGreaterThan(0)
    })

    it('点击注册按钮应该打开注册模态框', async () => {
      const registerBtn = wrapper.find('button')
      await registerBtn.trigger('click')
      
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)
      expect(wrapper.find('.register-form').exists()).toBe(true)
    })
  })

  describe('注册表单字段测试', () => {
    beforeEach(async () => {
      // 打开注册模态框
      await wrapper.find('button').trigger('click')
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
      await wrapper.find('button').trigger('click')
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
      await wrapper.find('button').trigger('click')
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
  })

  describe('模态框交互测试', () => {
    it('应该能够打开和关闭注册模态框', async () => {
      // 打开模态框
      await wrapper.find('button').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      // 关闭模态框
      const closeBtn = wrapper.find('.close-btn')
      await closeBtn.trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('点击模态框外部应该关闭模态框', async () => {
      // 打开模态框
      await wrapper.find('button').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      // 点击模态框外部
      await wrapper.find('.modal-overlay').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })

    it('取消按钮应该关闭模态框', async () => {
      // 打开模态框
      await wrapper.find('button').trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(true)

      // 点击取消按钮
      const cancelBtn = wrapper.find('button[type="button"]')
      await cancelBtn.trigger('click')
      expect(wrapper.find('.modal-overlay').exists()).toBe(false)
    })
  })

})
