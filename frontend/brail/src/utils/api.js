// API工具函数
const API_BASE_URL = 'http://localhost:8000/api'

// 环境检查函数 - 检查是否为开发/测试环境
const isDevelopment = () => {
  return process.env.NODE_ENV === 'real'
}

// 通用请求函数
async function request(url, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config)
    
    if (!response.ok) {
      // 尝试解析错误响应
      let errorMessage
        const errorData = await response.json()
        errorMessage = JSON.stringify({
          detail: errorData.detail || " ",
          status_code: response.status || 500
        })
      throw new Error(errorMessage)
    }
    
    return await response.json()
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// 产品类别相关API
export const getCategories = async () => {
  try {
    const response = await request('/product/categories', {
      credentials: 'include' // 发送Cookie
    })
    
    // 后端返回格式: { success: true, count: number, categories: [...] }
    if (response.success && response.categories) {
      return response.categories
    }
    
    return []
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    // 如果API调用失败，返回空数组
    return []
  }
}

export const getProductDetail = async (productId) => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
    return {
        success: true,
        code: 200,
        product: {
      id: productId,
      name: '数字电视天线 4K 1080P',
      description: '地面数字电视信号放大器 内置DVB-T2高清智能电视天线',
      category: '电子产品',
      price: 13.63,
      originalPrice: 15.99,
      images: [
        'https://via.placeholder.com/600x400/10b981/ffffff?text=产品图片1',
        'https://via.placeholder.com/600x400/10b981/ffffff?text=产品图片2',
        'https://via.placeholder.com/600x400/10b981/ffffff?text=产品图片3'
      ],
      variations: [
        {
              id: 'var-001',
              name: '3米线缆版本',
              image: 'https://via.placeholder.com/100x100/10b981/ffffff?text=3米',
          price: 13.63,
              specification: '3米线缆长度版本',
              stock_quantity: 150
        },
        {
              id: 'var-002',
              name: '5米线缆版本',
          image: 'https://via.placeholder.com/100x100/10b981/ffffff?text=5米',
              price: 14.99,
              specification: '5米线缆长度版本',
              stock_quantity: 120
        }
      ],
      moq: 50,
      priceRanges: [
        { min: 50, max: 499, price: 13.63 },
        { min: 500, max: 4999, price: 12.11 },
        { min: 5000, max: null, price: 9.09 }
      ],
      supplier: {
        id: '3066544290efeec',
        name: '供应商名称',
        rating: 4.8,
        reviews: 1250
      },
      sales: 600,
      rating: 4.5,
      reviews: 89,
      specifications: {
        '类型': '数字电视天线',
        '频率': 'VHF/UHF',
        '增益': '32dB',
        '功率': '5V DC',
        '线缆长度': '3米/5米'
          }
        }
      }
    }
    
    // 生产环境：调用真实API，使用 POST 方法，将 product_id 放在请求体中
    const response = await request('/product/get_product', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId })
    })
    return response
  } catch (error) {
    console.error('Failed to fetch product detail:', error)
    
    // 解析错误信息
    try {
      const errorData = JSON.parse(error.message)
      return {
        success: false,
        code: errorData.status_code || 500,
        message: errorData.detail || '获取产品详情失败'
      }
    } catch (parseError) {
      return {
        success: false,
        code: 500,
        message: '获取产品详情失败，请稍后重试'
      }
    }
  }
}

export const getProductsByCategory = async (categoryId = null) => {
  try {
    const url = categoryId ? `/product/categories/${categoryId}` : '/product/categories'
    const response = await request(url)
    
    // 如果后端返回格式是 { success: true, products: [...] }
    if (response.products && Array.isArray(response.products)) {
      return response.products
    }
    
    // 如果直接返回数组
    if (Array.isArray(response)) {
    return response
    }
    
    // 默认返回空数组
    return []
  } catch (error) {
    console.error('Failed to fetch products:', error)
    // 如果API调用失败，返回空数组而不是默认数据
    return []
  }
}

