<script setup>
import { ref, computed, onMounted } from 'vue'
import Header from './components/Layout/Header.vue'
import Categories from './components/Home/Categories.vue'
import Order from './components/Order/Order.vue'

// 简单的路由状态管理
const currentRoute = ref('home')

// 监听URL变化
const updateRoute = () => {
  const path = window.location.pathname
  if (path === '/order' || path === '/orders') {
    currentRoute.value = 'order'
  } else {
    currentRoute.value = 'home'
  }
}

// 计算当前组件
const currentComponent = computed(() => {
  switch (currentRoute.value) {
    case 'order':
      return Order
    default:
      return Categories
  }
})

// 生命周期
onMounted(() => {
  updateRoute()
  // 监听浏览器前进后退
  window.addEventListener('popstate', updateRoute)
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
