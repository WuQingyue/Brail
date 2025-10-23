<template>
  <div class="product-detail-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>正在加载产品详情...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadProduct" class="retry-btn">重试</button>
    </div>

    <!-- 产品详情内容 -->
    <div v-else-if="product" class="product-detail">
      <div class="product-main">
        <!-- 左侧产品媒体区域 -->
        <div class="product-media">
          <!-- 主图片/视频 -->
          <div class="main-media">
            <img 
              v-if="currentImage"
              :src="currentImage" 
              :alt="product.name"
              class="product-image"
              @error="handleImageError"
            />
            <div class="media-overlay">
              <div class="overlay-text">
                <p class="chinese-text">深受海内外客户的一致好评</p>
                <p class="english-text">Received unanimous praise from customers at home and abroad</p>
              </div>
              <button class="play-btn" v-if="isVideo">▶</button>
            </div>
          </div>

          <!-- 缩略图画廊 -->
          <div class="thumbnail-gallery">
            <button class="nav-btn prev" @click="prevImage">‹</button>
            <div class="thumbnails">
              <div 
                v-for="(image, index) in product.images" 
                :key="index"
                :class="['thumbnail', { active: index === currentImageIndex }]"
                @click="selectImage(index)"
              >
                <img :src="image" :alt="`${product.name} ${index + 1}`" />
                <div v-if="isVideo" class="play-icon">▶</div>
              </div>
            </div>
            <button class="nav-btn next" @click="nextImage">›</button>
          </div>
        </div>

        <!-- 右侧产品详情区域 -->
        <div class="product-info">
          <!-- 产品标题 -->
          <h1 class="product-title">{{ product.name }}</h1>
          
          <!-- 销售信息 -->
          <div class="sales-info">
            <span class="sales-count">已售出 {{ product.sales }} 件</span>
          </div>

          <!-- 分类和供应商 -->
          <div class="product-meta">
            <p class="category">分类: {{ product.category }}</p>
            <p class="supplier">供应商: <a href="#" class="supplier-link">{{ product.supplier.id }}</a></p>
          </div>

          <!-- 产品变体 -->
          <div class="variations-section">
            <h3>可选规格</h3>
            <div class="variations-table">
              <div class="table-header">
                <span>#</span>
                <span>图片</span>
                <span>规格/型号</span>
                <span>单价</span>
                <span>总价</span>
                <span>数量</span>
              </div>
              <div 
                v-for="(variation, index) in product.variations" 
                :key="variation.id"
                :class="['variation-item', { selected: selectedVariation?.id === variation.id }]"
                @click="selectVariation(variation)"
              >
                <div class="variation-checkbox">
                  <input 
                    type="checkbox" 
                    :checked="selectedVariation?.id === variation.id"
                    @change="selectVariation(variation)"
                  />
                </div>
                <div class="variation-image">
                  <img :src="variation.image" :alt="variation.name" />
                </div>
                <div class="variation-name">{{ variation.name }}</div>
                <div class="variation-price">R$ {{ variation.price.toFixed(2) }}</div>
                <div class="variation-total">R$ {{ (variation.price * getVariationQuantity(variation.id)).toFixed(2) }}</div>
                <div class="quantity-controls">
                  <button 
                    class="quantity-btn decrease" 
                    :disabled="selectedVariation?.id !== variation.id"
                    @click.stop="decreaseQuantity(variation)"
                  >-</button>
                  <input 
                    type="number" 
                    :value="getVariationQuantity(variation.id)"
                    :min="product.moq"
                    :disabled="selectedVariation?.id !== variation.id"
                    class="quantity-input"
                    @input="updateVariationQuantity(variation.id, $event.target.value)"
                  />
                  <button 
                    class="quantity-btn increase" 
                    :disabled="selectedVariation?.id !== variation.id"
                    @click.stop="increaseQuantity(variation)"
                  >+</button>
                </div>
              </div>
            </div>
          </div>

          <!-- MOQ信息 -->
          <div class="moq-info">
            <span class="moq-icon">📦</span>
            <span>最小订购量 (MOQ) {{ product.moq }} 件</span>
          </div>

          <!-- 价格区间 -->
          <div class="price-ranges">
            <div class="price-ranges-header">
              <span class="price-icon">💰</span>
              <span>批量价格表</span>
            </div>
            <div class="price-range" v-for="range in product.priceRanges" :key="range.min">
              <span>{{ range.min }}-{{ range.max || '∞' }} 件: ¥{{ range.price.toFixed(2) }}</span>
            </div>
          </div>

          <!-- 成本摘要 -->
          <div class="cost-summary">
            <div class="cost-item">
              <span class="cost-label">中国成本</span>
              <div class="cost-details">
                <span class="cost-total">¥{{ (selectedVariation?.price || product.price * getSelectedQuantity()).toFixed(2) }}</span>
                <span class="cost-unit">单价: ¥{{ (selectedVariation?.price || product.price).toFixed(2) }}</span>
              </div>
            </div>
            <div class="cost-item">
              <span class="cost-label">巴西成本</span>
              <div class="cost-details">
                <span class="cost-unit">单价: R$ {{ ((selectedVariation?.price || product.price) * 2.4).toFixed(2) }}</span>
                <span class="cost-eye">👁</span>
              </div>
            </div>
          </div>

          <!-- 添加到购物车按钮 -->
          <button class="add-to-cart-btn" @click="addToCart">
            加入购物车
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getProductDetail } from '../../utils/api.js'

