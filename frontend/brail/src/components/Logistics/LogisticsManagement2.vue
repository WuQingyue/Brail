<template>
  <div class="logistics-page">
    <!-- 左侧导航栏 -->
    <div class="sidebar">
      <div class="sidebar-content">
        <div 
          v-for="tab in navTabs" 
          :key="tab.id"
          class="nav-item" 
          :class="{ active: currentTab === tab.id }" 
          @click="currentTab = tab.id"
        >
          <div class="nav-icon">{{ tab.icon }}</div>
          <div class="nav-text">{{ tab.title }}</div>
        </div>
      </div>
    </div>

    <!-- 右侧主内容区域 -->
    <div class="main-content">
      <!-- 到达巴西海关订单页面 -->
      <CustomsOrders v-if="currentTab === 'customs'" />
      
      <!-- 清关完成订单页面 -->
      <ClearedOrders v-else-if="currentTab === 'cleared'" />
      
      <!-- 已交付订单页面 -->
      <DeliveredOrders v-else-if="currentTab === 'delivered'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import CustomsOrders from './CustomsOrders.vue'
import ClearedOrders from './ClearedOrders.vue'
import DeliveredOrders from './DeliveredOrders.vue'

// 响应式数据
const currentTab = ref('customs')

// 导航标签数据（集中管理）
const navTabs = [
  { id: 'customs', title: '到达巴西海关订单', icon: '🏛️' },
  { id: 'cleared', title: '清关完成订单', icon: '✅' },
  { id: 'delivered', title: '已交付订单', icon: '🎉' }
]

// 计算当前标签的数据
const currentTabData = computed(() => {
  return navTabs.find(tab => tab.id === currentTab.value) || navTabs[0]
})
</script>

<style scoped>
.logistics-page {
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
}

/* 左侧导航栏 */
.sidebar {
  width: 250px;
  background: #f9fafb;
  border-right: 1px solid #f59e0b;
  flex-shrink: 0;
}

.sidebar-content {
  padding: 2rem 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.nav-item:hover {
  background: #fef3c7;
  color: #92400e;
}

.nav-item.active {
  background: #f59e0b;
  color: white;
  border-left-color: #d97706;
}

.nav-icon {
  font-size: 1.2rem;
  margin-right: 1rem;
  width: 24px;
  text-align: center;
}

.nav-text {
  font-weight: 500;
  font-size: 1rem;
}

/* 右侧主内容区域 */
.main-content {
  flex: 1;
  background: white;
  padding: 2rem;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .logistics-page {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #f59e0b;
  }
  
  .sidebar-content {
    display: flex;
    padding: 1rem 0;
    overflow-x: auto;
  }
  
  .nav-item {
    flex: 1;
    justify-content: center;
    padding: 1rem;
    min-width: 120px;
  }
  
  .main-content {
    padding: 1rem;
  }
}
</style>
