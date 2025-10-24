import { createRouter, createWebHistory } from 'vue-router'
import Categories from '@/components/Home/Categories.vue'
import Order from '@/components/Order/Order.vue'
import Databash from '@/components/Admin/Databash.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Categories
  },
  {
    path: '/order',
    name: 'Order',
    component: Order
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Databash
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
