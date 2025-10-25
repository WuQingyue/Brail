import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * 用户信息结构:
 * {
 *   user_id: string,
 *   user_email: string,
 *   user_name: string,
 *   role: string // 用户角色 (user/admin)
 * }
 */

export const useUserStore = defineStore('user', () => {
  const user = ref(null)

  // 登录状态 - 基于用户数据判断
  const isLoggedIn = computed(() => {
    return !!(user.value && user.value.user_id && user.value.user_email)
  })

  // 设置用户信息
  function setUser(userInfo) {
    user.value = userInfo
    // 持久化存储用户信息到 localStorage
    if (userInfo) {
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    }
  }

  // 清除用户信息
  function clearUser() {
    user.value = null
    // 清除本地存储的所有用户信息
    localStorage.removeItem('userId')
    localStorage.removeItem('userInfo')
    // 注意：Cookie由后端管理，前端不主动清除
  }

  // 从 localStorage 初始化用户信息
  function initUserFromStorage() {
    try {
      const userInfoStr = localStorage.getItem('userInfo')
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr)
        // 验证用户信息的完整性
        if (userInfo.user_id && userInfo.user_email) {
          user.value = userInfo
          console.log('从 localStorage 恢复用户信息:', userInfo)
          return true
        }
      }
      
      // 如果没有完整的用户信息，清除用户状态
      user.value = null
      console.log('没有找到用户信息，保持未登录状态')
      return false
    } catch (error) {
      console.error('恢复用户信息时出错:', error)
      user.value = null
      return false
    }
  }

  // 检查是否为管理员
  function checkIsAdmin() {
    return !!(user.value && user.value.role === 'admin')
  }

  // 获取用户ID
  function getUserId() {
    return user.value ? user.value.user_id : null
  }

  // 获取用户Email
  function getUserEmail() {
    return user.value ? user.value.user_email : null
  }

  // 获取用户名称
  function getUserName() {
    return user.value ? user.value.user_name : null
  }

  // 获取用户角色
  function getUserRole() {
    return user.value ? user.value.role : null
  }

  return {
    user,
    isLoggedIn,
    setUser,
    clearUser,
    initUserFromStorage,
    checkIsAdmin,
    getUserId,
    getUserEmail,
    getUserName,
    getUserRole
  }
})

