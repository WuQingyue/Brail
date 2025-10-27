<template>
  <div class="product-management">
    <div class="page-header">
      <h2 class="page-title">Upload New Product</h2>
    </div>

    <form @submit.prevent="handleSubmit" class="product-form">
      <div class="form-layout">
        <!-- 左侧表单区域 -->
        <div class="form-left">
          <!-- 产品名称 -->
          <div class="form-group">
            <label class="form-label">Product Name</label>
            <input 
              v-model="formData.name" 
              type="text" 
              class="form-input" 
              placeholder="Enter product name"
              required
            />
          </div>

          <!-- 产品描述 -->
          <div class="form-group">
            <label class="form-label">Product Description</label>
            <textarea 
              v-model="formData.description" 
              class="form-textarea" 
              placeholder="Enter product description"
              rows="6"
              required
            ></textarea>
          </div>

          <!-- 产品价格和类别 -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Product Price</label>
              <div class="price-input-wrapper">
                <span class="currency-symbol">$</span>
                <input 
                  v-model="formData.price" 
                  type="number" 
                  step="0.01"
                  class="form-input price-input" 
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Product Category</label>
              <select v-model="formData.category_id" class="form-select" required>
                <option value="">Select category</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- 供应商信息 -->
          <div class="form-group">
            <label class="form-label">Supplier</label>
            <select v-model="formData.supplier_id" class="form-select" required>
              <option value="">Select supplier</option>
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                {{ supplier.name }} - {{ supplier.contact_person }}
              </option>
            </select>
          </div>

          <!-- 库存数量 -->
          <div class="form-group">
            <label class="form-label">Stock Quantity</label>
            <input 
              v-model="formData.stock" 
              type="number" 
              class="form-input" 
              placeholder="0"
              min="0"
              required
            />
          </div>

          <!-- 产品标签 -->
          <div class="form-group">
            <label class="form-label">Tags</label>
            <div class="tags-container">
              <!-- 标签输入框和已选择标签的统一容器 -->
              <div class="tag-input-wrapper">
                <!-- 已选择的标签 -->
                <div 
                  v-for="tag in selectedTags" 
                  :key="tag.id"
                  class="tag-item selected"
                  :style="{ backgroundColor: getLightTagColor(tag.color) }"
                >
                  <span class="tag-text">{{ tag.display_name }}</span>
                  <button 
                    type="button"
                    @click="removeTag(tag.id)"
                    class="tag-remove"
                  >
                    ×
                  </button>
                </div>
                
                <!-- 标签输入框 -->
                <input 
                  v-model="tagInput"
                  type="text" 
                  class="tag-input" 
                  placeholder="Add a tag..."
                  @keydown.enter.prevent="addCustomTag"
                  @focus="showTagSuggestions = true"
                  @blur="hideTagSuggestions"
                />
                
                <!-- 标签建议下拉框 -->
                <div 
                  v-if="showTagSuggestions && availableTags.length > 0"
                  class="tag-suggestions"
                >
                  <div 
                    v-for="tag in availableTags" 
                    :key="tag.id"
                    class="tag-suggestion-item"
                    @click="selectTag(tag)"
                  >
                    <span 
                      class="tag-suggestion-color"
                      :style="{ backgroundColor: tag.color }"
                    ></span>
                    <span class="tag-suggestion-name">{{ tag.display_name }}</span>
                    <span class="tag-suggestion-desc">{{ tag.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 产品变体信息 -->
          <div class="form-group">
            <label class="form-label">Product Variant Information</label>
            <div class="variants-container">
              <div 
                v-for="(variation, index) in formData.variations" 
                :key="index"
                class="variant-card"
              >
                <div class="variant-header">
                  <div class="variant-id-name-row">
                    <div class="variant-field">
                      <label class="variant-label">ID</label>
                      <input 
                        v-model="variation.id"
                        type="text" 
                        class="variant-input" 
                        placeholder="e.g. 12345"
                      />
                    </div>
                    <div class="variant-field">
                      <label class="variant-label">Name</label>
                      <input 
                        v-model="variation.name"
                        type="text" 
                        class="variant-input" 
                        placeholder="e.g. Red T-shirt"
                        required
                      />
                    </div>
                    <button 
                      type="button" 
                      @click="removeVariation(index)"
                      class="btn-delete-variant"
                      v-if="formData.variations.length > 1"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div class="variant-image-row">
                  <div class="variant-image-preview">
                    <img 
                      v-if="variation.imageUrl" 
                      :src="variation.imageUrl" 
                      :alt="`Variant ${index + 1}`" 
                      @error="handleVariantImageError(index)"
                    />
                    <div v-else class="variant-image-placeholder">
                      <span class="placeholder-icon">📷</span>
                    </div>
                  </div>
                  <div class="variant-field variant-image-field">
                    <label class="variant-label">Image URL</label>
                    <input 
                      v-model="variation.imageUrl"
                      type="url" 
                      class="variant-input" 
                      placeholder="Enter Image URL"
                      @input="updateVariantImagePreview(index)"
                    />
                  </div>
                </div>

                <div class="variant-details-row">
                  <div class="variant-field">
                    <label class="variant-label">Price</label>
                    <div class="price-input-group">
                      <span class="price-symbol">$</span>
                      <input 
                        v-model.number="variation.price"
                        type="number" 
                        step="0.01"
                        class="variant-input price-input" 
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                  <div class="variant-field">
                    <label class="variant-label">Specification</label>
                    <input 
                      v-model="variation.specification"
                      type="text" 
                      class="variant-input" 
                      placeholder="e.g. Red, XL"
                      required
                    />
                  </div>
                  <div class="variant-field">
                    <label class="variant-label">Stock</label>
                    <input 
                      v-model.number="variation.stock"
                      type="number" 
                      class="variant-input" 
                      placeholder="e.g. 100"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <button 
                type="button" 
                @click="addVariation"
                class="btn-add-variant"
              >
                <span class="add-icon">+</span>
                Add another variant
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧图片区域 -->
        <div class="form-right">
          <!-- 主图URL -->
          <div class="form-group">
            <label class="form-label">Main Image URL</label>
            <div class="main-image-section">
              <div class="main-image-preview">
                <img 
                  v-if="mainImageUrl" 
                  :src="mainImageUrl" 
                  alt="Main Product Image" 
                  @error="handleMainImageError"
                />
                <div v-else class="main-image-placeholder">
                  <span class="placeholder-icon">🖼️</span>
                  <span class="placeholder-text">No image</span>
                </div>
              </div>
              <input 
                v-model="mainImageUrl"
                type="url" 
                class="form-input" 
                placeholder="Enter main image URL"
                @input="updateMainImagePreview"
              />
            </div>
          </div>

          <!-- 缩略图URL列表 -->
          <div class="form-group">
            <label class="form-label">Thumbnail URLs</label>
            <div class="thumbnail-urls-section">
              <div 
                v-for="(thumbnailUrl, index) in thumbnailUrls" 
                :key="index"
                class="thumbnail-item"
              >
                <div class="thumbnail-preview">
                  <img 
                    v-if="thumbnailUrl" 
                    :src="thumbnailUrl" 
                    :alt="`Thumbnail ${index + 1}`" 
                    @error="handleThumbnailError(index)"
                  />
                  <div v-else class="thumbnail-placeholder">
                    <span class="placeholder-icon">📷</span>
                  </div>
                </div>
                <input 
                  v-model="thumbnailUrls[index]"
                  type="url" 
                  class="form-input thumbnail-input" 
                  placeholder="Enter thumbnail URL"
                  @input="updateThumbnailPreview(index)"
                />
                <button 
                  type="button"
                  @click="removeThumbnailUrl(index)"
                  class="btn-remove-thumbnail"
                  v-if="thumbnailUrls.length > 1"
                >
                  🗑️
                </button>
              </div>
              
              <button 
                type="button" 
                @click="addThumbnailUrl"
                class="btn-add-thumbnail"
              >
                <span class="add-icon">+</span>
                Add another thumbnail
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 表单按钮 -->
      <div class="form-actions">
        <button 
          type="button" 
          @click="clearForm"
          class="btn-secondary"
          :disabled="loading"
        >
          Clear Form
        </button>
        <button 
          type="submit" 
          class="btn-primary"
          :disabled="loading"
        >
          {{ loading ? 'Submitting...' : 'Submit Product' }}
        </button>
      </div>
    </form>

    <!-- 自定义对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="dialog-container" @click.stop>
        <div class="dialog-header" :class="dialogType">
          <div class="dialog-icon">
            <span v-if="dialogType === 'success'">✅</span>
            <span v-else-if="dialogType === 'error'">❌</span>
          </div>
          <h3 class="dialog-title">{{ dialogTitle }}</h3>
        </div>
        
        <div class="dialog-body">
          <p class="dialog-message">{{ dialogMessage }}</p>
          <p v-if="dialogDetails" class="dialog-details">{{ dialogDetails }}</p>
        </div>
        
        <div class="dialog-footer">
          <button 
            @click="closeDialog" 
            class="dialog-button"
            :class="dialogType"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCategories, getProductTags, getSuppliers, createProduct } from '../../utils/api.js'

// 响应式数据
const formData = ref({
  name: '',
  description: '',
  price: '',
  category_id: '',
  supplier_id: '',
  stock: '',
  variations: [{ 
    id: '',
    name: '', 
    imageUrl: '',
    price: null,
    specification: '',
    stock: null
  }]
})

const mainImageUrl = ref('')
const thumbnailUrls = ref([''])
const loading = ref(false)
const categories = ref([])
const suppliers = ref([])

// 标签相关数据
const allTags = ref([])
const selectedTags = ref([])
const tagInput = ref('')
const showTagSuggestions = ref(false)

// 对话框相关数据
const showDialog = ref(false)
const dialogType = ref('') // 'success' 或 'error'
const dialogTitle = ref('')
const dialogMessage = ref('')
const dialogDetails = ref('')

// 计算属性
const validThumbnailUrls = computed(() => {
  return thumbnailUrls.value.filter(url => url && url.trim() !== '')
})

const hasValidMainImage = computed(() => {
  return mainImageUrl.value && mainImageUrl.value.trim() !== ''
})

const hasValidThumbnails = computed(() => {
  return validThumbnailUrls.value.length > 0
})

// 标签相关计算属性
const availableTags = computed(() => {
  if (!tagInput.value.trim()) {
    return allTags.value.filter(tag => 
      !selectedTags.value.some(selected => selected.id === tag.id)
    )
  }
  
  const input = tagInput.value.toLowerCase()
  return allTags.value.filter(tag => 
    !selectedTags.value.some(selected => selected.id === tag.id) &&
    (tag.display_name.toLowerCase().includes(input) || 
     tag.name.toLowerCase().includes(input) ||
     tag.description.toLowerCase().includes(input))
  )
})

// 方法
const loadCategories = async () => {
  try {
    const response = await getCategories()
    // getCategories 直接返回 categories 数组
    if (Array.isArray(response)) {
      categories.value = response
    }
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

const loadSuppliers = async () => {
  try {
    const response = await getSuppliers()
    if (response.success && response.suppliers) {
      // 转换数据格式以匹配前端显示需求
      suppliers.value = response.suppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        contact_person: '联系人', // 数据库中没有联系人字段，使用默认值
        location: supplier.location,
        phone: '联系电话', // 数据库中没有电话字段，使用默认值
        email: '邮箱地址' // 数据库中没有邮箱字段，使用默认值
      }))
    }
  } catch (error) {
    console.error('Failed to load suppliers:', error)
  }
}

