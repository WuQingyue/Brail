<script setup>
import Header from './components/Layout/Header.vue'
</script>

<template>
  <div id="app">
    <!-- 导航栏 -->
    <Header />
    
    <!-- 主要内容区域 -->
    <main class="main-content">
      <div class="welcome">
        <div class="welcome-badge">
          <span class="badge-text">🇧🇷</span>
        </div>
        <h1>欢迎使用 Brail 平台</h1>
        <p>专为巴西企业打造的现代化服务平台</p>
        <div class="feature-highlights">
          <div class="highlight-item">
            <div class="highlight-icon">🌱</div>
            <span>环保理念</span>
          </div>
          <div class="highlight-item">
            <div class="highlight-icon">☀️</div>
            <span>阳光活力</span>
          </div>
          <div class="highlight-item">
            <div class="highlight-icon">🤝</div>
            <span>合作共赢</span>
          </div>
        </div>
      </div>
      
    </main>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem;
  width: 100%;
  background: linear-gradient(135deg, #f0fdf4 0%, #fefce8 100%);
  min-height: calc(100vh - 80px);
}

.welcome {
  text-align: center;
  padding: 3rem 0;
  margin-bottom: 2rem;
}

.welcome-badge {
  margin-bottom: 1.5rem;
}

.badge-text {
  font-size: 3rem;
  display: inline-block;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.welcome h1 {
  background: linear-gradient(135deg, #10b981, #fbbf24);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  font-size: 2.5rem;
  font-weight: 700;
}

.welcome p {
  color: #374151;
  font-size: 1.2rem;
  margin-bottom: 2rem;
  font-weight: 500;
}

.feature-highlights {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 2rem;
  flex-wrap: wrap;
}

.highlight-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  min-width: 120px;
}

.highlight-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.highlight-icon {
  font-size: 2rem;
}

.highlight-item span {
  color: #374151;
  font-weight: 600;
  font-size: 0.9rem;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .welcome h1 {
    font-size: 2rem;
  }
  
  .welcome p {
    font-size: 1rem;
  }
  
  .feature-highlights {
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  
  .highlight-item {
    min-width: 200px;
  }
  
  .badge-text {
    font-size: 2.5rem;
  }
}
</style>
