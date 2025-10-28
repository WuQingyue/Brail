<template>
  <div class="order-page">
    <!-- 左侧导航栏 -->
    <div class="sidebar">
      <div class="sidebar-content">
        <div class="nav-item" :class="{ active: currentTab === 'account' }" @click="currentTab = 'account'">
          <div class="nav-icon">👤</div>
          <div class="nav-text">我的账户</div>
        </div>
        <div class="nav-item" :class="{ active: currentTab === 'orders' }" @click="currentTab = 'orders'">
          <div class="nav-icon">🛒</div>
          <div class="nav-text">我的请求</div>
        </div>
      </div>
    </div>

    <!-- 右侧主内容区域 -->
    <div class="main-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">{{ currentTab === 'account' ? '我的账户' : '我的请求' }}</h1>
      </div>

      <!-- 我的账户页面 -->
      <div v-if="currentTab === 'account'" class="account-container">
        <div class="no-data">
          <div class="no-data-icon">📊</div>
          <div class="no-data-title">暂无数据</div>
          <div class="no-data-description">账户信息正在完善中，敬请期待</div>
        </div>
      </div>

      <!-- 订单列表 -->
      <div v-else class="orders-container">
        <!-- 加载状态 -->
        <div v-if="loading" class="account-container">
          <div class="no-data">
            <div class="no-data-icon">⏳</div>
            <div class="no-data-title">加载中...</div>
            <div class="no-data-description">正在获取订单数据</div>
          </div>
        </div>
        
        <!-- 暂无数据提示 -->
        <div v-else-if="filteredOrders.length === 0" class="account-container">
          <div class="no-data">
            <div class="no-data-icon">📦</div>
            <div class="no-data-title">暂无数据</div>
            <div class="no-data-description">您还没有任何订单请求</div>
          </div>
        </div>
        
        <div 
          v-else
          v-for="order in filteredOrders" 
          :key="order.id"
          class="order-card"
          :class="{ 'expanded': expandedOrder === order.id }"
        >
          <!-- 订单基本信息 -->
          <div class="order-header" @click="toggleOrder(order.id)">
            <div class="order-info">
              <div class="order-id">#{{ order.id }}</div>
              <div class="order-summary">{{ order.items.length }} 产品 ({{ getTotalQuantity(order) }} 单位)</div>
            </div>
            <div class="expand-icon" :class="{ 'expanded': expandedOrder === order.id }">
              ▼
            </div>
          </div>

          <!-- 展开的订单详情 -->
          <div v-if="expandedOrder === order.id" class="order-details">
            <!-- 订单项目 -->
            <div v-for="item in order.items" :key="item.id" class="order-item">
              <div class="item-image">
                <img :src="item.image || 'https://via.placeholder.com/100x100/10b981/ffffff?text=Product'" :alt="item.productName" />
              </div>
              <div class="item-info">
                <div class="item-description">{{ item.productName }}</div>
                <div class="item-standard">标准</div>
                <div class="item-pricing">
                  <div class="total-price">CN ¥{{ formatAmount(item.price * item.quantity) }}</div>
                  <div class="unit-price">单价: ¥{{ formatAmount(item.price) }}</div>
                </div>
                <div class="item-shipping">运费中国: N/A</div>
                <div class="item-controls">
                  <div class="quantity-display">
                    <span class="quantity-label">数量:</span>
                    <span class="quantity">{{ item.quantity }}</span>
                  </div>
                  <div class="moq-tag">1688 MOQ: 1</div>
                </div>
              </div>
            </div>

            <!-- 订单跟踪 -->
            <div class="order-tracking">
              <h3 class="tracking-title">跟踪您的请求</h3>
              <div class="progress-timeline">
                <div class="timeline-step" :class="{ active: order.statusStep >= 1 }">
                  <div class="step-icon">📋</div>
                  <div class="step-text">订单审批</div>
                </div>
                <div class="timeline-step" :class="{ active: order.statusStep >= 2 }">
                  <div class="step-icon">📦</div>
                  <div class="step-text">准备发货</div>
                </div>
                <div class="timeline-step" :class="{ active: order.statusStep >= 3 }">
                  <div class="step-icon">🚚</div>
                  <div class="step-text">运输中</div>
                </div>
                <div class="timeline-step" :class="{ active: order.statusStep >= 4 }">
                  <div class="step-icon">🏛️</div>
                  <div class="step-text">到达巴西清关</div>
                </div>
                <div class="timeline-step" :class="{ active: order.statusStep >= 5 }">
                  <div class="step-icon">✅</div>
                  <div class="step-text">清关完成-运输</div>
                </div>
                <div class="timeline-step" :class="{ active: order.statusStep >= 6 }">
                  <div class="step-icon">🎉</div>
                  <div class="step-text">已交付</div>
                </div>
              </div>
            </div>

            <!-- 订单状态详情 -->
            <div class="order-status-detail">
              <div class="status-header">
                <div class="status-icon">🛒</div>
                <div class="status-title">{{ order.statusText }}</div>
              </div>
              <div class="status-tag" :class="order.statusClass">
                {{ order.statusDetailText }}
              </div>
              <div class="status-timestamp">
                开始时间: {{ formatDate(order.orderDate) }} | 预计时间: 未确定
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getOrderList } from '../../utils/api.js'
import { useUserStore } from '../../stores/user.js'

// 响应式数据
const orders = ref([])
const loading = ref(false)
const expandedOrder = ref(null)
const currentTab = ref('orders')

// 获取用户store
const userStore = useUserStore()

// 计算属性
const filteredOrders = computed(() => {
  return orders.value
})

