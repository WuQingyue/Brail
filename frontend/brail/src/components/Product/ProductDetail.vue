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
              :alt="productName"
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
          <div v-if="productImages.length > 0" class="thumbnail-gallery">
            <button class="nav-btn prev" @click="prevImage">‹</button>
            <div class="thumbnails">
              <div 
                v-for="(image, index) in productImages" 
                :key="index"
                :class="['thumbnail', { active: index === currentImageIndex }]"
                @click="selectImage(index)"
              >
                <img :src="image" :alt="`${productName} ${index + 1}`" />
                <div v-if="isVideo" class="play-icon">▶</div>
              </div>
            </div>
            <button class="nav-btn next" @click="nextImage">›</button>
          </div>
        </div>

        <!-- 右侧产品详情区域 -->
        <div class="product-info">
          <!-- 产品标题 -->
          <h1 class="product-title">{{ productName }}</h1>
          
          <!-- 描述 -->
          <div class="product-description" v-if="product.description">
            <p>{{ product.description }}</p>
          </div>

          <!-- 价格信息 -->
          <div class="price-info">
            <span class="selling-price">R$ {{ product.selling_price?.toFixed(2) || '0.00' }}</span>
            <span class="stock-info">库存: {{ product.stock_quantity || 0 }} 件</span>
          </div>

          <!-- 分类和供应商 -->
          <div class="product-meta">
            <p class="category" v-if="product.category_id">类别ID: {{ product.category_id }}</p>
            <p class="supplier" v-if="product.supplier_id">供应商ID: {{ product.supplier_id }}</p>
            <p class="shipping" v-if="product.shipping_from">发货地: {{ product.shipping_from }}</p>
          </div>

          <!-- 产品变体（如果存在） -->
          <div class="variations-section" v-if="product.variations && product.variations.length > 0">
            <h3>可用变体</h3>
            <div class="variations-table">
              <div class="table-header">
                <span>图片</span>
                <span>颜色/变体</span>
                <span>规格</span>
                <span>单价</span>
                <span>数量</span>
              </div>
              <div 
                v-for="(variation, index) in product.variations" 
                :key="variation.id"
                :class="['variation-item', { selected: selectedVariation?.id === variation.id }]"
                @click="selectVariation(variation)"
              >
                <div class="variation-image">
                  <img :src="variation.image" :alt="variation.name" />
                </div>
                <div class="variation-name">{{ variation.name }}</div>
                <div class="variation-spec">{{ variation.specification || '标准版本' }}</div>
                <div class="variation-price">R$ {{ variation.price.toFixed(2) }}</div>
                <div class="quantity-controls">
                  <!-- 先试后用模式：只显示数量，不显示增减按钮 -->
                  <div v-if="isSample" class="quantity-display">
                    {{ product.user_limit_quantity || 1 }} 件
                  </div>
                  <!-- 普通模式：显示完整的数量控制 -->
                  <template v-else>
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
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- MOQ信息 -->
          <div class="moq-info" v-if="product.moq && !isSample">
            <span class="moq-icon">📦</span>
            <span>最小订购量 (MOQ) {{ product.moq }} 件</span>
          </div>

          <!-- 先试后用限购信息 -->
          <div class="moq-info" v-if="product.user_limit_quantity && isSample && !hasPurchased">
            <span class="moq-icon">🎯</span>
            <span>每用户限购数量 {{ product.user_limit_quantity }} 件</span>
          </div>
          
          <!-- 已购买提示 -->
          <div class="purchased-info" v-if="hasPurchased && isSample">
            <span class="purchased-icon">✨</span>
            <span>商品已限购</span>
          </div>

          <!-- 价格信息 -->
          <div class="price-ranges" v-if="product.priceRanges && product.priceRanges.length > 0">
            <div class="price-ranges-header">
              <span class="price-icon">💰</span>
              <span>批量价格表</span>
            </div>
            <div class="price-range" v-for="range in product.priceRanges" :key="range.min">
              <span>{{ range.min }}-{{ range.max || '∞' }} 件: ¥{{ range.price.toFixed(2) }}</span>
            </div>
          </div>

          <!-- 成本摘要 -->
          <div class="cost-summary" v-if="product.cost_price">
            <div class="cost-item">
              <span class="cost-label">成本价</span>
              <div class="cost-details">
                <span class="cost-total">¥{{ product.cost_price.toFixed(2) }}</span>
                <span class="cost-unit">售价: R$ {{ product.selling_price?.toFixed(2) || '0.00' }}</span>
              </div>
            </div>
            <div class="cost-item">
              <span class="cost-label">产品MLB价格</span>
              <div class="cost-details">
                <span class="cost-unit">{{ product.product_mlb_price || 'N/A' }}</span>
                <span class="cost-eye">👁</span>
              </div>
            </div>
          </div>

          <!-- 添加到购物车/立即下单按钮 -->
          <button 
            class="add-to-cart-btn" 
            :class="{ 'disabled': hasPurchased && isSample }"
            :disabled="hasPurchased && isSample"
            @click="isSample ? showPixPaymentModal() : addToCart()"
          >
            {{ isSample ? '立即下单' : '加入购物车' }}
          </button>
        </div>
      </div>
    </div>

    <!-- PIX支付弹窗 -->
    <div v-if="showPixModal" class="modal-overlay" @click.self="!showQrCode && closePixModal()">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ showQrCode ? '扫描二维码支付' : '确认支付信息' }}</h2>
          <button class="close-btn" @click="closePixModal">×</button>
        </div>
        
        <!-- 显示二维码 -->
        <div v-if="showQrCode" class="qr-code-container">
          <div class="qr-code-wrapper">
            <img :src="qrCodeUrl" alt="PIX支付二维码" class="qr-code-image" />
            <p class="qr-code-instruction">请使用您的银行APP扫描二维码完成支付</p>
            <div class="payment-status-indicator">
              <div class="status-dot"></div>
              <span>等待支付中...</span>
            </div>
          </div>
          
          <!-- 错误信息显示 -->
          <div v-if="pixError" class="error-message">
            {{ pixError }}
          </div>
        </div>
        
        <!-- 显示表单 -->
        <form v-else @submit.prevent="handlePixPayment" class="payment-form">
          <div class="form-group">
            <label for="pix-name">姓名 (Name):</label>
            <input 
              id="pix-name" 
              type="text" 
              v-model="pixForm.name" 
              required 
              placeholder="请输入您的全名"
            />
          </div>

          <div class="form-group">
            <label for="pix-email">邮箱 (Email):</label>
            <input 
              id="pix-email" 
              type="email" 
              v-model="pixForm.email" 
              required 
              placeholder="your.email@example.com"
            />
          </div>

          <div class="form-group">
            <label for="pix-tax-id">税号 (CPF/CNPJ):</label>
            <input 
              id="pix-tax-id" 
              type="text" 
              v-model="pixForm.taxId" 
              required 
              placeholder="000.000.000-00"
            />
            <small>测试环境使用: 000.000.000-00</small>
          </div>

          <div class="payment-amount">
            <p>支付金额: <strong>R$ {{ calculateTotalAmount().toFixed(2) }}</strong></p>
          </div>

          <!-- 错误信息显示 -->
          <div v-if="pixError" class="error-message">
            {{ pixError }}
          </div>

          <!-- 提交按钮 -->
          <button type="submit" class="submit-payment-btn" :disabled="pixProcessing || paymentStatus === 'loading'">
            <span v-if="pixProcessing || paymentStatus === 'loading'">处理中...</span>
            <span v-else>使用PIX支付</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { getProductDetail, addToCart as addToCartApi, getCartId, createSampleOrder, checkSamplePurchase, createPixPaymentIntent } from '../../utils/api.js'