// 标签相关方法
const loadTags = async () => {
  try {
    const response = await getProductTags()
    if (response.success && response.tags) {
      allTags.value = response.tags
    }
  } catch (error) {
    console.error('Failed to load tags:', error)
  }
}

const selectTag = (tag) => {
  if (!selectedTags.value.some(selected => selected.id === tag.id)) {
    selectedTags.value.push(tag)
  }
  tagInput.value = ''
  showTagSuggestions.value = false
}

const removeTag = (tagId) => {
  const index = selectedTags.value.findIndex(tag => tag.id === tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

const addCustomTag = () => {
  const tagName = tagInput.value.trim()
  if (tagName && !selectedTags.value.some(tag => tag.display_name === tagName)) {
    const customTag = {
      id: `custom-${Date.now()}`,
      name: tagName,
      display_name: tagName,
      color: '#6b7280',
      description: '自定义标签'
    }
    selectedTags.value.push(customTag)
    tagInput.value = ''
  }
}

const hideTagSuggestions = () => {
  // 延迟隐藏，让点击事件先执行
  setTimeout(() => {
    showTagSuggestions.value = false
  }, 200)
}

// 对话框相关方法
const showSuccessDialog = (title, message, details = '') => {
  dialogType.value = 'success'
  dialogTitle.value = title
  dialogMessage.value = message
  dialogDetails.value = details
  showDialog.value = true
}

const showErrorDialog = (title, message, details = '') => {
  dialogType.value = 'error'
  dialogTitle.value = title
  dialogMessage.value = message
  dialogDetails.value = details
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  dialogType.value = ''
  dialogTitle.value = ''
  dialogMessage.value = ''
  dialogDetails.value = ''
}

// 将深色标签颜色转换为浅色
const getLightTagColor = (darkColor) => {
  const colorMap = {
    '#10b981': '#dcfce7', // 绿色 -> 浅绿色
    '#ef4444': '#fef2f2', // 红色 -> 浅红色
    '#f59e0b': '#fef3c7', // 橙色 -> 浅橙色
    '#8b5cf6': '#f3e8ff', // 紫色 -> 浅紫色
    '#ec4899': '#fce7f3', // 粉色 -> 浅粉色
    '#6366f1': '#e0e7ff', // 蓝色 -> 浅蓝色
    '#22c55e': '#dcfce7', // 绿色 -> 浅绿色
    '#06b6d4': '#cffafe', // 青色 -> 浅青色
    '#6b7280': '#f3f4f6'  // 灰色 -> 浅灰色
  }
  return colorMap[darkColor] || '#f3f4f6'
}

const addThumbnailUrl = () => {
  thumbnailUrls.value.push('')
}

const removeThumbnailUrl = (index) => {
  thumbnailUrls.value.splice(index, 1)
}

const updateMainImagePreview = () => {
  console.log('Updated main image URL:', mainImageUrl.value)
}

const updateThumbnailPreview = (index) => {
  console.log('Updated thumbnail URL:', thumbnailUrls.value[index])
}

const handleMainImageError = () => {
  console.error('Failed to load main image:', mainImageUrl.value)
}

const handleThumbnailError = (index) => {
  console.error('Failed to load thumbnail:', thumbnailUrls.value[index])
}

const addVariation = () => {
  formData.value.variations.push({ 
    id: '',
    name: '', 
    imageUrl: '',
    price: null,
    specification: '',
    stock: null
  })
}

const removeVariation = (index) => {
  // 确保至少保留一个变体框
  if (formData.value.variations.length > 1) {
    formData.value.variations.splice(index, 1)
  }
}

const updateVariantImagePreview = (index) => {
  console.log('Updated variant image URL:', formData.value.variations[index].imageUrl)
}

const handleVariantImageError = (index) => {
  console.error('Failed to load variant image:', formData.value.variations[index].imageUrl)
}

const handleSubmit = async (event) => {
  // 阻止表单默认提交行为
  if (event) {
    event.preventDefault()
  }
  
  try {
    loading.value = true
    
    // 构建提交数据
    const productData = {
      name: formData.value.name,
      description: formData.value.description,
      price: parseFloat(formData.value.price),
      category_id: formData.value.category_id,
      supplier_id: formData.value.supplier_id,
      stock: parseInt(formData.value.stock),
      main_image_url: mainImageUrl.value,
      thumbnail_urls: validThumbnailUrls.value,
      tags: selectedTags.value.map(tag => tag.display_name),
      variations: formData.value.variations.filter(v => 
        v.name && v.specification && v.price !== null && v.stock !== null
      )
    }
    
    console.log('Submitting product:', productData)
    
    // 调用创建产品API
    const response = await createProduct(productData)
    
    if (response.success) {
      showSuccessDialog(
        '产品创建成功！',
        `产品已成功创建`,
        `产品ID: ${response.product.id}`
      )
      clearForm()
    } else {
      showErrorDialog(
        '产品创建失败',
        response.message || '创建产品时发生错误',
        '请检查输入信息并重试'
      )
    }
    
  } catch (error) {
    console.error('Failed to create product:', error)
    
    // 解析错误信息
    let errorMessage = '产品创建失败，请稍后重试'
    let errorDetails = ''
    
    if (error.message) {
      try {
        const errorData = JSON.parse(error.message)
        if (errorData.detail) {
          errorMessage = errorData.detail
          // 如果是外键约束错误，提供更友好的提示
          if (errorMessage.includes('supplier_id') && errorMessage.includes('foreign key constraint')) {
            errorMessage = '供应商信息无效'
            errorDetails = '请确保选择了有效的供应商'
          }
        }
      } catch (parseError) {
        errorMessage = error.message
      }
    }
    
    showErrorDialog(
      '产品创建失败',
      errorMessage,
      errorDetails || '请检查所有必填字段并重试'
    )
  } finally {
    loading.value = false
  }
}

const clearForm = () => {
  formData.value = {
    name: '',
    description: '',
    price: '',
    category_id: '',
    supplier_id: '',
    stock: '',
    variations: [{ 
      id: '',
      name: '', 
      imageUrl: '',
      price: null,
      specification: '',
      stock: null
    }]
  }
  mainImageUrl.value = ''
  thumbnailUrls.value = ['']
  selectedTags.value = []
  tagInput.value = ''
}

// 生命周期
onMounted(() => {
  loadCategories()
  loadSuppliers()
  loadTags()
})
</script>

<style scoped>
.product-management {
  width: 100%;
  padding: 0;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* 表单布局 */
.product-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 3rem;
}

.form-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 2rem;
}

.form-left,
.form-right {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #374151;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #fbbf24;
  box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.price-input-wrapper {
  position: relative;
}

.currency-symbol {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  font-weight: 600;
}

.price-input {
  padding-left: 2.5rem;
}

/* 变体信息 */
.variants-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.variant-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.variant-header {
  margin-bottom: 0.5rem;
}

.variant-id-name-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.variant-image-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.variant-details-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.variant-field {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.variant-image-field {
  flex: 2;
}

.variant-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.variant-input {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1f2937;
  background-color: white;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.variant-input:focus {
  border-color: #84cc16;
  box-shadow: 0 0 0 3px rgba(132, 204, 22, 0.1);
  outline: none;
}

.variant-image-preview {
  width: 60px;
  height: 40px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  overflow: hidden;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.variant-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.variant-image-placeholder {
  color: #9ca3af;
  font-size: 1.2rem;
}

.price-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.price-symbol {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
  font-size: 0.9rem;
  z-index: 1;
}

.price-input {
  padding-left: 2rem;
}

.btn-delete-variant {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.btn-delete-variant:hover {
  background: #fecaca;
  transform: scale(1.05);
}

.btn-add-variant {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px dashed #84cc16;
  background: #f7fee7;
  color: #65a30d;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
  align-self: flex-start;
}

.btn-add-variant:hover {
  background: #ecfccb;
  border-color: #65a30d;
}

.add-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

/* 主图区域 */
.main-image-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-image-preview {
  width: 100%;
  height: 200px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.main-image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: #9ca3af;
}

.main-image-placeholder .placeholder-icon {
  font-size: 2rem;
}

.main-image-placeholder .placeholder-text {
  font-size: 0.9rem;
}

/* 缩略图区域 */
.thumbnail-urls-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.thumbnail-item {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.thumbnail-preview {
  width: 60px;
  height: 60px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.thumbnail-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.thumbnail-placeholder .placeholder-icon {
  font-size: 1.5rem;
}

.thumbnail-input {
  flex: 1;
}

.btn-remove-thumbnail {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.btn-remove-thumbnail:hover {
  background: #fecaca;
  transform: scale(1.05);
}

.btn-add-thumbnail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 2px dashed #84cc16;
  background: #f7fee7;
  color: #65a30d;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.btn-add-thumbnail:hover {
  background: #ecfccb;
  border-color: #65a30d;
}

.add-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

/* 表单按钮 */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-secondary,
.btn-primary {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #d1d5db;
}

.btn-primary {
  background: linear-gradient(135deg, #84cc16, #65a30d);
  color: white;
  box-shadow: 0 4px 8px rgba(132, 204, 22, 0.3);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(132, 204, 22, 0.4);
}

.btn-secondary:disabled,
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 产品列表区域 */
.products-list-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.search-box {
  flex: 1;
  max-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid #f3f4f6;
  border-top: 3px solid #fbbf24;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 产品表格 */
.products-table-wrapper {
  overflow-x: auto;
}

.products-table {
  width: 100%;
  border-collapse: collapse;
}

.products-table thead {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.products-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #6b7280;
  font-size: 0.9rem;
}

.products-table tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.2s;
}

.products-table tbody tr:hover {
  background: #f9fafb;
}

.products-table td {
  padding: 1rem;
  color: #374151;
}


/* 响应式设计 */
@media (max-width: 1024px) {
  .form-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .search-box {
    max-width: 100%;
  }

  .products-table {
    font-size: 0.85rem;
  }

  .products-table th,
  .products-table td {
    padding: 0.75rem 0.5rem;
  }

  .variant-id-name-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .variant-image-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .variant-details-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .btn-delete-variant {
    width: 100%;
    border-radius: 8px;
    margin-top: 0.5rem;
  }

  .variant-image-preview {
    width: 100%;
    height: 60px;
  }

  .variant-image-field {
    flex: 1;
  }
}

/* 标签相关样式 */
.tags-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tag-input-wrapper {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  align-items: center;
  transition: border-color 0.2s ease;
}

.tag-input-wrapper:focus-within {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.tag-item.selected {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.tag-text {
  white-space: nowrap;
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border: none;
  border-radius: 50%;
  background: rgba(107, 114, 128, 0.2);
  color: #6b7280;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s ease;
}

.tag-remove:hover {
  background: rgba(107, 114, 128, 0.3);
}

.tag-input {
  flex: 1;
  min-width: 120px;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  background: transparent;
  color: #6b7280;
  transition: color 0.2s ease;
}

.tag-input:focus {
  outline: none;
  color: #374151;
}

.tag-input::placeholder {
  color: #9ca3af;
}

.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  margin-top: 0.25rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
}

.tag-suggestion-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.tag-suggestion-item:last-child {
  border-bottom: none;
}

.tag-suggestion-item:hover {
  background: #f9fafb;
}

.tag-suggestion-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-suggestion-name {
  font-weight: 500;
  color: #374151;
  flex-shrink: 0;
}

.tag-suggestion-desc {
  font-size: 0.875rem;
  color: #6b7280;
  flex: 1;
  text-align: right;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .tag-input-wrapper {
    min-height: 3rem;
  }
  
  .tag-item {
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
  }
  
  .tag-suggestion-item {
    padding: 0.6rem;
  }
  
  .tag-suggestion-desc {
    display: none;
  }
}

/* 自定义对话框样式 - 黄色和绿色搭配 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: dialogSlideIn 0.3s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  padding: 1.5rem 2rem 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 2px solid #f3f4f6;
}

.dialog-header.success {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border-bottom-color: #f59e0b;
}

.dialog-header.error {
  background: linear-gradient(135deg, #fef2f2, #fecaca);
  border-bottom-color: #ef4444;
}

.dialog-icon {
  font-size: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.dialog-header.success .dialog-icon {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.dialog-header.error .dialog-icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.dialog-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  color: #1f2937;
}

.dialog-body {
  padding: 1.5rem 2rem;
}

.dialog-message {
  font-size: 1.1rem;
  color: #374151;
  margin: 0 0 1rem 0;
  line-height: 1.6;
}

.dialog-details {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
  padding: 0.75rem 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #d1d5db;
  font-family: 'Courier New', monospace;
}

.dialog-footer {
  padding: 1rem 2rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  background: #f9fafb;
}

.dialog-button {
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.dialog-button.success {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.dialog-button.success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.dialog-button.error {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.dialog-button.error:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
}

.dialog-button:active {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-container {
    width: 95%;
    margin: 1rem;
  }
  
  .dialog-header {
    padding: 1rem 1.5rem 0.75rem;
  }
  
  .dialog-body {
    padding: 1rem 1.5rem;
  }
  
  .dialog-footer {
    padding: 0.75rem 1.5rem 1rem;
  }
  
  .dialog-title {
    font-size: 1.25rem;
  }
  
  .dialog-message {
    font-size: 1rem;
  }
}
</style>

