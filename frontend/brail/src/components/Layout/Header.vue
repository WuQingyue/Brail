<template>
  <header class="header">
    <div class="container">
      <!-- Logo区域 -->
      <div class="logo">
        <h1>Brail</h1>
      </div>

      <!-- 导航菜单 -->
      <nav class="nav">
        <ul class="nav-list">
          <li><a href="/">首页</a></li>
          <li><a href="/products">产品</a></li>
          <li><a href="/about">关于我们</a></li>
        </ul>
      </nav>

      <!-- 用户操作区域 -->
      <div class="user-actions">
        <!-- 购物车图标 -->
        <button @click="toggleCart" class="cart-btn" :class="{ 'has-items': cartItemCount > 0 }">
          <span class="cart-icon">🛒</span>
          <span v-if="cartItemCount > 0" class="cart-count">{{ cartItemCount }}</span>
        </button>
        
        <button v-if="!isLoggedIn" @click="showRegisterModal = true" class="btn btn-primary">
          注册
        </button>
        <button v-if="!isLoggedIn" @click="showLoginModal = true" class="btn btn-secondary">
          登录
        </button>
        <div v-if="isLoggedIn" class="user-menu">
          <span>欢迎, {{ user.name }}</span>
          <button @click="logout" class="btn btn-outline">退出</button>
        </div>
      </div>
    </div>

    <!-- 注册模态框 -->
    <div v-if="showRegisterModal" class="modal-overlay" @click="closeRegisterModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>企业注册</h2>
          <button @click="closeRegisterModal" class="close-btn">&times;</button>
        </div>
        
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label for="name">企业名称 *</label>
            <input
              id="name"
              v-model="registerForm.name"
              type="text"
              required
              :class="{ 'error': errors.name }"
              placeholder="请输入企业名称"
              @blur="validateName"
            />
            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          </div>

          <div class="form-group">
            <label for="email">邮箱 *</label>
            <input
              id="email"
              v-model="registerForm.email"
              type="email"
              required
              :class="{ 'error': errors.email }"
              placeholder="seu@email.com"
              @blur="validateEmail"
            />
            <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
          </div>

          <div class="form-group">
            <label for="password">密码 *</label>
            <input
              id="password"
              v-model="registerForm.password"
              type="password"
              required
              :class="{ 'error': errors.password }"
              placeholder="至少6个字符"
              @blur="validatePassword"
            />
            <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
          </div>

          <div class="form-group">
            <label for="cnpj">CNPJ *</label>
            <input
              id="cnpj"
              v-model="registerForm.cnpj"
              type="text"
              required
              :class="{ 'error': errors.cnpj }"
              placeholder="00.000.000/0000-00"
              @blur="validateCNPJ"
            />
            <span v-if="errors.cnpj" class="error-message">{{ errors.cnpj }}</span>
          </div>

          <div class="form-group">
            <label for="employeeCount">员工数量 *</label>
            <select
              id="employeeCount"
              v-model="registerForm.employeeCount"
              required
              :class="{ 'error': errors.employeeCount }"
            >
              <option value="">请选择员工数量</option>
              <option value="1-10">1-10人</option>
              <option value="11-50">11-50人</option>
              <option value="51-200">51-200人</option>
              <option value="201-500">201-500人</option>
              <option value="500+">500人以上</option>
            </select>
            <span v-if="errors.employeeCount" class="error-message">{{ errors.employeeCount }}</span>
          </div>

          <div class="form-group">
            <label for="monthlyRevenue">月营业额 *</label>
            <select
              id="monthlyRevenue"
              v-model="registerForm.monthlyRevenue"
              required
              :class="{ 'error': errors.monthlyRevenue }"
            >
              <option value="">请选择月营业额</option>
              <option value="0-10k">0-1万元</option>
              <option value="10k-50k">1-5万元</option>
              <option value="50k-100k">5-10万元</option>
              <option value="100k-500k">10-50万元</option>
              <option value="500k+">50万元以上</option>
            </select>
            <span v-if="errors.monthlyRevenue" class="error-message">{{ errors.monthlyRevenue }}</span>
          </div>

          <div class="form-group">
            <label for="phone">联系电话 *</label>
            <input
              id="phone"
              v-model="registerForm.phone"
              type="tel"
              required
              :class="{ 'error': errors.phone }"
              placeholder="(00) 00000-0000"
              @blur="validatePhone"
            />
            <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
          </div>

          <div class="form-actions">
            <button 
              type="button" 
              @click="closeRegisterModal" 
              class="btn-cancel"
            >
              取消
            </button>
            <button 
              type="submit" 
              :disabled="isSubmitting || !isFormValid"
              class="btn-register"
            >
              {{ isSubmitting ? '注册中...' : '创建账户' }}
            </button>
          </div>

          <div v-if="message" :class="['message', messageType]">
            {{ message }}
          </div>
        </form>
      </div>
    </div>

    <!-- 登录模态框 -->
    <div v-if="showLoginModal" class="modal-overlay" @click="closeLoginModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>用户登录</h2>
          <button @click="closeLoginModal" class="close-btn">&times;</button>
        </div>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="loginEmail">邮箱</label>
            <input id="loginEmail" v-model="loginForm.email" type="email" required />
          </div>
          <div class="form-group">
            <label for="loginPassword">密码</label>
            <input id="loginPassword" v-model="loginForm.password" type="password" required />
          </div>
          <div class="form-actions">
            <button type="button" @click="closeLoginModal" class="btn btn-secondary">取消</button>
            <button type="submit" class="btn btn-primary">登录</button>
          </div>
        </form>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