// Props
const props = defineProps({
  productId: {
    type: Number,
    required: true
  }
})

// Emits
const emit = defineEmits(['add-to-cart'])

// 响应式数据
const product = ref(null)
const loading = ref(false)
const error = ref(null)
const currentImageIndex = ref(0)
const selectedVariation = ref(null)
const quantity = ref(50)
const variationQuantities = ref({}) // 为每个变体维护独立的数量
const isVideo = ref(false)

// 计算属性
const currentImage = computed(() => {
  if (product.value && product.value.images) {
    return product.value.images[currentImageIndex.value]
  }
  return null
})

// 方法
const loadProduct = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await getProductDetail(props.productId)
    product.value = data
    
    // 默认选择第一个变体
    if (data.variations && data.variations.length > 0) {
      selectedVariation.value = data.variations[0]
    }
  } catch (err) {
    error.value = '加载产品详情失败，请重试'
    console.error('Failed to load product:', err)
  } finally {
    loading.value = false
  }
}

const selectImage = (index) => {
  currentImageIndex.value = index
}

const nextImage = () => {
  if (product.value && product.value.images) {
    currentImageIndex.value = (currentImageIndex.value + 1) % product.value.images.length
  }
}

const prevImage = () => {
  if (product.value && product.value.images) {
    currentImageIndex.value = currentImageIndex.value === 0 
      ? product.value.images.length - 1 
      : currentImageIndex.value - 1
  }
}

const selectVariation = (variation) => {
  selectedVariation.value = variation
}

const getVariationQuantity = (variationId) => {
  return variationQuantities.value[variationId] || product.value?.moq || 50
}

const updateVariationQuantity = (variationId, newQuantity) => {
  const numQuantity = parseInt(newQuantity) || product.value?.moq || 50
  if (numQuantity < product.value.moq) {
    variationQuantities.value[variationId] = product.value.moq
  } else {
    variationQuantities.value[variationId] = numQuantity
  }
}

const increaseQuantity = (variation) => {
  if (selectedVariation.value && selectedVariation.value.id === variation.id) {
    const currentQty = getVariationQuantity(variation.id)
    variationQuantities.value[variation.id] = currentQty + 1
  }
}

const decreaseQuantity = (variation) => {
  if (selectedVariation.value && selectedVariation.value.id === variation.id) {
    const currentQty = getVariationQuantity(variation.id)
    if (currentQty > product.value.moq) {
      variationQuantities.value[variation.id] = currentQty - 1
    }
  }
}

const updateQuantity = () => {
  if (selectedVariation.value && quantity.value < product.value.moq) {
    quantity.value = product.value.moq
  }
}

const getSelectedQuantity = () => {
  if (selectedVariation.value) {
    return getVariationQuantity(selectedVariation.value.id)
  }
  return product.value?.moq || 50
}

const addToCart = () => {
  if (selectedVariation.value) {
    const cartItem = {
      product: product.value,
      variation: selectedVariation.value,
      quantity: getVariationQuantity(selectedVariation.value.id)
    }
    emit('add-to-cart', cartItem)
  }
}

const handleImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/600x400/10b981/ffffff?text=Product+Image'
}

// 生命周期
onMounted(() => {
  loadProduct()
})

// 监听数量变化
watch(quantity, (newQuantity) => {
  if (product.value && newQuantity < product.value.moq) {
    quantity.value = product.value.moq
  }
})
</script>