export const searchProducts = async (keyword) => {
  try {
    // 开发环境：返回模拟搜索结果
    if (isDevelopment()) {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 模拟搜索结果数据
      const mockSearchResults = [
        {
          id: 'search-001',
          title: `数字电视天线 4K 1080P - ${keyword}`,
          description: '地面数字电视信号放大器 内置DVB-T2高清智能电视天线',
          img: 'https://via.placeholder.com/300x200/10b981/ffffff?text=搜索结果',
          category_id: 'MLB5672',
          category_name: '电子产品',
          selling_price: 13.63,
          stock_quantity: 150,
          moq: 50
        }
      ]
      
      return {
        success: true,
        code: 200,
        count: mockSearchResults.length,
        keyword: keyword,
        products: mockSearchResults
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/product/search/keyword', {
      method: 'POST',
      body: JSON.stringify({ keyword })
    })
    return response
  } catch (error) {
    console.error('Failed to search products:', error)
    
    // 解析错误信息
    try {
      const errorData = JSON.parse(error.message)
      return {
        success: false,
        code: errorData.status_code || 500,
        message: errorData.detail || '搜索产品失败',
        count: 0,
        keyword: keyword,
        products: []
      }
    } catch (parseError) {
      return {
        success: false,
        code: 500,
        message: '搜索产品失败，请稍后重试',
        count: 0,
        keyword: keyword,
        products: []
      }
    }
  }
}