// 响应式数据
const isLoggedIn = ref(false)
const user = ref(null)
const showRegisterModal = ref(false)
const showLoginModal = ref(false)
const isSubmitting = ref(false)
const message = ref('')
const messageType = ref('')
const cartItemCount = ref(0)
const showCart = ref(false)

// 注册表单数据
const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  cnpj: '',
  phone: '',
  employeeCount: '',
  monthlyRevenue: ''
})

// 登录表单数据
const loginForm = reactive({
  email: '',
  password: ''
})

// 错误信息
const errors = ref({})

// 表单验证
const validateName = () => {
  const name = registerForm.name.trim()
  if (!name) {
    errors.value.name = '企业名称不能为空'
  } else if (name.length < 2) {
    errors.value.name = '企业名称至少2个字符'
  } else {
    delete errors.value.name
  }
}

const validateCNPJ = () => {
  const cnpj = registerForm.cnpj.replace(/\D/g, '')
  if (!cnpj) {
    errors.value.cnpj = 'CNPJ不能为空'
  } else if (cnpj.length !== 14) {
    errors.value.cnpj = 'CNPJ必须是14位数字'
  } else {
    delete errors.value.cnpj
  }
}

const validateEmail = () => {
  const email = registerForm.email.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email) {
    errors.value.email = '邮箱不能为空'
  } else if (!emailRegex.test(email)) {
    errors.value.email = '请输入有效的邮箱地址'
  } else {
    delete errors.value.email
  }
}

const validatePassword = () => {
  const password = registerForm.password
  if (!password) {
    errors.value.password = '密码不能为空'
  } else if (password.length < 6) {
    errors.value.password = '密码至少6个字符'
  } else {
    delete errors.value.password
  }
}

const validatePhone = () => {
  const phone = registerForm.phone.replace(/\D/g, '')
  if (!phone) {
    errors.value.phone = '联系电话不能为空'
  } else if (phone.length < 10) {
    errors.value.phone = '请输入有效的电话号码'
  } else {
    delete errors.value.phone
  }
}

// 表单是否有效
const isFormValid = computed(() => {
  return Object.keys(errors.value).length === 0 && 
         registerForm.name && 
         registerForm.email && 
         registerForm.password && 
         registerForm.cnpj && 
         registerForm.phone && 
         registerForm.employeeCount && 
         registerForm.monthlyRevenue
})

