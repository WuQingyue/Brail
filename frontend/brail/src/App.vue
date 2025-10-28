<script setup>
import { ref, computed, onMounted } from 'vue'
import Header from './components/Layout/Header.vue'
import Categories from './components/Home/Categories.vue'
import Order from './components/Order/Order.vue'
import Databash from './components/Admin/Databash.vue'
import LogisticsManagement from './components/Logistics/LogisticsManagement.vue'
import LogisticsManagement2 from './components/Logistics/LogisticsManagement2.vue'
import { useUserStore } from './stores/user.js'

// 简单的路由状态管理
const currentRoute = ref('home')
const userStore = useUserStore()

// 检查用户角色并跳转
const checkUserRoleAndRedirect = () => {
  console.log('=== 开始角色检查 ===')
  console.log('userStore.isLoggedIn:', userStore.isLoggedIn)
  console.log('userStore.user:', userStore.user)
  console.log('localStorage userInfo:', localStorage.getItem('userInfo'))
  
  if (userStore.isLoggedIn && userStore.user) {
    const currentPath = window.location.pathname
    const userRole = userStore.user.role
    
    console.log('=== 页面加载时角色检查 ===')
    console.log('当前路径:', currentPath)
    console.log('用户角色:', userRole)
    console.log('用户信息:', userStore.user)
    
    // 如果用户是物流管理员但不在物流页面，则跳转
    if (userRole === 'logistics' && currentPath !== '/Logistics-1') {
      console.log('物流管理员不在正确页面，跳转到物流管理页面')
      window.location.href = '/Logistics-1'
    }
    // 如果用户是物流管理员1或2但不在物流2页面，则跳转
    else if ((userRole === 'logistics1' || userRole === 'logistics2') && currentPath !== '/Logistics-2') {
      console.log('物流管理员1或2不在正确页面，跳转到物流管理2页面')
      window.location.href = '/Logistics-2'
    }
    // 如果用户是管理员但不在管理员页面，则跳转
    else if (userRole === 'admin' && currentPath !== '/admin') {
      console.log('管理员不在正确页面，跳转到管理员页面')
      window.location.href = '/admin'
    }
    console.log('=== 角色检查结束 ===')
  }
}

// 监听URL变化
const updateRoute = () => {
  const path = window.location.pathname
  if (path === '/order' || path === '/orders') {
    currentRoute.value = 'order'
  } else if (path === '/admin') {
    currentRoute.value = 'admin'
  } else if (path === '/Logistics-1') {
    currentRoute.value = 'logistics'
  } else if (path === '/Logistics-2') {
    currentRoute.value = 'logistics2'
  } else {
    currentRoute.value = 'home'
  }
}

// 计算当前组件
const currentComponent = computed(() => {
  switch (currentRoute.value) {
    case 'order':
      return Order
    case 'admin':
      return Databash
    case 'logistics':
      return LogisticsManagement
    case 'logistics2':
      return LogisticsManagement2
    default:
      return Categories
  }
})

// 生命周期
onMounted(() => {
  // 初始化用户状态
  userStore.initUserFromStorage()
  
  updateRoute()
  
  // 延迟执行角色检查，确保用户状态已经正确设置
  setTimeout(() => {
    checkUserRoleAndRedirect()
  }, 500)
  
  // 额外的检查，以防第一次检查失败
  setTimeout(() => {
    console.log('=== 第二次角色检查 ===')
    checkUserRoleAndRedirect()
  }, 1000)
  
  // 页面完全加载后的最终检查
  window.addEventListener('load', () => {
    console.log('=== 页面完全加载后的角色检查 ===')
    setTimeout(() => {
      checkUserRoleAndRedirect()
    }, 200)
  })
  
  // 监听浏览器前进后退
  window.addEventListener('popstate', updateRoute)
  
  // 监听 pushState 和 replaceState 调用（用于手动导航）
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args)
    updateRoute()
  }
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args)
    updateRoute()
  }
})
</script>

<template>
  <div id="app">
    <!-- 导航栏 -->
    <Header />
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <component :is="currentComponent" />
    </main>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  padding: 0;
}

.main-content {
  flex: 1;
  padding: 2rem;
  width: 100%;
  min-height: calc(100vh - 80px);
  box-sizing: border-box;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}
</style>