// 方法
const loadOrders = async () => {
  loading.value = true
  try {
    // 获取用户ID
    const userId = userStore.getUserId()
    
    if (!userId) {
      console.warn('用户未登录，无法加载订单')
      orders.value = []
      return
    }
    
    // 获取订单列表
    const response = await getOrderList(userId)
    console.log('获取到订单列表:', response)
    
    if (response.success && response.orders) {
      // 设置订单列表
      orders.value = response.orders
      console.log('已加载订单数量:', orders.value.length)
    } else {
      orders.value = []
    }
  } catch (error) {
    console.error('加载订单失败:', error)
    orders.value = []
  } finally {
    loading.value = false
  }
}

const toggleOrder = (orderId) => {
  expandedOrder.value = expandedOrder.value === orderId ? null : orderId
}

const getTotalQuantity = (order) => {
  return order.items.reduce((total, item) => total + item.quantity, 0)
}

// 数量调整功能已移除，订单信息为固定值

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatAmount = (amount) => {
  return amount.toFixed(2)
}

// 生命周期
onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-page {
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
}

/* 左侧导航栏 */
.sidebar {
  width: 250px;
  background: #f9fafb;
  border-right: 1px solid #10b981;
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
  background: #d1fae5;
  color: #065f46;
}

.nav-item.active {
  background: #10b981;
  color: white;
  border-left-color: #10b981;
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
  color: #10b981;
  margin: 0;
}

/* 订单卡片 */
.orders-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.3s ease;
}

.order-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border-color: #10b981;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  cursor: pointer;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.order-id {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  font-family: 'Courier New', monospace;
}

.order-summary {
  font-size: 0.9rem;
  color: #6b7280;
}

.expand-icon {
  font-size: 1.2rem;
  color: #6b7280;
  transition: transform 0.3s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

/* 订单详情 */
.order-details {
  padding: 2rem;
  background: white;
}

.order-item {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: #f9fafb;
}

.item-image {
  flex-shrink: 0;
}

.item-image img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-description {
  font-size: 1rem;
  font-weight: 500;
  color: #1f2937;
  line-height: 1.4;
}

.item-standard {
  font-size: 0.8rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  width: fit-content;
}

.item-pricing {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.total-price {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.unit-price {
  font-size: 0.9rem;
  color: #6b7280;
}

.item-shipping {
  font-size: 0.9rem;
  color: #6b7280;
}

.item-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.quantity-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-label {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 500;
}

.quantity {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  border: 1px solid #d1d5db;
}

.moq-tag {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

/* 订单跟踪 */
.order-tracking {
  margin-top: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fef3c7, #d1fae5);
  border-radius: 8px;
  border: 1px solid #fbbf24;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1);
}

.tracking-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
}

.progress-timeline {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.progress-timeline::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #fbbf24, #10b981);
  z-index: 1;
  border-radius: 2px;
}

.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  z-index: 2;
  background: white;
  padding: 0 1rem;
}

.step-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s ease;
  border: 2px solid #e5e7eb;
}

.timeline-step.active .step-icon {
  background: linear-gradient(135deg, #fbbf24, #10b981);
  color: white;
  border-color: #10b981;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.step-text {
  font-size: 0.8rem;
  color: #6b7280;
  text-align: center;
  font-weight: 500;
  transition: all 0.3s ease;
}

.timeline-step.active .step-text {
  color: #10b981;
  font-weight: 600;
}

/* 订单状态详情 */
.order-status-detail {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fef3c7, #fed7aa);
  border-radius: 12px;
  border: 1px solid #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
  position: relative;
  overflow: hidden;
}

.order-status-detail::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.8), rgba(254, 215, 170, 0.8));
  border-radius: 12px;
  z-index: 1;
}

.order-status-detail > * {
  position: relative;
  z-index: 2;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.status-icon {
  font-size: 1.2rem;
}

.status-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #92400e;
}

.status-tag {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  text-align: center;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #92400e;
  border: 2px solid #d97706;
  box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);
  min-width: 200px;
}

.status-tag.status-pending {
  background: linear-gradient(135deg, #fef3c7, #fbbf24);
  color: #92400e;
  border: 2px solid #f59e0b;
}

.status-tag.status-processing {
  background: linear-gradient(135deg, #fef3c7, #fbbf24);
  color: #92400e;
  border: 2px solid #f59e0b;
}

.status-tag.status-shipped {
  background: linear-gradient(135deg, #fef3c7, #fbbf24);
  color: #92400e;
  border: 2px solid #f59e0b;
}

.status-tag.status-customs {
  background: linear-gradient(135deg, #fef3c7, #fbbf24);
  color: #92400e;
  border: 2px solid #f59e0b;
}

.status-tag.status-cleared {
  background: linear-gradient(135deg, #fef3c7, #fbbf24);
  color: #92400e;
  border: 2px solid #f59e0b;
}

.status-tag.status-delivered {
  background: linear-gradient(135deg, #d1fae5, #10b981);
  color: #065f46;
  border: 2px solid #059669;
}

.status-timestamp {
  font-size: 0.9rem;
  color: #92400e;
  font-weight: 500;
}

/* 暂无数据页面 */
.account-container {
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
  .order-page {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .sidebar-content {
    display: flex;
    padding: 1rem 0;
  }
  
  .nav-item {
    flex: 1;
    justify-content: center;
    padding: 1rem;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .order-item {
    flex-direction: column;
    gap: 1rem;
  }
  
  .item-image {
    align-self: center;
  }
  
  .progress-timeline {
    flex-direction: column;
    gap: 1rem;
  }
  
  .progress-timeline::before {
    display: none;
  }
  
  .timeline-step {
    padding: 0;
  }
}
</style>