// 注册函数
const handleRegister = async () => {
  // 验证所有字段
  validateName()
  validateEmail()
  validatePassword()
  validateCNPJ()
  validatePhone()

  if (!isFormValid.value) {
    message.value = '请检查表单信息'
    messageType.value = 'error'
    return
  }

  isSubmitting.value = true
  message.value = ''

  try {
    // 模拟API调用
    const response = await registerUser(registerForm)
    
    if (response.success) {
      message.value = '注册成功！'
      messageType.value = 'success'
      
      // 设置用户登录状态
      user.value = response.user
      isLoggedIn.value = true
      
      // 延迟关闭模态框
      setTimeout(() => {
        closeRegisterModal()
      }, 2000)
    } else {
      message.value = response.message || '注册失败，请重试'
      messageType.value = 'error'
    }
  } catch (error) {
    message.value = '网络错误，请检查网络连接'
    messageType.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

// 登录函数
const handleLogin = async () => {
  try {
    const response = await loginUser(loginForm)
    if (response.success) {
      user.value = response.user
      isLoggedIn.value = true
      closeLoginModal()
    } else {
      message.value = response.message || '登录失败'
      messageType.value = 'error'
    }
  } catch (error) {
    message.value = '登录失败，请重试'
    messageType.value = 'error'
  }
}

// 退出登录
const logout = () => {
  user.value = null
  isLoggedIn.value = false
}

// 购物车相关方法
const toggleCart = () => {
  showCart.value = !showCart.value
  // 这里可以添加购物车侧边栏的显示逻辑
  console.log('购物车切换:', showCart.value)
}

// 添加商品到购物车
const addToCart = (product) => {
  cartItemCount.value += 1
  console.log('添加到购物车:', product)
}

// 移除商品从购物车
const removeFromCart = (productId) => {
  if (cartItemCount.value > 0) {
    cartItemCount.value -= 1
  }
  console.log('从购物车移除:', productId)
}

// 关闭模态框
const closeRegisterModal = () => {
  showRegisterModal.value = false
  // 重置表单
  registerForm.name = ''
  registerForm.email = ''
  registerForm.password = ''
  registerForm.cnpj = ''
  registerForm.phone = ''
  registerForm.employeeCount = ''
  registerForm.monthlyRevenue = ''
  errors.value = {}
  message.value = ''
}

const closeLoginModal = () => {
  showLoginModal.value = false
  Object.keys(loginForm).forEach(key => {
    loginForm[key] = ''
  })
  message.value = ''
}

// 模拟API函数
const registerUser = async (userData) => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // 模拟API响应
  if (userData.email === 'existing@example.com') {
    return { success: false, message: '邮箱已被注册' }
  }
  
  if (userData.cnpj === '11111111111111') {
    return { success: false, message: 'CNPJ已被注册' }
  }
  
  return { 
    success: true, 
    user: {
      id: Date.now(),
      name: userData.name,
      email: userData.email,
      cnpj: userData.cnpj,
      phone: userData.phone,
      employeeCount: userData.employeeCount,
      monthlyRevenue: userData.monthlyRevenue
    }
  }
}

const loginUser = async (loginData) => {
  await new Promise(resolve => setTimeout(resolve, 500))
  
  if (loginData.email === 'test@example.com' && loginData.password === 'password123') {
    return {
      success: true,
      user: {
        id: 1,
        name: '测试用户',
        email: loginData.email
      }
    }
  }
  
  return { success: false, message: '邮箱或密码错误' }
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #10b981 0%, #fbbf24 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
  position: sticky;
  top: 0;
  z-index: 1000;
  width: 100%;
  margin: 0;
  padding: 0;
}

.container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  width: 100%;
  margin: 0;
  box-sizing: border-box;
  flex-wrap: wrap;
  gap: 1rem;
  max-width: none;
}

.logo h1 {
  color: white;
  margin: 0;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1rem;
  flex-shrink: 0;
}

.nav-list a {
  text-decoration: none;
  color: white;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.3s;
}

.nav-list a:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fbbf24;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-shrink: 0;
}

.btn {
  padding: 0.4rem 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.3s;
  white-space: nowrap;
}

.btn-primary {
  background: #fbbf24;
  color: #065f46;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(251, 191, 36, 0.4);
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-outline {
  background: transparent;
  color: white;
  border: 2px solid white;
  font-weight: 500;
}

.btn-outline:hover {
  background: white;
  color: #10b981;
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.user-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 购物车按钮样式 */
.cart-btn {
  position: relative;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
}

.cart-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

.cart-btn.has-items {
  background: rgba(251, 191, 36, 0.9);
  border-color: #fbbf24;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
}

.cart-btn.has-items:hover {
  background: #fbbf24;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.5);
}

.cart-icon {
  font-size: 1.2rem;
  color: white;
  display: block;
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e53e3e;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  border: 1px solid #e1e8ed;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 0.5rem 1.5rem;
  border-bottom: none;
}

.modal-header h2 {
  background: linear-gradient(135deg, #10b981, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.close-btn {
  background: #f7fafc;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.2rem;
  cursor: pointer;
  color: #718096;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #2d3748;
}

.register-form, .login-form {
  padding: 0 1.5rem 1.5rem 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2d3748;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  background: #f7fafc;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #10b981;
  background: white;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.form-group input.error,
.form-group select.error {
  border-color: #e53e3e;
  background: #fed7d7;
}

.error-message {
  color: #e53e3e;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn-cancel {
  flex: 1;
  padding: 0.875rem 1rem;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.btn-register {
  flex: 2;
  padding: 0.875rem 1rem;
  background: linear-gradient(135deg, #10b981, #fbbf24);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.btn-register:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-register:disabled {
  background: #a0aec0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.message {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
}

.message.success {
  background: #c6f6d5;
  color: #22543d;
  border: 1px solid #9ae6b4;
}

.message.error {
  background: #fed7d7;
  color: #742a2a;
  border: 1px solid #feb2b2;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 0.5rem 1rem;
    width: 100%;
    flex-wrap: wrap;
    gap: 0.5rem;
    max-width: none;
  }
  
  .nav-list {
    display: none;
  }
  
  .user-actions {
    gap: 0.25rem;
  }
  
  .btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
  }
  
  .cart-btn {
    min-width: 36px;
    height: 36px;
    padding: 0.3rem;
  }
  
  .cart-icon {
    font-size: 1rem;
  }
  
  .cart-count {
    width: 16px;
    height: 16px;
    font-size: 0.7rem;
    top: -6px;
    right: -6px;
  }
  
  .modal {
    width: 95%;
    margin: 1rem;
  }
}

</style>
