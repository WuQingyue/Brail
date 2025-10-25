// API工具函数
const API_BASE_URL = 'http://localhost:8000/api'

// 环境检查函数 - 只检查 NODE_ENV
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
    const response = await request('/product/categories')
    return response
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    // 如果API调用失败，返回默认数据
    return [
      { id: 1, name: 'Electronics', icon: '📱' },
      { id: 2, name: 'Clothing & Apparel', icon: '👕' },
      { id: 3, name: 'Home & Garden', icon: '🏠' },
      { id: 4, name: 'Sports & Outdoors', icon: '⚽' },
      { id: 5, name: 'Toys & Hobbies', icon: '🧸' },
      { id: 6, name: 'Health & Beauty', icon: '💄' },
      { id: 7, name: 'Automotive', icon: '🚗' }
    ]
  }
}

export const getProductDetail = async (productId) => {
  try {
    const response = await request(`/product/get_product/${productId}`)
    return response
  } catch (error) {
    console.error('Failed to fetch product detail:', error)
    // 如果API调用失败，返回默认数据
    return {
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
          id: 1,
          name: '3米线缆',
          price: 13.63,
          image: 'https://via.placeholder.com/100x100/10b981/ffffff?text=3米',
          inStock: true
        },
        {
          id: 2,
          name: '5米线缆',
          price: 13.63,
          image: 'https://via.placeholder.com/100x100/10b981/ffffff?text=5米',
          inStock: true
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

export const getProductsByCategory = async (categoryId = null) => {
  try {
    const url = categoryId ? `/product/categories/${categoryId}` : '/product/categories'
    const response = await request(url)
    return response
  } catch (error) {
    console.error('Failed to fetch products:', error)
    // 如果API调用失败，返回默认数据
    return [
      {
        id: 1,
        name: 'Sporty Running Sneaker',
        category: "Men's Shoes",
        categoryId: 4,
        price: 89.99,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Running+Sneaker'
      },
      {
        id: 2,
        name: 'Classic Wrist Watch',
        category: 'Accessories',
        categoryId: 1,
        price: 120.50,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Wrist+Watch'
      },
      {
        id: 3,
        name: 'Wireless Headphones',
        category: 'Electronics',
        categoryId: 1,
        price: 199.00,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Headphones'
      },
      {
        id: 4,
        name: 'Smart Watch Pro',
        category: 'Electronics',
        categoryId: 1,
        price: 250.00,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Smart+Watch'
      },
      {
        id: 5,
        name: 'Stylish Sunglasses',
        category: 'Accessories',
        categoryId: 1,
        price: 45.00,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Sunglasses'
      },
      {
        id: 6,
        name: 'Leather Backpack',
        category: 'Bags & Luggage',
        categoryId: 2,
        price: 150.00,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Backpack'
      },
      {
        id: 7,
        name: 'Gaming Keyboard',
        category: 'Electronics',
        categoryId: 1,
        price: 89.99,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Gaming+Keyboard'
      },
      {
        id: 8,
        name: 'Yoga Mat',
        category: 'Sports & Outdoors',
        categoryId: 4,
        price: 35.00,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Yoga+Mat'
      },
      {
        id: 9,
        name: 'Bluetooth Speaker',
        category: 'Electronics',
        categoryId: 1,
        price: 79.99,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Bluetooth+Speaker'
      },
      {
        id: 10,
        name: 'Fitness Tracker',
        category: 'Electronics',
        categoryId: 1,
        price: 129.99,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Fitness+Tracker'
      },
      {
        id: 11,
        name: 'Running Shoes',
        category: "Men's Shoes",
        categoryId: 4,
        price: 149.99,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Running+Shoes'
      },
      {
        id: 12,
        name: 'Laptop Stand',
        category: 'Electronics',
        categoryId: 1,
        price: 59.99,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Laptop+Stand'
      },
      {
        id: 13,
        name: 'Travel Mug',
        category: 'Accessories',
        categoryId: 1,
        price: 24.99,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Travel+Mug'
      },
      {
        id: 14,
        name: 'Wireless Mouse',
        category: 'Electronics',
        categoryId: 1,
        price: 39.99,
        image: 'https://via.placeholder.com/300x200/10b981/ffffff?text=Wireless+Mouse'
      }
    ]
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
    const response = await request(`/cart/getCartId/${userId}`)
    return response.cartId
  } catch (error) {
    console.error('Failed to fetch cart ID:', error)
    // 如果API调用失败，返回默认购物车ID
    return 1
  }
}

export const getCartData = async (cartId) => {
  try {
    const response = await request(`/cart/get_cart_data/${cartId}`)
    return response
  } catch (error) {
    console.error('Failed to fetch cart data:', error)
    // 如果API调用失败，返回默认数据
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
}

export const updateCartItem = async (cartId, itemId, quantity) => {
  try {
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

export const removeCartItem = async (cartId, itemId) => {
  try {
    const response = await request(`/cart/${cartId}`, {
      method: 'DELETE',
      body: JSON.stringify({ itemId })
    })
    return response
  } catch (error) {
    console.error('Failed to remove cart item:', error)
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

export const getOrderDetails = async (orderId) => {
  try {
    // 在开发环境中返回模拟数据
    if (isDevelopment()) {
      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // 从 mock-data.json 导入订单数据
      const { orderTestData } = await import('../../tests/fixtures/mock-data.json')
      const mockOrders = orderTestData.mockOrders
      
      // 根据订单ID返回对应的订单详情
      const order = mockOrders.find(o => o.id === orderId)
      if (order) {
        return order
      } else {
        // 如果找不到对应的订单，返回默认订单
        return mockOrders[0]
      }
    }
    
    // 生产环境调用真实API
    const response = await request(`/order/get_order_detail/${orderId}`, {
      method: 'GET'
    })
    return response
  } catch (error) {
    console.error('Failed to get order details:', error)
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
  loginUser,
  registerUser,
  getCartId,
  getCartData,
  updateCartItem,
  removeCartItem,
  getOrderId,
  getOrderDetails,
  handleApiError
}