<style scoped>
.product-detail-container {
  min-height: 100vh;
  background: #f8f9fa;
  padding: 1rem;
  overflow-x: auto;
}

.product-detail {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.product-main {
  display: flex;
  gap: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  min-width: 0;
}

/* 左侧媒体区域 */
.product-media {
  flex: 1;
  padding: 1.5rem;
}

.main-media {
  position: relative;
  margin-bottom: 1rem;
  border-radius: 8px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 8px;
}

.media-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 1rem;
}

.overlay-text {
  margin-bottom: 0.5rem;
}

.chinese-text {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.english-text {
  font-size: 0.9rem;
  opacity: 0.9;
  margin: 0;
}

.play-btn {
  position: absolute;
  bottom: 1rem;
  left: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.play-btn:hover {
  background: white;
  transform: scale(1.1);
}

.thumbnail-gallery {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 4px;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: #e5e7eb;
}

.thumbnails {
  display: flex;
  gap: 0.5rem;
  flex: 1;
  overflow-x: auto;
}

.thumbnail {
  position: relative;
  width: 80px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.thumbnail.active {
  border-color: #fbbf24;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

/* 右侧产品信息区域 */
.product-info {
  flex: 1;
  padding: 1.5rem;
  min-width: 0;
  overflow-x: auto;
}

.product-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.sales-info {
  margin-bottom: 1rem;
}

.sales-count {
  color: #6b7280;
  font-size: 0.9rem;
}

.product-meta {
  margin-bottom: 1.5rem;
}

.product-meta p {
  margin: 0.25rem 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.supplier-link {
  color: #10b981;
  text-decoration: none;
}

.supplier-link:hover {
  text-decoration: underline;
}

/* 产品变体 */
.variations-section {
  margin-bottom: 1.5rem;
}

.variations-section h3 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.variations-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  overflow-x: auto;
  min-width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 0.5fr 1fr 1.5fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
  min-width: 600px;
}

.variation-item {
  display: grid;
  grid-template-columns: 0.5fr 1fr 1.5fr 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  align-items: center;
  min-width: 600px;
}

.variation-item:hover {
  background: #f9fafb;
}

.variation-item.selected {
  background: #fef3c7;
  border-color: #fbbf24;
}

.variation-checkbox input {
  width: 1rem;
  height: 1rem;
  accent-color: #fbbf24;
}

.variation-image img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.variation-name {
  font-weight: 500;
  color: #374151;
}

.variation-price,
.variation-total {
  font-weight: 600;
  color: #10b981;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quantity-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 4px;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.quantity-btn:hover:not(:disabled) {
  background: #e5e7eb;
}

.quantity-btn:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.5;
}

.quantity-input {
  width: 4rem;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
}

.quantity-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.5;
}

/* MOQ信息 */
.moq-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #fef3c7;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #92400e;
}

.moq-icon {
  font-size: 1.2rem;
}

/* 价格区间 */
.price-ranges {
  margin-bottom: 1.5rem;
}

.price-ranges-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
}

.price-icon {
  font-size: 1.2rem;
}

.price-range {
  padding: 0.25rem 0;
  color: #6b7280;
  font-size: 0.9rem;
}

/* 成本摘要 */
.cost-summary {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.cost-item:last-child {
  margin-bottom: 0;
}

.cost-label {
  font-weight: 600;
  color: #374151;
}

.cost-details {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cost-total {
  font-weight: 700;
  color: #10b981;
  font-size: 1.1rem;
}

.cost-unit {
  color: #6b7280;
  font-size: 0.9rem;
}

.cost-eye {
  font-size: 1.2rem;
  cursor: pointer;
}

/* 添加到购物车按钮 */
.add-to-cart-btn {
  width: 100%;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(251, 191, 36, 0.3);
}

.add-to-cart-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(251, 191, 36, 0.4);
}

/* 加载和错误状态 */
.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #fbbf24;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  color: #dc2626;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #fbbf24;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #f59e0b;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .product-detail-container {
    padding: 1rem;
  }
  
  .product-main {
    flex-direction: column;
  }
  
  .product-media,
  .product-info {
    padding: 1rem;
  }
  
  .variations-table {
    overflow-x: auto;
  }
  
  .table-header,
  .variation-item {
    grid-template-columns: 0.5fr 1fr 1.5fr 1fr 1fr 1fr;
    gap: 0.5rem;
    font-size: 0.8rem;
    min-width: 600px;
  }
  
  .product-title {
    font-size: 1.4rem;
  }
}
</style>
