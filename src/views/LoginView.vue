<template>
  <div>
    <!-- Global Loader -->
    <div v-if="isLoading" class="global-loader">
      <div class="global-spinner"></div>
    </div>

    <!-- Toast Container -->
    <div id="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['modern-toast', toast.type]">
        <i :class="['fas', toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle', 'toast-icon']"></i>
        <div class="toast-msg">{{ toast.message }}</div>
      </div>
    </div>

    <div class="overlay"></div>

    <div class="content-container">
      <!-- Header -->
      <div class="header">
        <i class="fas fa-feather-alt"></i>
        <h1 v-html="pageTitle"></h1>
        <p>{{ pageDesc }}</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleAuth">
        <!-- Name Field (Register only) -->
        <div v-if="!isLogin" class="input-box fade-in">
          <input type="text" v-model="form.name" placeholder="Your Name" />
          <i class="far fa-user"></i>
        </div>

        <!-- Email -->
        <div class="input-box">
          <input type="email" v-model="form.email" placeholder="Email Address" required />
          <i class="far fa-envelope"></i>
        </div>

        <!-- Password -->
        <div class="input-box">
          <input type="password" v-model="form.password" placeholder="Password" required />
          <i class="fas fa-key"></i>
        </div>

        <button type="submit" class="login-btn" :disabled="isLoading">
          {{ isLoading ? 'កំពុងដំណើរការ...' : (isLogin ? 'Log In' : 'Register') }}
        </button>
      </form>

      <!-- Toggle -->
      <div class="switch-text">
        <span>{{ isLogin ? 'New here?' : 'Already a member?' }}</span>
        <span @click="toggleMode">{{ isLogin ? 'Create an Account' : 'Log In' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../composables/useApi.js'

const router = useRouter()

// ===== STATE =====
const isLogin = ref(true)
const isLoading = ref(false)
const toasts = ref([])

const form = ref({ name: '', email: '', password: '' })

// ===== COMPUTED =====
const pageTitle = computed(() =>
  isLogin.value ? 'Explore<br>Knowledge' : 'Begin Your<br>Journey'
)
const pageDesc = computed(() =>
  isLogin.value
    ? 'Sign in to access your digital library.'
    : 'Join the community of readers.'
)

// ===== METHODS =====
function toggleMode() {
  isLogin.value = !isLogin.value
  form.value = { name: '', email: '', password: '' }
}

function showToast(message, type = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
}

async function handleAuth() {
  const { name, email, password } = form.value

  if (!email || !password) {
    showToast('សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់', 'error')
    return
  }
  if (!isLogin.value && !name) {
    showToast('សូមបញ្ចូលឈ្មោះរបស់អ្នក', 'error')
    return
  }

  isLoading.value = true
  try {
    const data = isLogin.value
      ? await authApi.login(email, password)
      : await authApi.register(name, email, password)

    if (data.success) {
      if (isLogin.value) {
        sessionStorage.setItem('currentUser', JSON.stringify(data.user))
        if (data.session_id) sessionStorage.setItem('session_id', data.session_id)
        showToast('ចូលគណនីបានជោគជ័យ!', 'success')
        setTimeout(() => {
          router.push(data.user.role === 'admin' ? '/admin' : '/dashboard')
        }, 1200)
      } else {
        showToast('ចុះឈ្មោះបានជោគជ័យ! សូមចូលគណនី។', 'success')
        toggleMode()
      }
    } else {
      showToast(data.message || 'មានបញ្ហាក្នុងការភ្ជាប់ទិន្នន័យ', 'error')
    }
  } catch (e) {
    showToast('មិនអាចភ្ជាប់ទៅកាន់ Server បានទេ។', 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
:root {
  --primary: #D4AF37;
  --primary-hover: #B5952F;
  --dark-overlay: rgba(15, 23, 42, 0.85);
  --glass-input: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.2);
  --text-white: #F8FAFC;
  --text-gray: #94A3B8;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

:global(body) {
  background: url('https://images.unsplash.com/photo-1507842217121-9e9628376272?q=80&w=1000&auto=format&fit=crop') no-repeat center center/cover;
  width: 100vw;
  font-family: 'Lato', sans-serif;
  overflow-y: auto;
  display: flex;
  align-items: flex-end;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(15, 23, 42, 0.6) 0%, rgba(15, 23, 42, 1) 90%);
  z-index: 1;
}

.content-container {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 40px 30px 50px;
  margin-top: 10rem;
}

.header {
  margin-bottom: 40px;
}

.header i {
  font-size: 40px;
  color: #D4AF37;
  margin-bottom: 15px;
  display: inline-block;
}

.header h1 {
  font-family: 'Playfair Display', serif;
  font-size: 38px;
  color: #F8FAFC;
  line-height: 1.1;
  margin-bottom: 10px;
}

.header p {
  color: #94A3B8;
  font-size: 16px;
}

.input-box {
  position: relative;
  margin-bottom: 20px;
}

.input-box input {
  width: 100%;
  padding: 20px 20px 20px 55px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #F8FAFC;
  font-size: 16px;
  outline: none;
  backdrop-filter: blur(5px);
  transition: all 0.3s;
}

.input-box i {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #94A3B8;
  font-size: 18px;
}

.input-box input:focus {
  border-color: #D4AF37;
  background: rgba(255, 255, 255, 0.15);
}

.input-box input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.login-btn {
  width: 100%;
  padding: 20px;
  background: #D4AF37;
  color: #0F172A;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  text-align: center;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 5px 20px rgba(212, 175, 55, 0.3);
  transition: transform 0.2s;
}

.login-btn:active {
  transform: scale(0.98);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.switch-text {
  text-align: center;
  margin-top: 25px;
  color: #94A3B8;
  font-size: 14px;
}

.switch-text span {
  color: #F8FAFC;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 5px;
}

.fade-in {
  animation: fadeIn 0.5s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Toast */
#toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 90%;
  max-width: 350px;
  pointer-events: none;
}

.modern-toast {
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 4px solid #D4AF37;
  color: #fff;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  gap: 15px;
  animation: toastEnter 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.modern-toast.error {
  border-left-color: #ef4444;
}

.modern-toast.success {
  border-left-color: #10b981;
}

.toast-icon {
  font-size: 20px;
}

.modern-toast.success .toast-icon {
  color: #10b981;
}

.modern-toast.error .toast-icon {
  color: #ef4444;
}

.toast-msg {
  font-size: 14px;
  line-height: 1.4;
}

@keyframes toastEnter {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Loader */
.global-loader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.8);
  z-index: 99999;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
}

.global-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(212, 175, 55, 0.2);
  border-top: 5px solid #D4AF37;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
