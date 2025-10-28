<template>
  <div class="processing-dashboard">
    <!-- 订单列表区域 -->
    <div class="orders-section">
      <div class="section-header">
        <h2 class="section-title">准备发货订单</h2>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>加载订单中...</p>
      </div>
      
      <!-- 订单表格 -->
      <div v-else-if="orders.length > 0" class="orders-table">
        <table>
          <thead>
            <tr>
              <th>订单ID</th>
              <th>客户</th>
              <th>日期</th>
              <th>总额</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="order in orders" 
              :key="order.id"
              :class="{ 'selected': selectedOrder?.id === order.id }"
              @click="selectOrder(order)"
            >
              <td class="order-id">#{{ order.id }}</td>
              <td>{{ order.customer_name }}</td>
              <td>{{ formatDate(order.orderDate) }}</td>
              <td>¥{{ formatAmount(order.total_amount) }}</td>
              <td>
                <span :class="['status-badge', order.statusClass]">
                  {{ order.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>暂无准备发货订单</h3>
        <p>当前没有需要处理的准备发货订单。</p>
      </div>
    </div>
    
    <!-- 订单详情区域 -->
    <div class="order-details-section" v-if="selectedOrder">
      <div class="details-header">
        <h3>订单详情</h3>
        <div class="order-status-info">
          <span class="order-label">订单ID: #{{ selectedOrder.id }}</span>
          <span :class="['status-badge', selectedOrder.statusClass]">
            {{ selectedOrder.statusText }}
          </span>
        </div>
      </div>
      
      <!-- 客户信息 -->
      <div class="details-section">
        <h4 class="section-subtitle">客户信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <strong>{{ selectedOrder.customer_name }}</strong>
          </div>
          <div class="info-item" v-if="selectedOrder.shipping">
            <div>{{ selectedOrder.shipping.street }}</div>
            <div>{{ selectedOrder.shipping.city }}, {{ selectedOrder.shipping.zipcode }}</div>
          </div>
        </div>
      </div>
      
      <!-- 订单商品 -->
      <div class="details-section">
        <h4 class="section-subtitle">订单商品</h4>
        <div class="items-list">
          <div 
            v-for="item in selectedOrder.items" 
            :key="item.id"
            class="order-item"
          >
            <img 
              :src="item.image || 'https://via.placeholder.com/60x60'" 
              :alt="item.productName"
              class="item-image"
            />
            <div class="item-info">
              <div class="item-name">{{ item.productName }}</div>
              <div class="item-quantity">x{{ item.quantity }}</div>
            </div>
            <div class="item-price">¥{{ formatAmount(item.price * item.quantity) }}</div>
          </div>
        </div>
      </div>
      
      <!-- 支付摘要 -->
      <div class="details-section">
        <h4 class="section-subtitle">支付摘要</h4>
        <div class="payment-summary">
          <div class="summary-row">
            <span>小计</span>
            <span>¥{{ formatAmount(calculateSubtotal()) }}</span>
          </div>
          <div class="summary-row">
            <span>运费</span>
            <span>¥0.00</span>
          </div>
          <div class="summary-row total">
            <strong>总计</strong>
            <strong>¥{{ formatAmount(selectedOrder.total_amount) }}</strong>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="actions-section">
        <button 
          class="action-btn approve-btn"
          @click="approveOrderAction"
          :disabled="actionLoading"
        >
          {{ actionLoading ? '处理中...' : '接收货物' }}
        </button>
        <button 
          class="action-btn reject-btn"
          @click="rejectOrderAction"
          :disabled="actionLoading"
        >
          {{ actionLoading ? '处理中...' : '拒绝订单' }}
        </button>
      </div>
    </div>
    
    <!-- 未选择订单时的右侧状态 -->
    <div class="no-selection" v-else>
      <div class="no-selection-icon">👈</div>
      <p>从列表中选择订单查看详情</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getLogisticsProcessingOrders, updateLogisticsOrderStatus } from '../../utils/api.js'
import { useUserStore } from '../../stores/user.js'

// 用户 store
const userStore = useUserStore()

// 响应式数据
const orders = ref([])
const selectedOrder = ref(null)
const loading = ref(false)
const actionLoading = ref(false)

// 方法
const loadOrders = async () => {
  try {
    loading.value = true
    const userId = userStore.getUserId()
    const response = await getLogisticsProcessingOrders(userId)
    
    if (response.success && response.orders) {
      orders.value = response.orders
    }
  } catch (error) {
    console.error('Failed to load processing orders:', error)
  } finally {
    loading.value = false
  }
}

const selectOrder = (order) => {
  selectedOrder.value = order
}

const approveOrderAction = async () => {
  if (!selectedOrder.value || actionLoading.value) return
  
  if (!confirm(`确定要接收货物 #${selectedOrder.value.id} 吗？`)) {
    return
  }
  
  try {
    actionLoading.value = true
    const userId = userStore.getUserId()
    const response = await updateLogisticsOrderStatus(selectedOrder.value.id, userId, 'approve')
    
    if (response.success) {
      alert('货物已接收！')
      // 重新加载订单列表
      await loadOrders()
      // 清除选择
      selectedOrder.value = null
    }
  } catch (error) {
    console.error('Failed to approve order:', error)
    alert('接收货物失败，请重试。')
  } finally {
    actionLoading.value = false
  }
}

const rejectOrderAction = async () => {
  if (!selectedOrder.value || actionLoading.value) return
  
  const reason = prompt(`请提供拒绝订单 #${selectedOrder.value.id} 的原因：`)
  if (reason === null) return // 用户取消
  
  try {
    actionLoading.value = true
    const userId = userStore.getUserId()
    const response = await updateLogisticsOrderStatus(selectedOrder.value.id, userId, 'reject', reason)
    
    if (response.success) {
      alert('订单已拒绝！')
      // 重新加载订单列表
      await loadOrders()
      // 清除选择
      selectedOrder.value = null
    }
  } catch (error) {
    console.error('Failed to reject order:', error)
    alert('拒绝订单失败，请重试。')
  } finally {
    actionLoading.value = false
  }
}

const calculateSubtotal = () => {
  if (!selectedOrder.value || !selectedOrder.value.items) return 0
  return selectedOrder.value.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)
}

