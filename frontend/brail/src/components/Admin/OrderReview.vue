<template>
  <div class="order-review-dashboard">
    <!-- 中间：订单列表 -->
    <div class="orders-section">
      <div class="section-header">
        <h2 class="section-title">Order Review Dashboard</h2>
        
        <div class="filters">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search by Order ID or Customer"
              @input="filterOrders"
            />
          </div>
          
          <select v-model="dateFilter" class="date-filter">
            <option value="">Date Range</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
      
      <!-- 订单表格 -->
      <div v-else-if="filteredOrders.length > 0" class="orders-table">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="order in paginatedOrders" 
              :key="order.id"
              :class="{ 'selected': selectedOrder?.id === order.id }"
              @click="selectOrder(order)"
            >
              <td class="order-id">#{{ order.id }}</td>
              <td>{{ order.customer_name }}</td>
              <td>{{ formatDate(order.orderDate) }}</td>
              <td>${{ order.total_amount.toFixed(2) }}</td>
              <td>
                <span :class="['status-badge', `status-${order.status.toLowerCase()}`]">
                  {{ order.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- 分页 -->
        <div class="pagination">
          <button 
            @click="previousPage" 
            :disabled="currentPage === 1"
            class="page-btn"
          >
            Previous
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="page-btn"
          >
            Next
          </button>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No Orders Found</h3>
        <p>There are no pending orders to review at the moment.</p>
      </div>
    </div>
    
    <!-- 右侧：订单详情 -->
    <div class="order-details-section" v-if="selectedOrder">
      <div class="details-header">
        <h3>Order Details</h3>
        <div class="order-status-info">
          <span class="order-label">Order ID: #{{ selectedOrder.id }}</span>
          <span :class="['status-badge', `status-${selectedOrder.status.toLowerCase()}`]">
            {{ selectedOrder.statusText }}
          </span>
        </div>
      </div>
      
      <!-- 客户信息 -->
      <div class="details-section">
        <h4 class="section-subtitle">Customer Info</h4>
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
        <h4 class="section-subtitle">Items Ordered</h4>
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
            <div class="item-price">${{ (item.price * item.quantity).toFixed(2) }}</div>
          </div>
        </div>
      </div>
      
      <!-- 支付摘要 -->
      <div class="details-section">
        <h4 class="section-subtitle">Payment Summary</h4>
        <div class="payment-summary">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>${{ calculateSubtotal().toFixed(2) }}</span>
          </div>
          <div class="summary-row">
            <span>Shipping</span>
            <span>$0.00</span>
          </div>
          <div class="summary-row total">
            <strong>Total</strong>
            <strong>${{ selectedOrder.total_amount.toFixed(2) }}</strong>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="actions-section" v-if="selectedOrder.status === 'Pending'">
        <button 
          class="action-btn approve-btn"
          @click="approveOrderAction"
          :disabled="actionLoading"
        >
          {{ actionLoading ? 'Processing...' : 'Approve Order' }}
        </button>
        <button 
          class="action-btn reject-btn"
          @click="rejectOrderAction"
          :disabled="actionLoading"
        >
          {{ actionLoading ? 'Processing...' : 'Reject Order' }}
        </button>
      </div>
      
      <!-- 已处理订单状态显示 -->
      <div class="status-message" v-else>
        <div v-if="selectedOrder.status === 'Approved'" class="status-approved">
          ✓ This order has been approved
        </div>
        <div v-if="selectedOrder.status === 'Rejected'" class="status-rejected">
          ✗ This order has been rejected
        </div>
      </div>
    </div>
    
    <!-- 未选择订单时的右侧状态 -->
    <div class="no-selection" v-else>
      <div class="no-selection-icon">👈</div>
      <p>Select an order from the list to view details</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPendingOrders, approveOrder, rejectOrder } from '../../utils/api.js'
import { useUserStore } from '../../stores/user.js'

// 用户 store
const userStore = useUserStore()

// 响应式数据
const orders = ref([])
const selectedOrder = ref(null)
const loading = ref(false)
const actionLoading = ref(false)
const searchQuery = ref('')
const dateFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

// 计算属性
const filteredOrders = computed(() => {
  let filtered = orders.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(order => 
      order.id.toLowerCase().includes(query) ||
      order.customer_name.toLowerCase().includes(query)
    )
  }
  
  // 注意：待审核订单只有一个状态（Pending），不需要状态过滤
  
  return filtered
})

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredOrders.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / itemsPerPage)
})

// 方法
const loadOrders = async () => {
  try {
    loading.value = true
    const userId = userStore.getUserId()
    const response = await getPendingOrders(userId)
    
    if (response.success && response.orders) {
      orders.value = response.orders
    }
  } catch (error) {
    console.error('Failed to load pending orders:', error)
  } finally {
    loading.value = false
  }
}

const selectOrder = (order) => {
  selectedOrder.value = order
}

const approveOrderAction = async () => {
  if (!selectedOrder.value || actionLoading.value) return
  
  if (!confirm(`Are you sure you want to approve order #${selectedOrder.value.id}?`)) {
    return
  }
  
  try {
    actionLoading.value = true
    const userId = userStore.getUserId()
    const response = await approveOrder(selectedOrder.value.id, userId)
    
    if (response.success) {
      alert('Order approved successfully!')
      // 重新加载订单列表
      await loadOrders()
      // 清除选择
      selectedOrder.value = null
    }
  } catch (error) {
    console.error('Failed to approve order:', error)
    alert('Failed to approve order. Please try again.')
  } finally {
    actionLoading.value = false
  }
}

const rejectOrderAction = async () => {
  if (!selectedOrder.value || actionLoading.value) return
  
  const reason = prompt(`Please provide a reason for rejecting order #${selectedOrder.value.id}:`)
  if (reason === null) return // 用户取消
  
  try {
    actionLoading.value = true
    const userId = userStore.getUserId()
    const response = await rejectOrder(selectedOrder.value.id, userId, reason)
    
    if (response.success) {
      alert('Order rejected successfully!')
      // 重新加载订单列表
      await loadOrders()
      // 清除选择
      selectedOrder.value = null
    }
  } catch (error) {
    console.error('Failed to reject order:', error)
    alert('Failed to reject order. Please try again.')
  } finally {
    actionLoading.value = false
  }
}

const filterOrders = () => {
  currentPage.value = 1
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

const calculateSubtotal = () => {
  if (!selectedOrder.value || !selectedOrder.value.items) return 0
  return selectedOrder.value.items.reduce((sum, item) => {
    return sum + (item.price * item.quantity)
  }, 0)
}

// 生命周期
onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.order-review-dashboard {
  display: flex;
  gap: 1.5rem;
  width: 100%;
  min-height: calc(100vh - 4rem);
}

/* 订单列表区域 */
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

.filters {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.search-box {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  font-size: 1rem;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
}

.date-filter {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
  min-width: 150px;
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

/* 订单表格 */
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

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #10b981;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #6b7280;
  font-size: 0.9rem;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

/* 订单详情区域 */
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

/* 订单商品列表 */
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

/* 支付摘要 */
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

/* 操作按钮 */
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

/* 状态消息 */
.status-message {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
}

.status-message .status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-message .status-rejected {
  background: #fee2e2;
  color: #991b1b;
}

/* 未选择状态 */
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
  .order-review-dashboard {
    flex-direction: column;
  }
  
  .order-details-section,
  .no-selection {
    max-height: none;
  }
}
</style>