export const getProductTags = async () => {
  try {
    // 测试环境：返回模拟标签数据
    if (isDevelopment()) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 从 mock-data.json 导入标签数据
      const { productTagsData } = await import('../../tests/fixtures/mock-data.json')
      const mockTags = productTagsData.tags || []
      
      return {
        success: true,
        code: 200,
        count: mockTags.length,
        tags: mockTags
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/product/tags')
    return response
  } catch (error) {
    console.error('Failed to get product tags:', error)
    
    // 解析错误信息
    try {
      const errorData = JSON.parse(error.message)
      return {
        success: false,
        code: errorData.status_code || 500,
        message: errorData.detail || '获取产品标签失败',
        count: 0,
        tags: []
      }
    } catch (parseError) {
      return {
        success: false,
        code: 500,
        message: '获取产品标签失败，请稍后重试',
        count: 0,
        tags: []
      }
    }
  }
}

export const getSuppliers = async () => {
  try {
    // 测试环境：返回模拟供应商数据
    if (isDevelopment()) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 从 mock-data.json 导入供应商数据，并转换为数据库格式
      const { suppliers } = await import('../../tests/fixtures/mock-data.json')
      const mockSuppliers = (suppliers || []).map(supplier => ({
        id: supplier.id,
        name: supplier.company_name || supplier.name,
        location: supplier.location,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      return {
        success: true,
        code: 200,
        count: mockSuppliers.length,
        suppliers: mockSuppliers
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/product/supplier')
    return response
  } catch (error) {
    console.error('Failed to get suppliers:', error)
    
    // 解析错误信息
    try {
      const errorData = JSON.parse(error.message)
      return {
        success: false,
        code: errorData.status_code || 500,
        message: errorData.detail || '获取供应商信息失败',
        count: 0,
        suppliers: []
      }
    } catch (parseError) {
      return {
        success: false,
        code: 500,
        message: '获取供应商信息失败，请稍后重试',
        count: 0,
        suppliers: []
      }
    }
  }
}

export const createProduct = async (productData) => {
  try {
    // 测试环境：返回模拟成功响应
    if (isDevelopment()) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟产品创建成功
      const mockProduct = {
        id: `MLB${Date.now().toString(36).toUpperCase()}`,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category_id: productData.category_id,
        supplier_id: productData.supplier_id,
        stock_quantity: productData.stock,
        img: productData.main_image_url || '',
        product_mlb_thumbnail: productData.thumbnail_urls || [],
        tags: productData.tags || [],
        variations: productData.variations || [],
        created_at: new Date().toISOString()
      }
      
      return {
        success: true,
        code: 200,
        message: '产品创建成功',
        product: mockProduct
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/product/create', {
      method: 'POST',
      body: JSON.stringify(productData)
    })
    return response
  } catch (error) {
    console.error('Failed to create product:', error)
    
    // 解析错误信息
    try {
      const errorData = JSON.parse(error.message)
      return {
        success: false,
        code: errorData.status_code || 500,
        message: errorData.detail || '创建产品失败'
      }
    } catch (parseError) {
      return {
        success: false,
        code: 500,
        message: '创建产品失败，请稍后重试'
      }
    }
  }
}

// 用户认证相关API
export const loginUser = async (loginData) => {
  try {
    // 在开发环境中返回模拟数据
    if (isDevelopment()) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟登录验证
      if (loginData.email === 'test@example.com' && loginData.password === 'password123') {
        return {
          success: true,
          code: 200,
          message: '登录成功',
          user: {
            id: 1,
            name: '测试用户',
            email: 'test@example.com',
            avatar: null,
            role: 'user',
            company: '测试科技有限公司'
          }
        }
      } else if (loginData.email === 'admin@example.com' && loginData.password === 'admin123') {
        return {
          success: true,
          code: 200,
          message: '登录成功',
          user: {
            id: 2,
            name: '管理员',
            email: 'admin@example.com',
            avatar: null,
            role: 'admin',
            company: '系统管理'
          }
        }
      } else if (loginData.email === 'logistics.admin1@example.com' && loginData.password === 'logistics123') {
        console.log('=== 物流管理员1登录成功 ===')
        console.log('邮箱:', loginData.email)
        console.log('密码:', loginData.password)
        return {
          success: true,
          code: 200,
          message: '登录成功',
          user: {
            id: 3,
            name: '物流管理员1',
            email: 'logistics.admin1@example.com',
            avatar: null,
            role: 'logistics1',
            company: '物流管理1'
          }
        }
      } else if (loginData.email === 'logistics.admin2@example.com' && loginData.password === 'logistics123') {
        console.log('=== 物流管理员2登录成功 ===')
        console.log('邮箱:', loginData.email)
        console.log('密码:', loginData.password)
        return {
          success: true,
          code: 200,
          message: '登录成功',
          user: {
            id: 4,
            name: '物流管理员2',
            email: 'logistics.admin2@example.com',
            avatar: null,
            role: 'logistics',
            company: '物流管理'
          }
        }
      } else {
        return {
          success: false,
          code: 401,
          message: '邮箱或密码错误'
        }
      }
    }
    
    // 生产环境调用真实API
    const response = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
      credentials: 'include'  // 重要：携带Cookie
    })
    return response
  } catch (error) {
    console.error('Failed to login:', error)
    
    // 解析错误信息
    try {
      const errorData = JSON.parse(error.message)
      return {
        success: false,
        code: errorData.status_code || 500,
        message: errorData.detail || '登录失败'
      }
    } catch (parseError) {
      return {
        success: false,
        code: 500,
        message: error.message || '登录失败，请稍后重试'
      }
    }
  }
}

export const registerUser = async (userData) => {
  try {
    // 在开发环境中返回模拟数据
    if (isDevelopment()) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟注册验证
      if (userData.email === 'existing@example.com') {
        return {
          success: false,
          code: 409,
          message: '邮箱已被注册'
        }
      }
      
      if (userData.name === '已存在企业') {
        return {
          success: false,
          code: 409,
          message: '企业名称已被注册'
        }
      }
      
      if (userData.cnpj === '11111111111111') {
        return {
          success: false,
          code: 409,
          message: 'CNPJ已被注册'
        }
      }
      
      // 验证必填字段
      const requiredFields = ['name', 'email', 'password', 'cnpj', 'phone', 'employeeCount', 'monthlyRevenue']
      for (const field of requiredFields) {
        if (!userData[field]) {
          return {
            success: false,
            code: 400,
            message: `缺少必填字段: ${field}`
          }
        }
      }
      
      // 验证邮箱格式
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
      if (!emailPattern.test(userData.email)) {
        return {
          success: false,
          code: 400,
          message: '邮箱格式不正确'
        }
      }
      
      // 验证CNPJ格式（14位数字）
      const cnpjPattern = /^[0-9]{14}$/
      if (!cnpjPattern.test(userData.cnpj)) {
        return {
          success: false,
          code: 400,
          message: 'CNPJ格式不正确，应为14位数字'
        }
      }
      
      // 验证密码长度
      if (userData.password.length < 6) {
        return {
          success: false,
          code: 400,
          message: '密码长度至少6位'
        }
      }
      
      return {
        success: true,
        code: 200,
        message: '注册成功',
        user: {
          id: Date.now(),
          name: userData.name,
          email: userData.email,
          cnpj: userData.cnpj,
          phone: userData.phone,
          employeeCount: userData.employeeCount,
          monthlyRevenue: userData.monthlyRevenue,
          role: 'user',
          company: userData.name
        }
      }
    }
    
    // 生产环境调用真实API
    const response = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
    return response
  } catch (error) {
    console.error('Failed to register')
    console.log('error', error)
    
    // 解析 error.message 中的 JSON 字符串
    try {
      const errorData = JSON.parse(error.message)
      return {
        success: false,
        code: errorData.status_code || 500,
        message: errorData.detail || errorData.message || '注册失败'
      }
    } catch (parseError) {
      // 如果解析失败，返回默认错误
      return {
        success: false,
        code: 500,
        message: error.message || '注册失败'
      }
    }
  }
}