const formatDate = (date) => {
  if (!date) return ''
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
.processing-dashboard {
  display: flex;
  gap: 1.5rem;
  width: 100%;
  min-height: calc(100vh - 4rem);
}

.orders-section {
  flex: 2;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.loading-state {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.orders-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #6b7280;
  font-size: 0.9rem;
}

tbody tr {
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s;
}

tbody tr:hover {
  background: #f9fafb;
}

tbody tr.selected {
  background: #ecfdf5;
  border-left: 3px solid #10b981;
}

td {
  padding: 1rem;
  color: #374151;
}

.order-id {
  font-weight: 600;
  color: #10b981;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status-processing {
  background: #dbeafe;
  color: #1e40af;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.order-details-section {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
}

.details-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.details-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.order-status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-label {
  font-size: 0.9rem;
  color: #6b7280;
}

.details-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-subtitle {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.info-item {
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.item-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.item-quantity {
  color: #6b7280;
  font-size: 0.85rem;
}

.item-price {
  font-weight: 600;
  color: #10b981;
}

.payment-summary {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  color: #6b7280;
}

.summary-row.total {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 2px solid #e5e7eb;
  color: #1f2937;
  font-size: 1.1rem;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.approve-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.approve-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
}

.reject-btn {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
}

.reject-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(251, 191, 36, 0.4);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.no-selection {
  flex: 1;
  background: white;
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.no-selection-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .processing-dashboard {
    flex-direction: column;
  }
  
  .order-details-section,
  .no-selection {
    max-height: none;
  }
}
</style>
