<template>
  <div class="sample-page">
    <!-- 顶部横幅 -->
    <div class="banner">
      <h1>0元先试, 满意再买</h1>
    </div>
    
    <!-- 温馨提示 -->
    <div class="info-bar">
      <span class="info-icon">ℹ</span>
      <span class="info-text">温馨提示:本专区所有产品,每个账号限体验一次。</span>
    </div>
    
     <!-- 导航栏 -->
     <div class="nav-bar">
       <div class="nav-item dropdown" @click="toggleCategoryDropdown">
         {{ selectedCategory ? selectedCategory.name : '品类' }} 
         <span class="dropdown-arrow" :class="{ 'rotated': showCategoryDropdown }">▼</span>
         <div class="dropdown-menu" v-if="showCategoryDropdown">
           <div 
             v-for="category in categories" 
             :key="category.id" 
             class="dropdown-item"
             :class="{ 'selected': selectedCategory && selectedCategory.id === category.id }"
             @click.stop="selectCategory(category)"
           >
             {{ category.name }}
           </div>
           <!-- 调试信息 -->
           <div v-if="categories.length === 0" class="dropdown-item debug-info">
             暂无品类数据
           </div>
         </div>
       </div>
      <div class="nav-item">价格 ▼</div>
      <div class="nav-item">最新</div>
      <div class="nav-item active">热门</div>
    </div>
    
     <!-- 加载状态 -->
     <div v-if="isLoading" class="loading-container">
       <div class="loading-spinner"></div>
       <p class="loading-text">正在加载产品...</p>
     </div>
     
     <!-- 产品网格 -->
     <div v-else-if="products.length > 0" class="product-grid">
       <div class="product-card" v-for="product in products" :key="product.id">
         <div class="product-image">
           <img :src="product.image" :alt="product.name" />
         </div>
         <div class="product-info">
           <h3 class="product-name">{{ product.name }}</h3>
           <p class="product-price">¥{{ product.price }}</p>
           <button 
             class="action-btn" 
             @click="handleAction(product)"
           >
             立即试用
           </button>
         </div>
       </div>
     </div>
     
     <!-- 空状态 -->
     <div v-else class="empty-state">
       <div class="empty-icon">📦</div>
       <h3 class="empty-title">暂无产品</h3>
       <p class="empty-message">
         {{ selectedCategory ? `当前品类"${selectedCategory.name}"下没有产品` : '请选择一个品类查看产品' }}
       </p>
     </div>
    
     <!-- 分页 --> 
     <div v-if="totalPages > 1" class="pagination">
       <button 
         class="page-btn" 
         :disabled="currentPage === 1"
         @click="prevPage"
       >
         ‹
       </button>
       <button 
         v-for="page in paginationPages" 
         :key="page"
         class="page-btn" 
         :class="{ 'active': page === currentPage }"
         :disabled="page === '...'"
         @click="goToPage(page)"
       >
         {{ page }}
       </button>
       <button 
         class="page-btn" 
         :disabled="currentPage === totalPages"
         @click="nextPage"
       >
         ›
       </button>
     </div>

     <!-- 产品详情页模态框 -->
     <div v-if="showProductDetail" class="product-detail-modal">
       <div class="modal-overlay" @click="closeProductDetail"></div>
       <div class="modal-content">
         <button class="close-btn" @click="closeProductDetail">×</button>
         <ProductDetail 
           :product-id="selectedProductId"
           :is-sample="true"
           @add-to-cart="handleAddToCart"
         />
       </div>
     </div>
   </div>
 </template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import mockData from '../../../tests/fixtures/mock-data.json'
import { getCategories, getSampleProducts, getAllSampleProducts } from '@/utils/api.js'
import ProductDetail from '../Product/ProductDetail.vue'

// 从mock数据中获取产品数据
const allProducts = ref(mockData.sampleTestData.sampleProducts)

// 品类数据
const categories = ref([])
// 控制品类下拉框的显示状态
const showCategoryDropdown = ref(false)
// 当前选中的品类
const selectedCategory = ref(null)
// 加载状态
const isLoading = ref(false)

// 分页相关
const currentPage = ref(1)
const itemsPerPage = 8
const products = ref([])

// 产品详情弹窗相关
const showProductDetail = ref(false)
const selectedProductId = ref(null)

// 分页计算属性
const totalPages = computed(() => {
  return Math.ceil(allProducts.value.length / itemsPerPage)
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return allProducts.value.slice(start, end)
})

const paginationPages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  // 显示逻辑：最多显示7个页码按钮
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // 总是显示第1页
    pages.push(1)
    
    if (current <= 4) {
      // 当前页在前4页
      for (let i = 2; i <= 5; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    } else if (current >= total - 3) {
      // 当前页在后4页
      pages.push('...')
      for (let i = total - 4; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // 当前页在中间
      pages.push('...')
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i)
      }
      pages.push('...')
      pages.push(total)
    }
  }
  
  return pages
})