// 购物车相关API
export const getCartId = async (userId) => {
  try {
    // 开发环境：返回模拟数据
    if (isDevelopment()) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 返回固定的购物车ID
      return 1
    }
    
    // 生产环境：调用真实API
    const response = await request('/cart/getCartId', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    return response.cartId
  } catch (error) {
    console.error('Failed to fetch cart ID:', error)
    // 如果API调用失败，返回默认购物车ID
    return 1
  }
}

export const getCartData = async (cartId) => {
  try {
    // 开发环境：返回模拟数据
    if (isDevelopment()) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 返回模拟购物车数据
    return {
      items: [
        {
          id: 1,
          name: '数字电视天线 4K 1080P',
          description: '地面数字电视信号放大器 内置DVB-T2高清智能电视天线',
          specification: '3米线缆',
          image: 'https://via.placeholder.com/120x120/10b981/ffffff?text=天线',
          unitPrice: 13.63,
          totalPrice: 681.50,
          quantity: 50,
          moq: 50
        },
        {
          id: 2,
          name: '无线蓝牙耳机',
          description: '高品质无线蓝牙耳机，支持降噪功能',
          specification: '黑色',
          image: 'https://via.placeholder.com/120x120/10b981/ffffff?text=耳机',
          unitPrice: 25.99,
          totalPrice: 1299.50,
          quantity: 50,
          moq: 50
        },
        {
          id: 3,
          name: '智能手表',
          description: '多功能智能手表，支持健康监测',
          specification: '银色',
          image: 'https://via.placeholder.com/120x120/10b981/ffffff?text=手表',
          unitPrice: 89.99,
          totalPrice: 4499.50,
          quantity: 50,
          moq: 50
        }
      ],
      summary: {
        totalAmount: 6480.50,
        minInvestment: 10000.00,
        remainingAmount: 3519.50,
        progressPercentage: 64.8,
        shippingNote: '免费配送'
        }
      }
    }
    
    // 生产环境：调用真实API
    const response = await request(`/cart/get_cart_data/${cartId}`)
    return response
  } catch (error) {
    console.error('Failed to fetch cart data:', error)
    // 如果API调用失败，返回默认数据
    return {
      items: [],
      summary: {
        totalAmount: 0
      }
    }
  }
}

