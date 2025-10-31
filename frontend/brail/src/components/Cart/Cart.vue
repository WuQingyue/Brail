<template>
  <div v-if="isVisible" class="cart-overlay" @click="closeCart">
    <div class="cart-dialog" @click.stop>
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="closeCart">×</button>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>正在加载购物车...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="loadCartData" class="retry-btn">重试</button>
      </div>
      
      <!-- 空购物车状态 -->
      <div v-else-if="cartItems.length === 0" class="empty-cart">
        <div class="empty-icon">🛒</div>
        <h3>购物车为空</h3>
        <p>您还没有添加任何商品到购物车</p>
      </div>
      
      <!-- 购物车内容 -->
      <div v-else class="cart-content">
        <div class="cart-main">
          <!-- 左侧商品列表 -->
          <div class="cart-items">
            <!-- 标题和统计 -->
            <div class="cart-header">
              <h2 class="cart-title">购物车</h2>
              <div class="product-count">
                {{ cartItems.length }}件商品 | {{ totalUnits }}单位
              </div>
            </div>
            
            <!-- 商品卡片 -->
            <div class="product-card" v-for="item in cartItems" :key="item.id">
              <!-- 复选框 -->
              <div class="checkbox-container">
                <input 
                  type="checkbox" 
                  :id="'item-' + item.id"
                  v-model="item.selected"
                  class="item-checkbox"
                />
                <label :for="'item-' + item.id" class="checkbox-label"></label>
              </div>
              
              <div class="product-image">
                <img :src="item.image" :alt="item.name" />
              </div>
              
              <div class="product-info">
                <h3 class="product-name">{{ item.name }}</h3>
                <p class="product-description">{{ item.description }}</p>
                <div class="product-spec">{{ item.specification }}</div>
                
                <div class="price-info">
                  <div class="total-price">CN R$ {{ formatPrice(item.totalPrice) }}</div>
                  <div class="unit-price">Unit: R$ {{ formatPrice(item.unitPrice) }}</div>
                </div>
                
                <div class="quantity-section">
                  <div class="moq-tag">MOQ: {{ item.moq }}</div>
                  
                  <div class="quantity-control">
                    <button 
                      class="quantity-decrease" 
                      @click="decreaseQuantity(item)"
                      :disabled="item.quantity <= item.moq"
                    >-</button>
                    <input 
                      type="number" 
                      v-model.number="item.quantity"
                      class="quantity-input"
                      :min="item.moq"
                      @input="onQuantityInput(item)"
                    />
                    <button 
                      class="quantity-increase" 
                      @click="increaseQuantity(item)"
                    >+</button>
                  </div>
                  
                  <!-- 确认按钮 -->
                  <button 
                    class="confirm-btn" 
                    @click="confirmQuantityChange(item)"
                    :disabled="!item.hasChanges"
                    title="确认数量变更"
                  >
                    ✓
                  </button>
                  
                  <button class="delete-btn" @click="removeItem(item)">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 右侧总计摘要 -->
          <div class="investment-summary">
            <div class="summary-header">
              <h3 class="investment-title">总计</h3>
            </div>
            
            <div class="total-section">
              <div class="total-amount">R$ {{ formatPrice(cartSummary.totalAmount) }}</div>
            </div>
            
              <div class="action-section">
                <button 
                  class="submit-btn" 
                  @click="submitOrder"
                  :disabled="!hasSelectedItems"
                >
                  完成申请
                </button>
                <a href="#" class="help-link">需要帮助</a>
              </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单确认与票据上传模态框 -->
    <div v-if="showOrderConfirmModal" class="order-confirm-overlay" @click="closeOrderConfirmModal">
      <div class="order-confirm-modal" @click.stop>
        <!-- 标题栏 -->
        <div class="modal-header">
          <h2 class="modal-title">订单确认与票据上传</h2>
          <button class="modal-close-btn" @click="closeOrderConfirmModal">&times;</button>
        </div>

        <!-- 说明文字 -->
        <div class="modal-instruction">
          <p>请上传您的银行付款票据以完成订单。</p>
        </div>

        <!-- 上传区域 -->
        <div class="upload-section">
          <label class="upload-label">上传银行票据</label>
          <div 
            class="upload-area"
            :class="{ 'dragover': isDragover, 'has-file': uploadedFile }"
            @drop="handleDrop"
            @dragover.prevent="isDragover = true"
            @dragleave="isDragover = false"
            @click="triggerFileInput"
          >
            <input 
              ref="fileInput"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              @change="handleFileSelect"
              style="display: none"
            />
            <div v-if="!uploadedFile" class="upload-placeholder">
              <div class="upload-icon">☁️ ⬆️</div>
              <div class="upload-text">
                <span class="upload-link">点击上传</span> 或拖拽文件到此
              </div>
              <div class="upload-hint">支持 JPG, PNG, PDF</div>
            </div>
            <div v-else class="uploaded-file">
              <div class="file-icon">{{ getFileIcon(uploadedFile.name) }}</div>
              <div class="file-info">
                <div class="file-name">{{ uploadedFile.name }}</div>
                <div class="file-size">{{ formatFileSize(uploadedFile.size) }}</div>
              </div>
              <button class="remove-file-btn" @click.stop="removeFile">×</button>
            </div>
          </div>

          <!-- 上传要求 -->
          <div class="upload-requirements">
            <ul>
              <li>支持 JPG, PNG, PDF 格式</li>
              <li>文件大小不超过 5MB</li>
              <li>请确保票据内容清晰可见,信息完整</li>
            </ul>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="modal-actions">
          <button class="btn-cancel" @click="closeOrderConfirmModal">取消</button>
          <button 
            class="btn-confirm" 
            @click="confirmOrder"
            :disabled="!uploadedFile || isSubmittingOrder"
          >
            {{ isSubmittingOrder ? '提交中...' : '确认下单' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getCartId, getCartData, updateCartItem, removeCartItem, createOrder } from '../../utils/api.js'
import { useUserStore } from '../../stores/user.js'

// Props
const props = defineProps({
  userId: {
    type: Number,
    required: true
  },
  isVisible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close'])

// 响应式数据
const loading = ref(false)
const error = ref(null)
const cartId = ref(null)
const cartItems = ref([])
const cartSummary = ref({
  totalAmount: 0
})

// 订单确认模态框相关
const showOrderConfirmModal = ref(false)
const uploadedFile = ref(null)
const fileInput = ref(null)
const isDragover = ref(false)
const isSubmittingOrder = ref(false)
const pendingOrderData = ref(null)

// 计算属性
const totalUnits = computed(() => {
  return cartItems.value.reduce((total, item) => total + item.quantity, 0)
})

const hasSelectedItems = computed(() => {
  return cartItems.value.some(item => item.selected)
})

// 方法
const loadCartData = async () => {
  try {
    loading.value = true
    error.value = null
    
    // 先获取购物车ID
    const fetchedCartId = await getCartId(props.userId)
    cartId.value = fetchedCartId
    
    // 再获取购物车数据
    const data = await getCartData(fetchedCartId)
    // 为每个商品添加变更跟踪属性
    cartItems.value = (data.items || []).map(item => ({
      ...item,
      originalQuantity: item.quantity,
      hasChanges: false,
      selected: true // 默认选中状态
    }))
    
    // 如果API返回了摘要数据，使用它；否则计算摘要
    if (data.summary) {
      cartSummary.value = data.summary
    } else {
      calculateCartSummary()
    }
  } catch (err) {
    error.value = '加载购物车失败，请重试'
    console.error('Failed to load cart:', err)
  } finally {
    loading.value = false
  }
}

const increaseQuantity = (item) => {
  const newQuantity = item.quantity + 1
  item.quantity = newQuantity
  item.totalPrice = item.unitPrice * newQuantity
  item.hasChanges = newQuantity !== item.originalQuantity
  // 立即更新购物车摘要（本地计算）
  calculateCartSummary()
}

const decreaseQuantity = (item) => {
  if (item.quantity > item.moq) {
    const newQuantity = item.quantity - 1
    item.quantity = newQuantity
    item.totalPrice = item.unitPrice * newQuantity
    item.hasChanges = newQuantity !== item.originalQuantity
    // 立即更新购物车摘要（本地计算）
    calculateCartSummary()
  }
}

const onQuantityInput = (item) => {
  let quantity = item.quantity
  // 确保数量不小于MOQ
  if (quantity < item.moq) {
    quantity = item.moq
    item.quantity = quantity
  }
  
  item.totalPrice = item.unitPrice * quantity
  item.hasChanges = quantity !== item.originalQuantity
  // 立即更新购物车摘要（本地计算）
  calculateCartSummary()
}

// 确认数量变更，调用API保存
const confirmQuantityChange = async (item) => {
  if (!item.hasChanges) return
  
  try {
    // 调用API更新数量
    await updateCartItem(cartId.value, item.id, item.quantity)
    
    // 更新原始数量，清除变更标记
    item.originalQuantity = item.quantity
    item.hasChanges = false
    
    console.log('数量变更已保存:', item.name, item.quantity)
  } catch (err) {
    console.error('Failed to confirm quantity change:', err)
    // 恢复原值
    item.quantity = item.originalQuantity
    item.totalPrice = item.unitPrice * item.originalQuantity
    item.hasChanges = false
    calculateCartSummary()
  }
}

// 计算购物车摘要
const calculateCartSummary = () => {
  try {
    const totalAmount = cartItems.value.reduce((sum, item) => sum + item.totalPrice, 0)
    
    cartSummary.value = {
      totalAmount
    }
  } catch (err) {
    console.error('Failed to calculate cart summary:', err)
  }
}

const removeItem = async (item) => {
  try {
    await removeCartItem(item.id)
    cartItems.value = cartItems.value.filter(i => i.id !== item.id)
    
    // 重新计算购物车摘要
    calculateCartSummary()
  } catch (err) {
    console.error('Failed to remove item:', err)
  }
}

const submitOrder = async () => {
  // 获取选中的商品
  const selectedItems = cartItems.value.filter(item => item.selected)
  
  if (selectedItems.length === 0) {
    alert('请至少选择一个商品')
    return
  }
  
  // 获取用户信息
  const userStore = useUserStore()
  
  // 构建订单数据（先保存，等上传票据后再创建）
  pendingOrderData.value = {
    user_id: props.userId,
    customer_name: userStore.user?.name || '客户',
    shipping_street: '待填写',
    shipping_city: '待填写',
    shipping_zipcode: '待填写',
    payment_method: '待选择',
    notes: '来自购物车',
    items: selectedItems.map(item => ({
      product_id: item.product_id,  // 直接使用 product_id
      product_name: item.name,
      product_image: item.image,
      quantity: item.quantity,
      price: item.unitPrice
    }))
  }
  
  // 显示订单确认模态框
  showOrderConfirmModal.value = true
}

// 文件上传相关方法
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragover.value = false
  
  const file = event.dataTransfer.files?.[0]
  if (file) {
    validateAndSetFile(file)
  }
}

const validateAndSetFile = (file) => {
  // 验证文件格式
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
  
  if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
    alert('不支持的文件格式。请上传 JPG, PNG 或 PDF 格式的文件。')
    return
  }
  
  // 验证文件大小（5MB）
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    alert('文件大小不能超过 5MB。')
    return
  }
  
  uploadedFile.value = file
}

