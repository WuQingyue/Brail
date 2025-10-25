<template>
  <div class="categories-container">
    <!-- 主要内容区域 -->
    <div class="main-layout">
      <!-- 左侧类别导航 -->
      <aside class="categories-sidebar">
        <h2>类别</h2>
        <ul class="categories-list">
          <li 
            v-for="category in categories" 
            :key="category.id"
            :class="['category-item', { active: selectedCategory === category.id }]"
            @click="selectCategory(category.id)"
          >
            <div class="category-icon" v-html="category.icon"></div>
            <span class="category-name">{{ category.name }}</span>
            <span class="category-arrow">→</span>
          </li>
          <li class="all-categories" @click="selectAllCategories">
            <span class="category-name">所有类别</span>
            <span class="category-arrow">→</span>
          </li>
        </ul>
      </aside>

      <!-- 右侧产品展示区域 -->
      <main class="products-section">
        <!-- 促销横幅 -->
        <div class="promo-banner">
          <div class="promo-content">
            <h3>独家夏季促销</h3>
            <p>精选商品最高50%折扣，不要错过！</p>
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input 
                v-model="searchQuery"
                type="text" 
                placeholder="搜索产品..."
                @input="handleSearch"
              />
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>正在加载数据...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="loadProducts(selectedCategory)" class="retry-btn">重试</button>
        </div>

        <!-- 产品网格 -->
        <div v-else-if="filteredProducts.length > 0" class="products-grid">
          <div 
            v-for="product in filteredProducts" 
            :key="product.id"
            class="product-card"
            @click="handleProductClick(product.id)"
          >
            <div class="product-image-container">
              <img 
                :src="product.image" 
                :alt="product.name"
                class="product-image"
                @error="handleImageError"
              />
            </div>
            
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-category">{{ product.category }}</p>
              <div class="product-price">${{ product.price.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <!-- 没有产品时的提示 -->
        <div v-else class="no-products">
          <div class="no-products-content">
            <div class="no-products-icon">📦</div>
            <h3>暂无产品</h3>
            <p>当前筛选条件下没有找到产品，请尝试其他搜索条件或类别。</p>
          </div>
        </div>

        <!-- 分页控件 -->
        <div class="pagination" v-if="totalPages > 1 && filteredProducts.length > 0">
          <button 
            class="pagination-btn prev"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            ←
          </button>
          
          <div class="page-numbers">
            <button 
              v-for="page in visiblePages" 
              :key="page"
              :class="['page-btn', { active: page === currentPage }]"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </div>
          
          <button 
            class="pagination-btn next"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            →
          </button>
        </div>
      </main>
    </div>

    <!-- 产品详情页模态框 -->
    <div v-if="showProductDetail" class="product-detail-modal">
      <div class="modal-overlay" @click="closeProductDetail"></div>
      <div class="modal-content">
        <button class="close-btn" @click="closeProductDetail">×</button>
        <ProductDetail 
          :product-id="selectedProductId"
          @add-to-cart="handleAddToCart"
        />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { getCategories, getProductsByCategory, handleApiError } from '../../utils/api.js'
import ProductDetail from '../Product/ProductDetail.vue'

// 响应式数据
const categories = ref([])
const products = ref([])
const selectedCategory = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(8)
const loading = ref(false)
const error = ref(null)
const showProductDetail = ref(false)
const selectedProductId = ref(null)

// 计算属性
const filteredProducts = computed(() => {
  let filtered = products.value

  // 按类别过滤
  if (selectedCategory.value) {
    filtered = filtered.filter(product => product.categoryId === selectedCategory.value)
  }

  // 按搜索查询过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    )
  }

  // 分页
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filtered.slice(start, end)
})

const totalPages = computed(() => {
  // 获取过滤后的产品总数
  let filtered = products.value

  // 按类别过滤
  if (selectedCategory.value) {
    filtered = filtered.filter(product => product.categoryId === selectedCategory.value)
  }

  // 按搜索查询过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    )
  }

  // 如果没有产品，返回0页
  if (filtered.length === 0) {
    return 0
  }

  return Math.ceil(filtered.length / itemsPerPage.value)
})

const visiblePages = computed(() => {
  const pages = []
  const total = totalPages.value
  const current = currentPage.value
  
  // 显示当前页前后2页
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// 方法
const loadCategories = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await getCategories()
    categories.value = data
  } catch (err) {
    error.value = handleApiError(err)
    console.error('Failed to load categories:', err)
  } finally {
    loading.value = false
  }
}

const loadProducts = async (categoryId = null) => {
  try {
    loading.value = true
    error.value = null
    const data = await getProductsByCategory(categoryId)
    products.value = data
  } catch (err) {
    error.value = handleApiError(err)
    console.error('Failed to load products:', err)
  } finally {
    loading.value = false
  }
}

