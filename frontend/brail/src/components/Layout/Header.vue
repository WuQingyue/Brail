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
          <!-- 用户头像和下拉菜单 -->
          <div class="user-dropdown" @click="toggleUserDropdown">
            <div class="user-avatar">
              <div class="avatar-circle">
                <span class="avatar-text">{{ getUserInitials(user.user_name) }}</span>
                <div class="online-indicator"></div>
              </div>
            </div>
            <span class="user-name">{{ user.user_name }}</span>
            <div class="dropdown-arrow" :class="{ 'rotated': showUserDropdown }">▼</div>
          </div>
          
          <!-- 下拉菜单 -->
          <div v-if="showUserDropdown" class="dropdown-menu" @click.stop>
            <div class="dropdown-header">
              <div class="dropdown-avatar">
                <span class="avatar-text">{{ getUserInitials(user.user_name) }}</span>
                <div class="online-indicator"></div>
              </div>
              <div class="user-info">
                <div class="user-name-large">{{ user.user_name }}</div>
                <div class="user-email">{{ user.user_email }}</div>
              </div>
            </div>
            
            <div class="dropdown-items">
              <div v-if="!isAdmin" class="dropdown-item" @click="goToRequests">
                <span class="item-icon">↕</span>
                <span class="item-text">我的请求</span>
              </div>
              <div v-if="!isAdmin" class="dropdown-item" @click="goToAccount">
                <span class="item-icon">⚙</span>
                <span class="item-text">管理账户</span>
              </div>
            </div>
            
            <div class="dropdown-footer">
              <button @click="logout" class="logout-btn">
                <span class="logout-icon">🚪</span>
                <span class="logout-text">退出登录</span>
              </button>
            </div>
          </div>
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
            <button 
              type="submit" 
              :disabled="isSubmitting"
              class="btn btn-primary"
            >
              {{ isSubmitting ? '登录中...' : '登录' }}
            </button>
          </div>

          <div v-if="message" :class="['message', messageType]">
            {{ message }}
          </div>
        </form>
      </div>
    </div>

    <!-- 购物车对话框 -->
    <Cart 
      :userId="currentUserId" 
      :isVisible="showCart" 
      @close="closeCart"
    />
  </header>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import Cart from '../Cart/Cart.vue'
import { loginUser, registerUser, handleApiError } from '@/utils/api.js'
import { useUserStore } from '@/stores/user.js'

// 使用 Pinia store
const userStore = useUserStore()

// 响应式数据 - 从 store 获取
const isLoggedIn = computed(() => userStore.isLoggedIn)
const user = computed(() => userStore.user)
const showRegisterModal = ref(false)
const showLoginModal = ref(false)
const isSubmitting = ref(false)
const message = ref('')
const messageType = ref('')
const cartItemCount = ref(0)
const showCart = ref(false)
const showUserDropdown = ref(false)
const currentUserId = ref(1) // 当前用户ID，实际应用中应该从登录状态获取

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

// 判断是否是管理员
const isAdmin = computed(() => {
  return user.value && user.value.role === 'admin'
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
    // 调用真实API
    const response = await registerUser(registerForm)
    
    if (response.success) {
      message.value = '注册成功！欢迎加入Brail平台！'
      messageType.value = 'success'
      
      // 注册成功后不自动登录，用户需要手动登录
      
      // 重置提交状态，让按钮恢复为"创建账户"
      isSubmitting.value = false
      
      // 延长显示时间，让用户看到成功消息
      setTimeout(() => {
        closeRegisterModal()
      }, 3000)
    } else {
      console.log('注册失败', response)
      message.value = response.message || '注册失败，请重试'
      messageType.value = 'error'
      isSubmitting.value = false
    }
  } catch (error) {
    message.value = handleApiError(error)
    messageType.value = 'error'
    isSubmitting.value = false
  }
}