// 分页方法
const goToPage = (page) => {
  if (page !== '...' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    updateDisplayProducts()
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    updateDisplayProducts()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    updateDisplayProducts()
  }
}

// 更新显示的产品
const updateDisplayProducts = () => {
  products.value = paginatedProducts.value
}

// 获取品类数据
const fetchCategories = async () => {
  try {
    const categoryData = await getCategories()
    console.log('获取到的品类数据:', categoryData)
    console.log('品类数据长度:', categoryData ? categoryData.length : 0)
    
    if (categoryData && Array.isArray(categoryData)) {
      categories.value = categoryData
    } else {
      // 如果API没有返回数据，使用模拟数据
      categories.value = []
    }
  } catch (error) {
    console.error('获取品类数据失败:', error)
    categories.value = []
  }
}

// 切换品类下拉框的显示状态
const toggleCategoryDropdown = () => {
  showCategoryDropdown.value = !showCategoryDropdown.value
}

// 点击外部关闭下拉框
const handleClickOutside = (event) => {
  if (!event.target.closest('.nav-item.dropdown')) {
    showCategoryDropdown.value = false
  }
}

// 获取所有产品（未选择品类时）
const fetchAllProducts = async () => {
  try {
    isLoading.value = true
    console.log('获取所有先试后用产品...')
    
    const response = await getAllSampleProducts()
    console.log('获取到的所有产品响应:', response)
    
    // 更新产品列表
    if (response.success && response.products && response.products.length > 0) {
      // 将API返回的产品数据转换为组件需要的格式
      allProducts.value = response.products.map(product => ({
        id: product.id,
        name: product.title || product.name,
        price: product.selling_price || product.price,
        image: product.img || product.image || 'https://via.placeholder.com/200x200?text=产品',
        user_limit_quantity: product.user_limit_quantity || 1,
      }))
    } else {
      allProducts.value = []
    }
    
    // 重置到第一页
    currentPage.value = 1
    updateDisplayProducts()
  } catch (error) {
    console.error('获取所有产品失败:', error)
    allProducts.value = []
  } finally {
    isLoading.value = false
  }
}

// 组件挂载时获取品类数据和所有产品
onMounted(() => {
  fetchCategories()
  // 获取所有产品（未选择品类时）
  fetchAllProducts()
  // 添加点击外部关闭下拉框的事件监听
  document.addEventListener('click', handleClickOutside)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 选择品类
const selectCategory = async (category) => {
  console.log('选择的品类:', category)
  
  // 设置当前选中的品类
  selectedCategory.value = category
  
  // 选择后关闭下拉框
  showCategoryDropdown.value = false
  
  // 开始加载
  isLoading.value = true
  
  try {
    // 使用新的API获取先试后用产品
    const response = await getSampleProducts(category.id)
    console.log('获取到的先试后用产品响应:', response)
    
    // 更新产品列表
    if (response.success && response.products && response.products.length > 0) {
      // 将API返回的产品数据转换为组件需要的格式
      allProducts.value = response.products.map(product => ({
        id: product.id,
        name: product.title || product.name,
        price: product.selling_price || product.price,
        image: product.img || product.image || 'https://via.placeholder.com/200x200?text=产品',
        user_limit_quantity: product.user_limit_quantity || 1, // 添加限购数量
      }))
    } else {
      // 如果没有产品，显示空状态
      allProducts.value = []
    }
    
    // 重置到第一页
    currentPage.value = 1
    updateDisplayProducts()
  } catch (error) {
    console.error('获取先试后用产品失败:', error)
    // 出错时保持原有产品列表
  } finally {
    // 结束加载
    isLoading.value = false
  }
}

// 处理按钮点击 - 打开产品详情弹窗
const handleAction = (product) => {
  console.log('试用产品:', product.name)
  selectedProductId.value = product.id
  showProductDetail.value = true
}

// 关闭产品详情弹窗
const closeProductDetail = () => {
  showProductDetail.value = false
  selectedProductId.value = null
}

// 处理加入购物车
const handleAddToCart = (cartItem) => {
  console.log('Added to cart:', cartItem)
  // 这里可以添加购物车逻辑
}
</script>

<style scoped>
.sample-page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 0;
  margin: 0;
}

/* 顶部横幅 */
.banner {
  background: linear-gradient(135deg, #fbbf24, #10b981);
  color: white;
  text-align: center;
  padding: 3rem 1rem;
  font-size: 2.5rem;
  font-weight: bold;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(251, 191, 36, 0.3);
}

.banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.1) 100%);
  pointer-events: none;
}

