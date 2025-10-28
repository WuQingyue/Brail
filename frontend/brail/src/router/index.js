import { createRouter, createWebHistory } from 'vue-router'
import Categories from '@/components/Home/Categories.vue'
import Order from '@/components/Order/Order.vue'
import Databash from '@/components/Admin/Databash.vue'
import LogisticsManagement from '@/components/Logistics/LogisticsManagement.vue'
import LogisticsManagement2 from '@/components/Logistics/LogisticsManagement2.vue'

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
  },
  {
    path: '/Logistics-1',
    name: 'LogisticsManagement',
    component: LogisticsManagement
  },
  {
    path: '/Logistics-2',
    name: 'LogisticsManagement2',
    component: LogisticsManagement2
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
