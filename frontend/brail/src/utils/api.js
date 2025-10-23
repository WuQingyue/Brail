// API工具函数
const API_BASE_URL = '/api'

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
      throw new Error(`HTTP error! status: ${response.status}`)
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
  handleApiError
}

