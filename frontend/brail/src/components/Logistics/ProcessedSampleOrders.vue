<template>
  <div class="processed-sample-orders-container">
    <div class="page-header">
      <h2 class="page-title">已处理订单</h2>
      <div class="order-stats">
        <div class="stat-item">
          <span class="stat-label">总订单数</span>
          <span class="stat-value">{{ orders.length }}</span>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="no-data">
        <div class="no-data-icon">⏳</div>
        <div class="no-data-title">加载中...</div>
        <div class="no-data-description">正在获取已处理订单数据</div>
      </div>
    </div>

    <!-- 暂无数据 -->
    <div v-else-if="orders.length === 0" class="empty-container">
      <div class="no-data">
        <div class="no-data-icon">📦</div>
        <div class="no-data-title">暂无数据</div>
        <div class="no-data-description">还没有已处理的订单</div>
      </div>
    </div>

    <!-- 订单列表 -->
    <div v-else class="orders-list">
      <div 
        v-for="order in orders" 
        :key="order.id"
        class="order-card"
        :class="{ 'expanded': expandedOrder === order.id }"
      >
        <!-- 订单基本信息 -->
        <div class="order-header" @click="toggleOrder(order.id)">
          <div class="order-info">
            <div class="order-id">#{{ order.id }}</div>
            <div class="order-meta">
              <span class="customer-name">{{ order.customer_name }}</span>
              <span class="order-date">{{ formatDate(order.orderDate) }}</span>
            </div>
            <div class="order-summary">{{ order.items.length }} 产品 ({{ getTotalQuantity(order) }} 单位)</div>
          </div>
          <div class="order-status-badge">
            <span :class="['status-badge', order.statusClass]">
              {{ order.status }}
            </span>
            <div class="expand-icon" :class="{ 'expanded': expandedOrder === order.id }">
              ▼
            </div>
          </div>
        </div>

        <!-- 展开的订单详情 -->
        <div v-if="expandedOrder === order.id" class="order-details">
          <!-- 订单项目 -->
          <div class="order-items">
            <h3 class="section-title">订单商品</h3>
            <div v-for="item in order.items" :key="item.id" class="order-item">
              <div class="item-image">
                <img 
                  :src="item.image || 'https://via.placeholder.com/100x100/10b981/ffffff?text=Product'" 
                  :alt="item.productName" 
                />
              </div>
              <div class="item-info">
                <div class="item-description">{{ item.productName }}</div>
                <div class="item-pricing">
                  <div class="total-price">CN ¥{{ formatAmount(item.price * item.quantity) }}</div>
                  <div class="unit-price">单价: ¥{{ formatAmount(item.price) }}</div>
                </div>
                <div class="item-controls">
                  <div class="quantity-display">
                    <span class="quantity-label">数量:</span>
                    <span class="quantity">{{ item.quantity }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 订单跟踪 -->
          <div class="order-tracking">
            <h3 class="section-title">订单进度</h3>
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
              <div class="status-icon">{{ getStatusIcon(order.status) }}</div>
              <div class="status-title">{{ order.statusText }}</div>
            </div>
            <div class="status-tag" :class="order.statusClass">
              {{ order.statusDetailText }}
            </div>
            <div class="status-timestamp">
              订单时间: {{ formatDate(order.orderDate) }}
            </div>
          </div>

          <!-- 客户信息 -->
          <div class="customer-info" v-if="order.shipping">
            <h3 class="section-title">客户信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">客户名称:</span>
                <span class="info-value">{{ order.customer_name }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">配送地址:</span>
                <span class="info-value">{{ order.shipping.street }}, {{ order.shipping.city }} {{ order.shipping.zipcode }}</span>
              </div>
              <div class="info-item" v-if="order.payment_method">
                <span class="info-label">支付方式:</span>
                <span class="info-value">{{ order.payment_method }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">订单总额:</span>
                <span class="info-value total-amount">¥{{ formatAmount(order.total_amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getLogisticsSampleProcessedOrders } from '../../utils/api.js'
import { useUserStore } from '../../stores/user.js'

// 用户 store
const userStore = useUserStore()

// 响应式数据
const orders = ref([])
const loading = ref(false)
const expandedOrder = ref(null)

// 方法
const loadOrders = async () => {
  try {
    loading.value = true
    const userId = userStore.getUserId()
    const response = await getLogisticsSampleProcessedOrders(userId)
    
    if (response.success && response.orders) {
      orders.value = response.orders
    }
  } catch (error) {
    console.error('Failed to load processed sample orders:', error)
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

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatAmount = (amount) => {
  return amount.toFixed(2)
}

const getStatusIcon = (status) => {
  const iconMap = {
    'Processing': '⚙️',
    'Shipped': '🚚',
    'Customs': '🏛️',
    'Cleared': '✅',
    'Delivered': '📦',
    'Rejected': '❌',
    'Cancelled': '🚫'
  }
  return iconMap[status] || '📋'
}

// 生命周期
onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.processed-sample-orders-container {
  width: 100%;
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.order-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #6b7280;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fbbf24;
}

/* 加载和空状态 */
.loading-container,
.empty-container {
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

/* 订单列表 */
.orders-list {
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
  border-color: #fbbf24;
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
  flex: 1;
}

.order-id {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  font-family: 'Courier New', monospace;
}

.order-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
}

.customer-name {
  color: #6b7280;
  font-weight: 500;
}

.order-date {
  color: #9ca3af;
}

.order-summary {
  font-size: 0.9rem;
  color: #6b7280;
}

.order-status-badge {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-processing {
  background: #dbeafe;
  color: #1e40af;
}

.status-shipped {
  background: #fef3c7;
  color: #92400e;
}

.status-delivered {
  background: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-customs {
  background: #fed7aa;
  color: #c2410c;
}

.status-cleared {
  background: #e9d5ff;
  color: #6b21a8;
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

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

/* 订单商品 */
.order-items {
  margin-bottom: 2rem;
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

/* 订单跟踪 */
.order-tracking {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #fef3c7, #d1fae5);
  border-radius: 8px;
  border: 1px solid #fbbf24;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.1);
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
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #fbbf24;
}

.status-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.status-icon {
  font-size: 1.5rem;
}

.status-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.status-tag {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}

.status-tag.status-processing {
  background: #dbeafe;
  color: #1e40af;
}

.status-tag.status-shipped {
  background: #fef3c7;
  color: #92400e;
}

.status-tag.status-delivered {
  background: #d1fae5;
  color: #065f46;
}

.status-tag.status-customs {
  background: #fed7aa;
  color: #c2410c;
}

.status-tag.status-cleared {
  background: #e9d5ff;
  color: #6b21a8;
}

.status-tag.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-tag.status-cancelled {
  background: #f3f4f6;
  color: #6b7280;
}

.status-timestamp {
  font-size: 0.9rem;
  color: #6b7280;
}

/* 客户信息 */
.customer-info {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 1rem;
  color: #1f2937;
  font-weight: 500;
}

.total-amount {
  font-size: 1.2rem;
  color: #fbbf24;
  font-weight: 700;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .order-status-badge {
    width: 100%;
    justify-content: space-between;
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

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>