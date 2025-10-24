import { createRouter, createWebHistory } from 'vue-router'
import Categories from '@/components/Home/Categories.vue'
import Order from '@/components/Order/Order.vue'

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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
