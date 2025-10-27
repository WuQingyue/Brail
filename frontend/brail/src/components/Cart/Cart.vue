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
  
  try {
    // 获取用户信息
    const userStore = useUserStore()
    
    // 构建订单数据
    const orderData = {
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
    
    // 调用创建订单API
    const response = await createOrder(orderData)
    
    if (response.success) {
      alert(`订单创建成功！订单号: ${response.order_id}`)
      // 关闭购物车
      closeCart()
      // 可以在这里触发刷新订单列表等操作
    }
  } catch (error) {
    console.error('Failed to submit order:', error)
    alert('订单提交失败，请重试')
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
</style>