// 登录函数
const handleLogin = async () => {
  isSubmitting.value = true
  message.value = ''

  try {
    const response = await loginUser(loginForm)
    
    if (response.success) {
      message.value = '登录成功！'
      messageType.value = 'success'
      
      // 使用 Pinia store 设置用户登录状态（自动持久化）
      userStore.setUser({
        user_id: response.user.id,
        user_email: response.user.email,
        user_name: response.user.name,
        role: response.user.role
      })
      
      console.log('登录成功，用户信息已保存:', response.user)
      
      // 延迟关闭模态框并根据用户角色跳转
      setTimeout(() => {
        closeLoginModal()
        // 如果是管理员，自动跳转到管理员页面
        if (response.user.role === 'admin') {
          window.location.href = '/admin'
        }
      }, 1500)
    } else {
      message.value = response.message || '登录失败，请重试'
      messageType.value = 'error'
    }
  } catch (error) {
    message.value = handleApiError(error)
    messageType.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

// 退出登录
const logout = () => {
  // 使用 Pinia store 清除用户信息（自动清除持久化数据）
  userStore.clearUser()
  showUserDropdown.value = false
  console.log('用户已退出登录，信息已清除')
  
  // 跳转到首页
  window.location.href = '/'
}

// 切换用户下拉菜单
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

// 获取用户姓名首字母
const getUserInitials = (name) => {
  if (!name) return 'U'
  
  // 处理包含空格的中文姓名 - 取每个词的首字符
  if (name.includes(' ') && /[\u4e00-\u9fff]/.test(name)) {
    return name.split(' ').map(word => word.charAt(0)).join('').slice(0, 2)
  }
  
  // 处理纯中文姓名 - 直接取前两个字符
  if (/[\u4e00-\u9fff]/.test(name)) {
    return name.slice(0, 2)
  }
  
  // 处理英文姓名 - 取每个单词的首字母
  return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)
}

// 跳转到我的请求页面
const goToRequests = () => {
  showUserDropdown.value = false
  console.log('跳转到我的请求页面')
  window.location.href = '/order'
}

// 跳转到管理账户页面
const goToAccount = () => {
  showUserDropdown.value = false
  console.log('跳转到管理账户页面')
  // 这里可以添加路由跳转逻辑
}

// 购物车相关方法
const toggleCart = () => {
  showCart.value = !showCart.value
  console.log('购物车切换:', showCart.value)
}

const closeCart = () => {
  showCart.value = false
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
  // 重置提交状态
  isSubmitting.value = false
}

// 点击外部关闭下拉菜单
const handleClickOutside = (event) => {
  if (showUserDropdown.value && !event.target.closest('.user-dropdown') && !event.target.closest('.dropdown-menu')) {
    showUserDropdown.value = false
  }
}

const closeLoginModal = () => {
  showLoginModal.value = false
  Object.keys(loginForm).forEach(key => {
    loginForm[key] = ''
  })
  message.value = ''
  // 重置提交状态
  isSubmitting.value = false
}

// 生命周期钩子
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  
  // 从 localStorage 恢复用户登录状态
  userStore.initUserFromStorage()
  console.log('Header 组件已挂载，用户登录状态:', userStore.isLoggedIn)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

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
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 用户下拉菜单样式 */
.user-dropdown {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.user-dropdown:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.user-avatar {
  position: relative;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24, #10b981);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.avatar-text {
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #10b981;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.user-name {
  color: white;
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
}

.dropdown-arrow {
  color: white;
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* 下拉菜单 */
.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e8ed;
  min-width: 280px;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-bottom: 1px solid #e1e8ed;
}

.dropdown-avatar {
  position: relative;
}

.dropdown-avatar .avatar-circle {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #10b981, #fbbf24);
}

.dropdown-avatar .avatar-text {
  font-size: 1.1rem;
}

.dropdown-avatar .online-indicator {
  width: 14px;
  height: 14px;
  bottom: 3px;
  right: 3px;
}

.user-info {
  flex: 1;
}

.user-name-large {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 0.25rem;
}

.user-email {
  font-size: 0.9rem;
  color: #718096;
}

.dropdown-items {
  padding: 0.5rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #2d3748;
}

.dropdown-item:hover {
  background: #f7fafc;
  color: #10b981;
}

.item-icon {
  font-size: 1.2rem;
  width: 20px;
  text-align: center;
}

.item-text {
  font-weight: 500;
  font-size: 0.95rem;
}

.dropdown-footer {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-top: 1px solid #e1e8ed;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
  color: #374151;
}

.logout-icon {
  font-size: 1rem;
}

.logout-text {
  font-size: 0.9rem;
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
  
  .user-dropdown {
    padding: 0.3rem;
  }
  
  .avatar-circle {
    width: 32px;
    height: 32px;
  }
  
  .avatar-text {
    font-size: 0.8rem;
  }
  
  .user-name {
    font-size: 0.8rem;
  }
  
  .dropdown-menu {
    min-width: 260px;
    right: -10px;
  }
  
  .dropdown-header {
    padding: 1rem;
  }
  
  .dropdown-avatar .avatar-circle {
    width: 40px;
    height: 40px;
  }
  
  .dropdown-avatar .avatar-text {
    font-size: 1rem;
  }
  
  .user-name-large {
    font-size: 1rem;
  }
  
  .user-email {
    font-size: 0.8rem;
  }
  
  .dropdown-item {
    padding: 0.6rem 1rem;
  }
  
  .item-text {
    font-size: 0.9rem;
  }
  
  .dropdown-footer {
    padding: 0.8rem 1rem;
  }
  
  .logout-btn {
    padding: 0.6rem 0.8rem;
  }
  
  .logout-text {
    font-size: 0.8rem;
  }
}

</style>