.banner h1 {
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin: 0;
}

/* 温馨提示栏 */
.info-bar {
  background: linear-gradient(135deg, #fef3c7, #d1fae5);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #065f46;
  font-size: 0.9rem;
  border-bottom: 2px solid #fbbf24;
  position: relative;
}

.info-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #fbbf24, #10b981);
}

.info-icon {
  background: linear-gradient(135deg, #fbbf24, #10b981);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(251, 191, 36, 0.3);
}

/* 导航栏 */
.nav-bar {
  display: flex;
  gap: 1rem;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.nav-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s;
  color: #374151;
  font-weight: 500;
}

.nav-item:hover {
  background: #f3f4f6;
}

.nav-item.active {
  background: linear-gradient(135deg, #fbbf24, #10b981);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
}

/* 下拉菜单样式 */
.nav-item.dropdown {
  position: relative;
  cursor: pointer;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  z-index: 1000;
  margin-top: 8px;
  max-height: 320px;
  overflow-y: auto;
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

/* 下拉箭头样式 */
.dropdown-arrow {
  transition: transform 0.3s ease;
  display: inline-block;
  margin-left: 0.5rem;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-item {
  padding: 0.875rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  position: relative;
}

.dropdown-item:first-child {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.dropdown-item:last-child {
  border-bottom: none;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, #fef3c7, #d1fae5);
  color: #065f46;
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);
}

.dropdown-item:hover::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #fbbf24, #10b981);
  border-radius: 0 2px 2px 0;
}

.dropdown-item.selected {
  background: linear-gradient(135deg, #fef3c7, #d1fae5);
  color: #065f46;
  font-weight: 600;
}

.dropdown-item.selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #fbbf24, #10b981);
  border-radius: 0 2px 2px 0;
}

.dropdown-item.debug-info {
  color: #6b7280;
  font-style: italic;
  text-align: center;
  background: #f9fafb;
  cursor: default;
}

.dropdown-item.debug-info:hover {
  background: #f9fafb;
  transform: none;
  box-shadow: none;
}

/* 滚动条样式 */
.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #fbbf24, #10b981);
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #f59e0b, #059669);
}

/* 加载状态样式 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #10b981;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #6b7280;
  font-size: 1rem;
  font-weight: 500;
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  margin: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-message {
  color: #6b7280;
  font-size: 1rem;
  line-height: 1.5;
  max-width: 400px;
}

/* 产品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  /* 确保所有卡片高度一致 */
  display: flex;
  flex-direction: column;
  height: 100%;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.product-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 1.5rem;
  /* 使用flex布局，让按钮始终在底部 */
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  /* 单行显示，超出部分用省略号 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* 设置最大宽度，确保在不同屏幕尺寸下都能正常显示 */
  max-width: 100%;
  line-height: 1.4;
}

.product-price {
  font-size: 1.2rem;
  font-weight: bold;
  color: #10b981;
  margin: 0 0 1rem 0;
}

.action-btn {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  background: linear-gradient(135deg, #fbbf24, #10b981);
  color: white;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
  /* 让按钮始终在底部 */
  margin-top: auto;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 191, 36, 0.4);
}


/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
}

.page-btn {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.page-btn.active {
  background: linear-gradient(135deg, #fbbf24, #10b981);
  color: white;
  border-color: transparent;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
}

.page-btn:disabled {
  background: #f9fafb;
  color: #d1d5db;
  border-color: #e5e7eb;
  cursor: not-allowed;
}

.page-btn:disabled:hover {
  background: #f9fafb;
  border-color: #e5e7eb;
}

.page-dots {
  color: #6b7280;
  padding: 0 0.5rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .banner {
    font-size: 1.5rem;
    padding: 1.5rem 1rem;
  }
  
  .nav-bar {
    padding: 1rem;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  
  .nav-item {
    padding: 0.4rem 0.8rem;
    font-size: 0.9rem;
  }
  
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding: 1rem;
  }
  
  .product-info {
    padding: 1rem;
  }
  
  .product-name {
    font-size: 1rem;
  }
  
  .product-price {
    font-size: 1.1rem;
  }
  
  .pagination {
    padding: 1rem;
    gap: 0.25rem;
  }
  
  .page-btn {
    min-width: 36px;
    height: 36px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .product-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0.5rem;
  }
}

/* 产品详情页模态框 */
.product-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  width: 95%;
  max-width: 1400px;
  max-height: 95vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1001;
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
  z-index: 1002;
}

.close-btn:hover {
  background: white;
  color: #374151;
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .modal-content {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .close-btn {
    top: 0.5rem;
    right: 0.5rem;
  }
}
</style>
