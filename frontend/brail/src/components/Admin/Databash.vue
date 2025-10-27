<template>
  <div class="admin-page">
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
      <!-- 待审核订单页面 -->
      <OrderReview v-if="currentTab === 'pending'" />
      
      <!-- 已处理订单页面 -->
      <ProcessedOrders v-else-if="currentTab === 'processed'" />
      
      <!-- 其他页面 - 暂无数据 -->
      <div v-else class="content-wrapper">
        <!-- 页面标题 -->
        <div class="page-header">
          <h1 class="page-title">{{ currentTabData.title }}</h1>
        </div>

        <!-- 主内容区域 - 显示暂无数据 -->
        <div class="admin-container">
          <div class="no-data">
            <div class="no-data-icon">{{ currentTabData.icon }}</div>
            <div class="no-data-title">暂无数据</div>
            <div class="no-data-description">页面正在完善中，敬请期待</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import OrderReview from './OrderReview.vue'
import ProcessedOrders from './ProcessedOrders.vue'

// 响应式数据
const currentTab = ref('pending')

// 导航标签数据（集中管理）
const navTabs = [
  { id: 'pending', title: '待审核订单', icon: '⏳' },
  { id: 'processed', title: '已处理订单', icon: '✅' },
  { id: 'products', title: '产品管理', icon: '📦' },
  { id: 'suppliers', title: '供应商管理', icon: '🏭' }
]

// 计算当前标签的数据
const currentTabData = computed(() => {
  return navTabs.find(tab => tab.id === currentTab.value) || navTabs[0]
})
</script>

<style scoped>
.admin-page {
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
}

/* 左侧导航栏 */
.sidebar {
  width: 250px;
  background: #f9fafb;
  border-right: 1px solid #fbbf24;
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
  background: #fbbf24;
  color: white;
  border-left-color: #f59e0b;
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

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #fbbf24;
  margin: 0;
}

/* 暂无数据页面 */
.admin-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.no-data {
  text-align: center;
  padding: 3rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  max-width: 400px;
  width: 100%;
}

.no-data-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
}

.no-data-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.no-data-description {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-page {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #fbbf24;
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
  
  .page-title {
    font-size: 1.5rem;
  }
}
</style>