import { useUserStore } from '../../stores/user.js'

// Props
const props = defineProps({
  productId: {
    type: [Number, String],
    required: true
  },
  isSample: {
    type: Boolean,
    default: false
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
const hasPurchased = ref(false) // 是否已购买（先试用模式）
const purchaseCheckLoading = ref(false) // 购买检查加载状态

// PIX支付相关数据
const showPixModal = ref(false)
const pixProcessing = ref(false)
const pixError = ref('')
const pixForm = reactive({
  name: '',
  email: '',
  taxId: '000.000.000-00' // 默认测试税号
})
const showQrCode = ref(false)
const qrCodeUrl = ref('')
const paymentStatus = ref('') // 'loading', 'requires_action', 'succeeded', 'requires_payment_method'
const paymentIntentId = ref('')

// Stripe实例
const stripe = window.Stripe ? window.Stripe('pk_test_51SNksZ7vw4ltB98R0aQUAqCgN8xm3HeQmcSDHZ6Y5u0gl2UlKYHll2o1BMEnJioEjs6EnbInMpjXVWPGRljI2jw4005eGRnjy6') : null

 // 计算属性
 const currentImage = computed(() => {
   if (!product.value) return null
   
   // 后端返回的字段可能是 img（单个图片URL）或 product_mlb_thumbnail（数组）
   // 前端模板期望的是 images（数组）
   if (product.value.images && Array.isArray(product.value.images)) {
     return product.value.images[currentImageIndex.value]
   } else if (product.value.img) {
     // 如果只有单个图片，返回它
     return product.value.img
   } else if (product.value.product_mlb_thumbnail && Array.isArray(product.value.product_mlb_thumbnail)) {
     // 如果后端返回了 product_mlb_thumbnail 数组，使用它
     return product.value.product_mlb_thumbnail[currentImageIndex.value] || product.value.product_mlb_thumbnail[0]
   }
   
   return null
 })

 // 产品名称（兼容 name 和 title）
 const productName = computed(() => {
   if (!product.value) return ''
   return product.value.name || product.value.title || ''
 })

 // 产品图片数组（兼容不同的字段名）
 const productImages = computed(() => {
   if (!product.value) return []
   if (product.value.images && Array.isArray(product.value.images)) {
     return product.value.images
   } else if (product.value.product_mlb_thumbnail && Array.isArray(product.value.product_mlb_thumbnail)) {
     return product.value.product_mlb_thumbnail
   } else if (product.value.img) {
     return [product.value.img]
   }
   return []
 })

 // 方法
 const loadProduct = async () => {
   try {
     loading.value = true
     error.value = null
     
     // 使用统一的API获取产品详情
     const response = await getProductDetail(props.productId)
     
     console.log('🔍 后端返回的响应:', response)
     
     // 后端返回格式: { success: true, code: 200, product: {...} }
     if (response.product) {
       product.value = response.product
       console.log('✅ 产品数据已加载:', product.value)
     } else if (response.success === false) {
       // 处理错误响应
       error.value = response.message || '加载产品详情失败，请重试'
       console.error('❌ 后端返回错误:', response)
     } else {
       // 如果返回格式不符合预期，使用原始数据
       console.warn('⚠️ 返回格式异常，直接使用:', response)
       product.value = response
     }
     
    // 默认选择第一个变体（如果存在）
    if (product.value && product.value.variations && product.value.variations.length > 0) {
      selectedVariation.value = product.value.variations[0]
    } else {
      // 如果没有 variations，设置为 null
      selectedVariation.value = null
    }
    
    // 如果是先试后用模式，检查是否已购买
    if (props.isSample) {
      await checkPurchaseStatus()
    }
  } catch (err) {
    console.error('❌ 加载产品详情异常:', err)
    error.value = '加载产品详情失败，请重试'
  } finally {
    loading.value = false
  }
}

// 检查购买状态（先试后用模式）
const checkPurchaseStatus = async () => {
  try {
    purchaseCheckLoading.value = true
    
    // 获取用户信息
    const userStore = useUserStore()
    const userId = userStore.getUserId()
    
    if (!userId) {
      console.log('⚠️ 用户未登录，跳过购买检查')
      return
    }
    
    // 调用API检查购买状态
    const response = await checkSamplePurchase(userId, props.productId)
    
    if (response.success) {
      hasPurchased.value = response.has_purchased
      console.log('✅ 购买状态检查完成:', hasPurchased.value)
    }
  } catch (err) {
    console.error('❌ 检查购买状态失败:', err)
    // 如果检查失败，默认为未购买，允许用户尝试下单
    hasPurchased.value = false
  } finally {
    purchaseCheckLoading.value = false
  }
}

const selectImage = (index) => {
  currentImageIndex.value = index
}

const nextImage = () => {
  if (productImages.value.length > 0) {
    currentImageIndex.value = (currentImageIndex.value + 1) % productImages.value.length
  }
}

const prevImage = () => {
  if (productImages.value.length > 0) {
    currentImageIndex.value = currentImageIndex.value === 0 
      ? productImages.value.length - 1 
      : currentImageIndex.value - 1
  }
}

const selectVariation = (variation) => {
  selectedVariation.value = variation
}

const getVariationQuantity = (variationId) => {
  const limitQuantity = props.isSample ? product.value?.user_limit_quantity : product.value?.moq
  return variationQuantities.value[variationId] || limitQuantity || 50
}

const updateVariationQuantity = (variationId, newQuantity) => {
  const limitQuantity = props.isSample ? product.value?.user_limit_quantity : product.value?.moq
  const numQuantity = parseInt(newQuantity) || limitQuantity || 50
  if (numQuantity < limitQuantity) {
    variationQuantities.value[variationId] = limitQuantity
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
    const limitQuantity = props.isSample ? product.value?.user_limit_quantity : product.value?.moq
    if (currentQty > limitQuantity) {
      variationQuantities.value[variation.id] = currentQty - 1
    }
  }
}

const updateQuantity = () => {
  const limitQuantity = props.isSample ? product.value?.user_limit_quantity : product.value?.moq
  if (selectedVariation.value && quantity.value < limitQuantity) {
    quantity.value = limitQuantity
  }
}

const getSelectedQuantity = () => {
  if (props.isSample) {
    // 先试后用模式：直接返回 user_limit_quantity
    return product.value?.user_limit_quantity || 1
  }
  
  if (selectedVariation.value) {
    return getVariationQuantity(selectedVariation.value.id)
  }
  const limitQuantity = product.value?.moq
  return limitQuantity || 50
}

const addToCart = async () => {
  try {
    // 获取用户信息
    const userStore = useUserStore()
    const userId = userStore.getUserId() // 使用 userStore 的 getUserId() 方法
    
    console.log('🔍 当前用户ID:', userId)
    console.log('🔍 用户登录状态:', userStore.isLoggedIn)
    console.log('🔍 用户信息:', userStore.user)
    
    if (!userId) {
      alert('请先登录')
      return
    }
    
    if (!product.value) {
      alert('产品信息不存在')
      return
    }
    
    if (props.isSample) {
      // 先试后用模式：创建小样订单
      const limitQuantity = product.value?.user_limit_quantity || 1
      const totalAmount = product.value?.selling_price * limitQuantity
      
      const orderData = {
        user_id: userId,
        product_id: props.productId,
        customer_name: userStore.user?.user_name || userStore.user?.name || '客户',
        quantity: limitQuantity,
        total_amount: totalAmount,
        notes: '小样订单'
      }
      
      const response = await createSampleOrder(orderData)
      
      if (response.success) {
        alert('小样订单已成功创建！')
        // 触发事件通知父组件
        emit('add-to-cart', {
          product: product.value,
          variation: selectedVariation.value,
          quantity: limitQuantity
        })
      } else {
        alert(response.message || '创建小样订单失败')
      }
    } else {
      // 普通模式：加入购物车
      // 获取购物车ID
      const cartId = await getCartId(userId)
      
      // 计算要添加的数量
      const limitQuantity = product.value?.moq
      let quantity = limitQuantity || 50
      
      // 如果有选中的变体，使用变体的数量
      if (selectedVariation.value) {
        quantity = getVariationQuantity(selectedVariation.value.id)
      }
      
      // 调用后端API加入购物车
      const response = await addToCartApi(cartId, props.productId, quantity)
      
      if (response.success) {
        alert('商品已成功加入购物车！')
        // 触发事件通知父组件
        emit('add-to-cart', {
          product: product.value,
          variation: selectedVariation.value,
          quantity: quantity
        })
      }
    }
  } catch (error) {
    console.error('❌ 操作失败:', error)
    if (props.isSample) {
      alert('下单失败，请重试')
    } else {
      alert('加入购物车失败，请重试')
    }
  }
}

const handleImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/600x400/10b981/ffffff?text=Product+Image'
}

// PIX支付相关函数

// 显示PIX支付弹窗
const showPixPaymentModal = () => {
  if (!props.isSample) {
    // 非先试后用模式，直接调用addToCart
    addToCart()
    return
  }
  
  // 获取用户信息并填充表单
  const userStore = useUserStore()
  // 使用 userStore 的正确字段名：user_name 和 user_email
  pixForm.name = userStore.user?.user_name || userStore.user?.name || ''
  pixForm.email = userStore.user?.user_email || userStore.user?.email || ''
  
  console.log('🔄 填充用户信息到表单:', {
    姓名: pixForm.name,
    邮箱: pixForm.email,
    用户数据: userStore.user
  })
  
  showPixModal.value = true
}

// 关闭PIX支付弹窗
const closePixModal = () => {
  showPixModal.value = false
  showQrCode.value = false
  pixError.value = ''
  paymentStatus.value = ''
  qrCodeUrl.value = ''
  paymentIntentId.value = ''
}

// 计算总金额
const calculateTotalAmount = () => {
  if (!product.value) return 0
  const limitQuantity = product.value?.user_limit_quantity || 1
  const price = selectedVariation.value?.price || product.value?.selling_price || 0
  return price * limitQuantity
}

// 处理PIX支付
const handlePixPayment = async () => {
  try {
    pixProcessing.value = true
    pixError.value = ''
    paymentStatus.value = 'loading'
    
    // 验证Stripe是否加载
    if (!stripe) {
      pixError.value = 'Stripe加载失败，请刷新页面重试'
      return
    }
    
    // 计算总金额
    const totalAmount = calculateTotalAmount()
    
    // 调用后端API创建PaymentIntent
    const response = await createPixPaymentIntent(totalAmount)
    
    if (!response.client_secret) {
      pixError.value = response.message || '创建支付意图失败'
      paymentStatus.value = ''
      return
    }
    
    paymentIntentId.value = response.client_secret.split('_secret_')[0]
    
    // 调用Stripe确认PIX支付（不使用重定向）
    const { error: confirmError, paymentIntent } = await stripe.confirmPixPayment(
      response.client_secret,
      {
        payment_method: {
          billing_details: {
            name: pixForm.name,
            email: pixForm.email,
            tax_id: pixForm.taxId,
          }
        },
        return_url: undefined // 不使用重定向
      }
    )
    
    if (confirmError) {
      console.error('支付确认错误:', confirmError)
      paymentStatus.value = ''
      pixError.value = `支付错误: ${confirmError.message}`
      return
    }
    
    console.log('PaymentIntent状态:', paymentIntent.status)
    
    // 根据PaymentIntent状态处理
    if (paymentIntent.status === 'requires_action' && paymentIntent.next_action) {
      // 需要显示二维码等待用户支付
      paymentStatus.value = 'requires_action'
      
      // 获取二维码URL
      if (paymentIntent.next_action.pix_display_qr_code) {
        qrCodeUrl.value = paymentIntent.next_action.pix_display_qr_code.image_url_png
        showQrCode.value = true
        
        // 轮询检查支付状态
        pollPaymentStatus(response.client_secret)
      }
    } else if (paymentIntent.status === 'succeeded') {
      // 支付成功
      handlePaymentSuccess(totalAmount)
    } else if (paymentIntent.status === 'requires_payment_method') {
      // 支付失败或被取消
      paymentStatus.value = 'requires_payment_method'
      pixError.value = '支付已取消或失败，请重试'
    } else {
      console.log('未处理的状态:', paymentIntent.status)
      paymentStatus.value = paymentIntent.status
    }
  } catch (error) {
    console.error('❌ PIX支付处理失败:', error)
    pixError.value = '支付处理失败，请重试'
    paymentStatus.value = ''
  } finally {
    pixProcessing.value = false
  }
}

// 轮询支付状态
const pollPaymentStatus = async (clientSecret) => {
  const maxAttempts = 120 // 最多轮询2分钟（每秒一次）
  let attempts = 0
  
  const poll = setInterval(async () => {
    attempts++
    
    try {
      const { paymentIntent, error } = await stripe.retrievePaymentIntent(clientSecret)
      
      if (error) {
        console.error('获取支付状态错误:', error)
        clearInterval(poll)
        return
      }
      
      console.log(`轮询第${attempts}次，状态:`, paymentIntent.status)
      
      if (paymentIntent.status === 'succeeded') {
        clearInterval(poll)
        paymentStatus.value = 'succeeded'
        showQrCode.value = false
        const totalAmount = calculateTotalAmount()
        handlePaymentSuccess(totalAmount)
      } else if (paymentIntent.status === 'requires_payment_method') {
        clearInterval(poll)
        paymentStatus.value = 'requires_payment_method'
        pixError.value = '支付已取消或失败'
      } else if (attempts >= maxAttempts) {
        clearInterval(poll)
        paymentStatus.value = ''
        pixError.value = '支付超时，请重新尝试'
      }
    } catch (error) {
      console.error('轮询错误:', error)
      clearInterval(poll)
    }
  }, 1000) // 每秒检查一次
}

// 处理支付成功
const handlePaymentSuccess = async (totalAmount) => {
  try {
    // 创建小样订单
    const userStore = useUserStore()
    const userId = userStore.getUserId()
    const limitQuantity = product.value?.user_limit_quantity || 1
    
    const orderData = {
      user_id: userId,
      product_id: props.productId,
      customer_name: pixForm.name,
      quantity: limitQuantity,
      total_amount: totalAmount,
      notes: 'PIX支付小样订单'
    }
    
    const orderResponse = await createSampleOrder(orderData)
    
    if (orderResponse.success) {
      // 关闭弹窗
      closePixModal()
      alert('✅ 支付成功，订单已创建！')
      // 触发事件通知父组件
      emit('add-to-cart', {
        product: product.value,
        variation: selectedVariation.value,
        quantity: limitQuantity
      })
    } else {
      pixError.value = orderResponse.message || '订单创建失败'
      paymentStatus.value = ''
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    pixError.value = '订单创建失败，请重试'
    paymentStatus.value = ''
  }
}

// 生命周期
onMounted(() => {
  loadProduct()
  
  // 初始化用户信息到表单
  const userStore = useUserStore()
  if (userStore.user) {
    // 使用 userStore 的正确字段名：user_name 和 user_email
    pixForm.name = userStore.user.user_name || userStore.user.name || ''
    pixForm.email = userStore.user.user_email || userStore.user.email || ''
  }
})

// 监听数量变化
watch(quantity, (newQuantity) => {
  const limitQuantity = props.isSample ? product.value?.user_limit_quantity : product.value?.moq
  if (product.value && newQuantity < limitQuantity) {
    quantity.value = limitQuantity
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
  min-width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 0.8fr 2fr 1.2fr 0.8fr 1.2fr;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
}

.variation-item {
  display: grid;
  grid-template-columns: 0.8fr 2fr 1.2fr 0.8fr 1.2fr;
  gap: 0.75rem;
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
  align-items: center;
}

.variation-item:hover {
  background: #f9fafb;
}

.variation-item.selected {
  background: #fef3c7;
  border-color: #fbbf24;
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

.variation-spec {
  font-size: 0.85rem;
  color: #6b7280;
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

.quantity-display {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border-radius: 6px;
  font-weight: 600;
  color: #374151;
  text-align: center;
  min-width: 80px;
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

/* 已购买提示样式 */
.purchased-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 2px solid #f59e0b;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #92400e;
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.15);
}

.purchased-icon {
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

.add-to-cart-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(251, 191, 36, 0.4);
}

.add-to-cart-btn.disabled {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.add-to-cart-btn:disabled {
  background: linear-gradient(135deg, #9ca3af, #6b7280);
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

.add-to-cart-btn:disabled:hover {
  transform: none;
  box-shadow: none;
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
    overflow-x: visible;
  }
  
  .table-header {
    display: none; /* 隐藏表头在小屏幕上 */
  }
  
  .variation-item {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }
  
  .variation-image {
    order: 1;
    display: flex;
    justify-content: center;
  }
  
  .variation-image img {
    width: 80px;
    height: 80px;
  }
  
  .variation-name {
    order: 2;
    font-size: 1rem;
    font-weight: 600;
  }
  
  .variation-spec {
    order: 3;
    font-size: 0.85rem;
    color: #6b7280;
  }
  
  .variation-price {
    order: 4;
    font-size: 1.1rem;
    font-weight: 700;
    color: #10b981;
  }
  
  .quantity-controls {
    order: 5;
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  
  .quantity-input {
    width: 60px;
  }
  
  .quantity-btn {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .product-title {
    font-size: 1.4rem;
  }
}

@media (max-width: 1024px) and (min-width: 769px) {
  .variations-table {
    overflow-x: visible;
  }
  
  .table-header,
  .variation-item {
    grid-template-columns: 0.8fr 1.8fr 1.2fr 0.8fr 1.2fr;
    gap: 0.75rem;
    font-size: 0.85rem;
  }
  
  .variation-image img {
    width: 35px;
    height: 35px;
  }
}

/* PIX支付弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.payment-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #10b981;
}

.form-group small {
  display: block;
  margin-top: 0.5rem;
  color: #6b7280;
  font-size: 0.85rem;
}

.payment-amount {
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  text-align: center;
}

.payment-amount p {
  margin: 0;
  font-size: 1.1rem;
  color: #374151;
}

.payment-amount strong {
  color: #10b981;
  font-size: 1.3rem;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  border: 1px solid #fecaca;
}

.submit-payment-btn {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.submit-payment-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.4);
}

.submit-payment-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 二维码容器样式 */
.qr-code-container {
  padding: 2rem;
  text-align: center;
}

.qr-code-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.qr-code-image {
  max-width: 300px;
  width: 100%;
  height: auto;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.qr-code-instruction {
  color: #374151;
  font-size: 1rem;
  margin: 0;
}

.payment-status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #059669;
  font-weight: 500;
}

.status-dot {
  width: 12px;
  height: 12px;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .modal-header h2 {
    font-size: 1.25rem;
  }
  
  .payment-form {
    padding: 1rem;
  }
  
  .qr-code-container {
    padding: 1.5rem;
  }
  
  .qr-code-image {
    max-width: 250px;
  }
}
</style>