const removeFile = () => {
  uploadedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const getFileIcon = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png'].includes(extension)) {
    return '🖼️'
  } else if (extension === 'pdf') {
    return '📄'
  }
  return '📎'
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 关闭订单确认模态框
const closeOrderConfirmModal = () => {
  showOrderConfirmModal.value = false
  uploadedFile.value = null
  pendingOrderData.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// 确认下单（只有上传了文件后才创建订单）
const confirmOrder = async () => {
  if (!uploadedFile.value) {
    alert('请先上传银行付款票据')
    return
  }
  
  if (!pendingOrderData.value) {
    alert('订单数据丢失，请重新操作')
    closeOrderConfirmModal()
    return
  }
  
  try {
    isSubmittingOrder.value = true
    
    // 这里可以将文件上传到服务器
    // 为了演示，我们假设文件已经上传，只创建订单
    // 在实际应用中，你需要先上传文件，获取文件URL，然后将URL添加到订单数据中
    
    // 创建订单
    const orderData = {
      ...pendingOrderData.value,
      payment_receipt_file: uploadedFile.value.name, // 实际应用中应该是文件URL
      notes: `来自购物车，付款票据: ${uploadedFile.value.name}`
    }
    
    const response = await createOrder(orderData)
    
    if (response.success) {
      alert(`订单创建成功！订单号: ${response.order_id}`)
      // 关闭模态框和购物车
      closeOrderConfirmModal()
      closeCart()
      // 可以在这里触发刷新订单列表等操作
    } else {
      // 处理订单创建失败的情况
      alert(response.message || '订单提交失败，请重试')
    }
  } catch (error) {
    console.error('Failed to submit order:', error)
    alert('订单提交失败，请重试')
  } finally {
    isSubmittingOrder.value = false
  }
}

const closeCart = () => {
  emit('close')
}

const formatPrice = (price) => {
  return price.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 监听器
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    loadCartData()
  }
})