const selectCategory = async (categoryId) => {
  selectedCategory.value = categoryId
  currentPage.value = 1
  await loadProducts(categoryId)
}

const selectAllCategories = async () => {
  selectedCategory.value = null
  currentPage.value = 1
  await loadProducts()
}

const handleSearch = () => {
  currentPage.value = 1
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}


const handleImageError = (event) => {
  event.target.src = 'https://via.placeholder.com/300x200/10b981/ffffff?text=Product+Image'
}

const handleProductClick = (productId) => {
  selectedProductId.value = productId
  showProductDetail.value = true
}

const closeProductDetail = () => {
  showProductDetail.value = false
  selectedProductId.value = null
}

const handleAddToCart = (cartItem) => {
  console.log('Added to cart:', cartItem)
  // 这里可以添加购物车逻辑
}



// 生命周期
onMounted(async () => {
  await loadCategories()
  await loadProducts()
})

// 监听搜索查询变化
watch(searchQuery, () => {
  currentPage.value = 1
})

// 监听过滤后的产品变化，如果为空则重置页面
watch(filteredProducts, (newProducts) => {
  if (newProducts.length === 0 && currentPage.value > 1) {
    currentPage.value = 1
  }
})
</script>

<style scoped>
.categories-container {
  min-height: 100vh;
  background: #f8f9fa;
}


.main-layout {
  display: flex;
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  gap: 2rem;
  align-items: stretch;
  min-height: calc(100vh - 4rem);
}

.categories-sidebar {
  flex: 0 0 22%;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  align-self: stretch;
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.categories-sidebar h2 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1.25rem;
  font-weight: 600;
}

.categories-list {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.category-item,
.all-categories {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-item:hover,
.all-categories:hover {
  background: #f3f4f6;
}

.category-item:hover .category-icon {
  transform: scale(1.1);
}

.category-item.active {
  background: #fef3c7;
  color: #d97706;
}

.category-icon {
  margin-right: 0.75rem;
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease;
  color: #374151; /* SVG 图标颜色 */
}

.category-icon svg {
  width: 100%;
  height: 100%;
}

/* 鼠标悬停时改变颜色 */
.category-item:hover .category-icon {
  color: #10b981; /* 悬停时的绿色 */
}

.category-item.active .category-icon {
  color: #d97706; /* 激活时的橙色 */
}

.category-name {
  flex: 1;
  font-weight: 500;
}

.category-arrow {
  color: #9ca3af;
  font-size: 0.875rem;
}

.products-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-self: stretch;
  min-height: 100%;
}

.promo-banner {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}

.promo-content {
  width: 100%;
}

.promo-banner h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.promo-banner p {
  margin: 0;
  opacity: 0.9;
}

.search-container {
  margin-bottom: 2rem;
}

.search-box {
  position: relative;
  width: 66.67%;
  margin-top: 1rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.9);
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.8);
  background: white;
}

.search-box input::placeholder {
  color: #6b7280;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex: 1;
  align-content: start;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.product-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: #f3f4f6;
  border-radius: 8px;
}


.product-info {
  padding: 1rem;
}

.product-name {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
}

.product-category {
  margin: 0 0 0.75rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.product-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
}

.no-products {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  padding: 2rem;
}

.no-products-content {
  text-align: center;
  color: #6b7280;
}

.no-products-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.no-products-content h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
}

.no-products-content p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
}

/* 加载状态样式 */
.loading {
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

.loading p {
  color: #6b7280;
  font-size: 1rem;
  margin: 0;
}

/* 错误状态样式 */
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin: 2rem 0;
}

.error p {
  color: #dc2626;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #059669;
  transform: translateY(-1px);
}


.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-top: 3rem;
  padding: 1.5rem 0;
}

.pagination-btn {
  padding: 0.75rem 1.25rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  color: #374151;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-btn:hover:not(:disabled) {
  background: #10b981;
  border-color: #10b981;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-btn {
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  min-width: 2.5rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-btn:hover {
  background: #f0fdf4;
  border-color: #10b981;
  color: #10b981;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
}

.page-btn.active {
  background: linear-gradient(135deg, #10b981, #059669);
  border-color: #10b981;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}


/* 响应式设计 */
@media (max-width: 768px) {
  .main-layout {
    flex-direction: column;
    padding: 1rem;
    align-items: stretch;
    max-width: 100%;
  }
  
  .categories-sidebar {
    flex: none;
    order: 2;
    align-self: stretch;
    width: 100%;
  }
  
  .products-section {
    order: 1;
    align-self: stretch;
  }
  
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  
  .promo-banner {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-box {
    width: 100%;
    margin-top: 1rem;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 2rem;
    padding: 1rem 0;
  }
  
  .pagination-btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  .page-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    min-width: 2rem;
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