export const updateCartItem = async (cartId, itemId, quantity) => {
  try {
    // 开发环境：直接返回成功
    if (isDevelopment()) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        success: true,
        message: '数量更新成功',
        item: {
          id: itemId,
          quantity: quantity
        }
      }
    }
    
    // 生产环境：调用真实API
    const response = await request(`/cart/update_item/${cartId}/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    })
    return response
  } catch (error) {
    console.error('Failed to update cart item:', error)
    throw error
  }
}

export const removeCartItem = async (itemId) => {
  try {
    // 开发环境：直接返回成功
    if (isDevelopment()) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        success: true,
        message: '商品删除成功'
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/cart/item', {
      method: 'DELETE',
      body: JSON.stringify({ item_id: itemId })
    })
    return response
  } catch (error) {
    console.error('Failed to remove cart item:', error)
    throw error
  }
}

export const addToCart = async (cartId, productId, quantity) => {
  try {
    // 开发环境：返回模拟成功响应 
    if (isDevelopment()) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        success: true,
        message: '商品已加入购物车',
        item: {
          id: Date.now(), // 模拟新的item ID
          product_id: productId,
          quantity: quantity
        }
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/cart/add_item', {
      method: 'POST',
      body: JSON.stringify({
        cart_id: cartId,
        product_id: productId,
        quantity: quantity
      })
    })
    return response
  } catch (error) {
    console.error('Failed to add to cart:', error)
    throw error
  }
}

// 订单相关API

// 获取订单ID列表
export const getOrderId = async () => {
  try {
    // 在开发环境中返回模拟数据
    if (isDevelopment()) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 返回所有订单ID列表
      const availableOrderIds = ['ORD-001', 'ORD-002', 'ORD-003', 'ORD-004']
      
      return {
        success: true,
        orderIds: availableOrderIds  // 返回所有订单ID数组
      }
    }
    
    // 生产环境调用真实API
    const response = await request('/order/get_order_id', {
      method: 'GET'
    })
    return response
  } catch (error) {
    console.error('Failed to get order ID:', error)
    throw error
  }
}

// 订单相关API
export const createOrder = async (orderData) => {
  try {
    // 开发环境：返回模拟成功响应
    if (isDevelopment()) {
      await new Promise(resolve => setTimeout(resolve, 300))
      return {
        success: true,
        order_id: `ORD-${Date.now()}`,
        message: "订单创建成功"
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/create', {
      method: 'POST',
      body: JSON.stringify(orderData)
    })
    return response
  } catch (error) {
    console.error('Failed to create order:', error)
    throw error
  }
}

export const getOrderList = async (userId) => {
  try {
    // 开发环境：返回模拟订单列表
    if (isDevelopment()) {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 从 mock-data.json 导入订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockOrders = orderTestData.mockOrders || []
      
      return {
        success: true,
        orders: mockOrders
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/list', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    return response
  } catch (error) {
    console.error('Failed to get order list:', error)
    throw error
  }
}

// 管理员订单相关API
export const getPendingOrders = async (userId) => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      console.log('🔍 [开发模式] 使用模拟数据获取待审核订单')
      
      // 从 mock-data.json 导入管理员订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockResponse = orderTestData.adminPendingOrdersResponse
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return mockResponse
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/admin/pending', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    return response
  } catch (error) {
    console.error('Failed to get pending orders:', error)
    throw error
  }
}

export const approveOrder = async (orderId, userId) => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      console.log('✅ [开发模式] 使用模拟数据批准订单', orderId)
      
      // 从 mock-data.json 导入管理员订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockResponse = orderTestData.adminApproveOrderResponse
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return mockResponse
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/admin/approve', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, user_id: userId })
    })
    return response
  } catch (error) {
    console.error('Failed to approve order:', error)
    throw error
  }
}

export const rejectOrder = async (orderId, userId, reason = '') => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      console.log('❌ [开发模式] 使用模拟数据拒绝订单', orderId, '原因:', reason)
      
      // 从 mock-data.json 导入管理员订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockResponse = orderTestData.adminRejectOrderResponse
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return mockResponse
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/admin/reject', {
      method: 'POST',
      body: JSON.stringify({ order_id: orderId, user_id: userId, reason })
    })
    return response
  } catch (error) {
    console.error('Failed to reject order:', error)
    throw error
  }
}

export const getProcessedOrders = async (userId) => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      console.log('📋 [开发模式] 使用模拟数据获取已处理订单')
      
      // 从 mock-data.json 导入管理员订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockResponse = orderTestData.adminProcessedOrdersResponse
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return mockResponse
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/admin/processed', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    return response
  } catch (error) {
    console.error('Failed to get processed orders:', error)
    throw error
  }
}

// 物流管理相关API
export const getLogisticsProcessingOrders = async (userId) => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      console.log('📦 [开发模式] 使用模拟数据获取Processing状态订单')
      
      // 从 mock-data.json 导入订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockOrders = orderTestData.mockOrders || []
      
      // 筛选Processing状态的订单
      const processingOrders = mockOrders.filter(order => order.status === 'Processing')
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        success: true,
        orders: processingOrders
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/logistics/processing', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    return response
  } catch (error) {
    console.error('Failed to get processing orders:', error)
    throw error
  }
}

export const getLogisticsShippedOrders = async (userId) => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      console.log('🚚 [开发模式] 使用模拟数据获取Shipped状态订单')
      
      // 从 mock-data.json 导入订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockOrders = orderTestData.mockOrders || []
      
      // 筛选Shipped状态的订单
      const shippedOrders = mockOrders.filter(order => order.status === 'Shipped')
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        success: true,
        orders: shippedOrders
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/logistics/shipped', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    return response
  } catch (error) {
    console.error('Failed to get shipped orders:', error)
    throw error
  }
}

export const getLogisticsSampleProcessedOrders = async (userId) => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      console.log('✅ [开发模式] 使用模拟数据获取Customs和Delivered状态订单')
      
      // 从 mock-data.json 导入订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockOrders = orderTestData.mockOrders || []
      
      // 筛选Customs和Delivered状态的订单
      const sampleProcessedOrders = mockOrders.filter(order => 
        order.status === 'Customs' || order.status === 'Delivered'
      )
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        success: true,
        orders: sampleProcessedOrders
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/logistics/sample_processed_orders', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    return response
  } catch (error) {
    console.error('Failed to get sample processed orders:', error)
    throw error
  }
}

// 新增：获取Customs状态订单
export const getLogisticsCustomsOrders = async (userId) => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      console.log('🏛️ [开发模式] 使用模拟数据获取Customs状态订单')
      
      // 从 mock-data.json 导入订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockOrders = orderTestData.mockOrders || []
      
      // 筛选Customs状态的订单
      const customsOrders = mockOrders.filter(order => order.status === 'Customs')
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        success: true,
        orders: customsOrders
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/logistics/customs', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    return response
  } catch (error) {
    console.error('Failed to get customs orders:', error)
    throw error
  }
}

// 新增：获取Cleared状态订单
export const getLogisticsClearedOrders = async (userId) => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      console.log('✅ [开发模式] 使用模拟数据获取Cleared状态订单')
      
      // 从 mock-data.json 导入订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockOrders = orderTestData.mockOrders || []
      
      // 筛选Cleared状态的订单
      const clearedOrders = mockOrders.filter(order => order.status === 'Cleared')
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        success: true,
        orders: clearedOrders
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/logistics/cleared', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    return response
  } catch (error) {
    console.error('Failed to get cleared orders:', error)
    throw error
  }
}

// 新增：获取Delivered状态订单
export const getLogisticsDeliveredOrders = async (userId) => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      console.log('🎉 [开发模式] 使用模拟数据获取Delivered状态订单')
      
      // 从 mock-data.json 导入订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockOrders = orderTestData.mockOrders || []
      
      // 筛选Delivered状态的订单
      const deliveredOrders = mockOrders.filter(order => order.status === 'Delivered')
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))
      
      return {
        success: true,
        orders: deliveredOrders
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/logistics/delivered', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    return response
  } catch (error) {
    console.error('Failed to get delivered orders:', error)
    throw error
  }
}

// 物流管理相关API
export const updateLogisticsOrderStatus = async (orderId, userId, action, reason = '') => {
  try {
    // 测试环境：返回模拟数据
    if (isDevelopment()) {
      console.log('🔄 [开发模式] 模拟更新订单状态')
      console.log('订单ID:', orderId)
      console.log('操作:', action)
      console.log('原因:', reason)
      
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return {
        success: true,
        message: '订单状态已更新'
      }
    }
    
    // 生产环境：调用真实API
    const response = await request('/order/logistics/update_status', {
      method: 'POST',
      body: JSON.stringify({ 
        order_id: orderId, 
        user_id: userId, 
        action: action, 
        reason: reason 
      })
    })
    return response
  } catch (error) {
    console.error('Failed to update order status:', error)
    throw error
  }
}

// 错误处理
export const handleApiError = (error) => {
  console.error('API Error:', error)
  
  if (error.message.includes('404')) {
    return '请求的资源不存在'
  } else if (error.message.includes('500')) {
    return '服务器内部错误，请稍后重试'
  } else if (error.message.includes('network')) {
    return '网络连接失败，请检查网络设置'
  } else {
    return '请求失败，请重试'
  }
}

export default {
  getCategories,
  getProductsByCategory,
  getProductDetail,
  searchProducts,
  getProductTags,
  getSuppliers,
  createProduct,
  loginUser,
  registerUser,
  getCartId,
  getCartData,
  addToCart,
  updateCartItem,
  removeCartItem,
  getOrderId,
  createOrder,
  getOrderList,
  getPendingOrders,
  getProcessedOrders,
  approveOrder,
  rejectOrder,
  getLogisticsProcessingOrders,
  getLogisticsShippedOrders,
  getLogisticsSampleProcessedOrders,
  getLogisticsCustomsOrders,
  getLogisticsClearedOrders,
  getLogisticsDeliveredOrders,
  updateLogisticsOrderStatus,
  handleApiError
}

