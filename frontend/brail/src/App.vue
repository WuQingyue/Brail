<script setup>
import Header from './components/Layout/Header.vue'
import Categories from './components/Home/Categories.vue'
</script>

<template>
  <div id="app">
    <!-- 导航栏 -->
    <Header />
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <Categories />
    </main>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  padding: 0;
}

.main-content {
  flex: 1;
  padding: 2rem;
  width: 100%;
  min-height: calc(100vh - 80px);
  box-sizing: border-box;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}
</style>
