import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
// import router from './router'  // 暂时注释掉，等vue-router安装后再启用

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
// app.use(router)  // 暂时注释掉
app.mount('#app')