// 生命周期
onMounted(() => {
  if (props.isVisible) {
    loadCartData()
  }
})
</script>

<style scoped>
.cart-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.cart-dialog {
  background: white;
  border-radius: 16px;
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: white;
  color: #374151;
  transform: scale(1.1);
}

/* 加载和错误状态 */
.loading, .error, .empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.retry-btn {
  background: linear-gradient(135deg, #10b981, #fbbf24);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 1rem;
}

/* 购物车内容 */
.cart-content {
  padding: 2rem;
}

.cart-main {
  display: flex;
  gap: 2rem;
  min-height: 500px;
}

/* 左侧商品列表 */
.cart-items {
  flex: 2;
}

.cart-header {
  margin-bottom: 2rem;
}

.cart-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #10b981, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.product-count {
  color: #6b7280;
  font-size: 0.9rem;
}

.product-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.checkbox-container {
  flex-shrink: 0;
  margin-top: 0.5rem;
}

.item-checkbox {
  display: none;
}

.checkbox-label {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.checkbox-label:hover {
  border-color: #10b981;
}

.item-checkbox:checked + .checkbox-label {
  background: #10b981;
  border-color: #10b981;
}

.item-checkbox:checked + .checkbox-label::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.product-image {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.product-description {
  color: #6b7280;
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.4;
}

.product-spec {
  color: #10b981;
  font-size: 0.8rem;
  font-weight: 500;
}

.price-info {
  display: flex;
  gap: 1rem;
  margin: 0.5rem 0;
}

.total-price {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1f2937;
}

.unit-price {
  font-size: 0.9rem;
  color: #6b7280;
}

.quantity-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.moq-tag {
  background: #fef2f2;
  color: #dc2626;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-decrease,
.quantity-increase {
  width: 2rem;
  height: 2rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.quantity-decrease:hover:not(:disabled),
.quantity-increase:hover {
  background: #f3f4f6;
  border-color: #10b981;
}

.quantity-decrease:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-input {
  width: 4rem;
  height: 2rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
  /* 隐藏number输入框的内置箭头 */
  -moz-appearance: textfield;
  appearance: textfield;
}

.quantity-input::-webkit-outer-spin-button,
.quantity-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.confirm-btn {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #065f46;
  font-weight: bold;
  font-size: 0.9rem;
}

.confirm-btn:hover:not(:disabled) {
  background: #d1fae5;
  border-color: #6ee7b7;
  transform: scale(1.05);
}

.confirm-btn:disabled {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.delete-btn {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

/* 右侧投资摘要 */
.investment-summary {
  flex: 1;
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  height: fit-content;
}

.summary-header {
  margin-bottom: 1.5rem;
}

.investment-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.total-section {
  margin-bottom: 2rem;
}

.total-amount {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.submit-btn {
  background: linear-gradient(135deg, #10b981, #fbbf24);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.submit-btn:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.help-link {
  color: #6b7280;
  text-decoration: none;
  text-align: center;
  font-size: 0.9rem;
}

.help-link:hover {
  color: #10b981;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cart-dialog {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .cart-main {
    flex-direction: column;
    gap: 1rem;
  }
  
  .cart-content {
    padding: 1rem;
  }
  
  .product-card {
    flex-direction: column;
    text-align: center;
  }
  
  .product-image {
    width: 100%;
    height: 200px;
  }
  
  .quantity-section {
    justify-content: center;
  }
  
  .summary-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}

/* 订单确认与票据上传模态框样式 */
.order-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  backdrop-filter: blur(4px);
}

.order-confirm-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-instruction {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-instruction p {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.upload-section {
  padding: 1.5rem;
}

.upload-label {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.75rem;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f9fafb;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.upload-area.dragover {
  border-color: #10b981;
  background: #ecfdf5;
}

.upload-area.has-file {
  border-color: #10b981;
  background: #f0fdf4;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.upload-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.upload-text {
  font-size: 0.95rem;
  color: #6b7280;
}

.upload-link {
  color: #10b981;
  font-weight: 600;
  cursor: pointer;
}

.upload-hint {
  font-size: 0.85rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.uploaded-file {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 1px solid #d1d5db;
}

.file-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  text-align: left;
}

.file-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
  word-break: break-all;
}

.file-size {
  font-size: 0.85rem;
  color: #6b7280;
}

.remove-file-btn {
  background: #fef2f2;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #dc2626;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.remove-file-btn:hover {
  background: #fee2e2;
  transform: scale(1.1);
}

.upload-requirements {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.upload-requirements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.upload-requirements li {
  font-size: 0.85rem;
  color: #6b7280;
  padding: 0.25rem 0;
  padding-left: 1.25rem;
  position: relative;
}

.upload-requirements li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #10b981;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.btn-confirm {
  padding: 0.75rem 1.5rem;
  background: #9ca3af;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-confirm:not(:disabled) {
  background: linear-gradient(135deg, #10b981, #fbbf24);
}

.btn-confirm:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .order-confirm-modal {
    width: 95%;
    margin: 1rem;
  }
  
  .upload-area {
    padding: 1.5rem;
    min-height: 150px;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .btn-cancel,
  .btn-confirm {
    width: 100%;
  }
}
</style>