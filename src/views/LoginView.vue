<template>
  <div>
    <div v-if="isLoading" class="global-loader">
      <div class="global-spinner"></div>
    </div>

    <div id="toast-container">
      <div v-for="toast in toasts" :key="toast.id" :class="['modern-toast', toast.type]">
        <i :class="['fas', toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle', 'toast-icon']"></i>
        <div class="toast-msg">{{ toast.message }}</div>
      </div>
    </div>

    <div class="overlay"></div>

    <div class="content-container">
      <div class="header">
        <img class="logo-login" src="../../public/img/DUC.png" alt="">
        <h1 v-html="pageTitle"></h1>
        <p>{{ pageDesc }}</p>
      </div>

      <div v-if="isForgotPassword" class="fade-in">
        <div class="forgot-header-text">
          <h2 style="color: white; margin-bottom: 10px;">
            {{ forgotStep === 1 ? t('forgot_title_1', 'Search Account') : forgotStep === 2 ? t('forgot_title_2',
              'Confirm code') : t('forgot_title_3', 'New Password') }}
          </h2>
          <p style="color: #94A3B8; font-size: 14px; margin-bottom: 25px;">
            {{ forgotStep === 1 ? t('forgot_desc_1', 'Please enter your email to receive the OTP code.') : forgotStep
              === 2 ?
              `${t('forgot_desc_2', 'Code sent to')} ${forgotForm.email}` : t('forgot_desc_3', 'Enter New Password') }}
          </p>
        </div>

        <form @submit.prevent="handleForgotSubmit">
          <div v-if="forgotStep === 1" class="input-box">
            <input class="input-login" type="email" v-model="forgotForm.email" :placeholder="t('login_ph_email', 'Email Address')"
              required />
            <i class="far fa-envelope"></i>
          </div>

          <div v-if="forgotStep === 2" class="input-box">
            <input class="input-login" type="text" v-model="forgotForm.otp" :placeholder="t('forgot_ph_otp', '6-digit code')" required
              style="letter-spacing: 5px; font-weight: bold; text-align: center; padding-left: 20px;" maxlength="6" />
            <i class="fas fa-shield-alt"></i>
          </div>

          <div v-if="forgotStep === 3" class="input-box">
            <input class="input-login" :type="showNewPassword ? 'text' : 'password'" v-model="forgotForm.newPassword"
              :placeholder="t('forgot_ph_new_pass', 'New Password')" required />
            <i class="fas fa-lock"></i>
            <i :class="['eye-icon fas', showNewPassword ? 'fa-eye-slash' : 'fa-eye']"
              @click="showNewPassword = !showNewPassword"></i>
          </div>

          <button type="submit" class="login-btn" :disabled="isLoading">
            {{ isLoading ? t('login_loading', 'Progressing...') : (forgotStep === 1 ? t('forgot_btn_1', 'Send Code') :
              forgotStep === 2 ? t('forgot_btn_2', 'Verify') :
                t('forgot_btn_3', 'Change Password')) }}
          </button>
        </form>

        <div class="switch-text" style="margin-top: 20px;">
          <span @click="backToLogin" style="cursor: pointer;"><i class="fas fa-arrow-left"></i> {{ t('forgot_back',
            'Back to Login') }}</span>
        </div>
      </div>

      <div v-else class="fade-in">
        <form @submit.prevent="handleAuth">
          <div v-if="!isLogin" class="input-box fade-in">
            <input class="input-login" type="text" v-model="form.name" :placeholder="t('login_ph_name', 'Your Name')" />
            <i class="far fa-user"></i>
          </div>
          <div class="input-box">
            <input class="input-login" type="email" v-model="form.email" :placeholder="t('login_ph_email', 'Email Address')" required />
            <i class="far fa-envelope"></i>
          </div>
          <div class="input-box">
            <input class="input-login" :type="showPassword ? 'text' : 'password'" v-model="form.password"
              :placeholder="t('login_ph_pass', 'Password')" required />
            <i class="fas fa-key"></i>
            <i :class="['eye-icon fas', showPassword ? 'fa-eye-slash' : 'fa-eye']"
              @click="showPassword = !showPassword"></i>
          </div>

          <div v-if="isLogin" style="text-align: right; margin-bottom: 20px;">
            <span @click="toggleForgotPassword"
              style="color: #D4AF37; font-size: 13px; cursor: pointer; text-decoration: underline;">{{
                t('login_forgot_link', 'Forgot Password?') }}</span>
          </div>

          <button type="submit" class="login-btn" :disabled="isLoading">
            {{ isLoading ? t('login_loading', 'Progressing...') : (isLogin ? t('login_btn_in', 'Log In') :
              t('login_btn_up', 'Register')) }}
          </button>
        </form>

        <div class="switch-text">
          <span>{{ isLogin ? t('login_switch_new', 'New here?') : t('login_switch_already', 'Already a member?')
            }}</span>
          <span class="link-register-form" @click="toggleMode">{{ isLogin ? t('login_switch_create', 'Create an account') : t('login_switch_login', 'Log In') }}</span>
        </div>

        <div class="divider"><span>{{ t('login_or', 'Or With') }}</span></div>
        <div class="google-btn-wrapper">
          <div id="google-button"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { authApi } from '../composables/useApi.js'
// ១. ទាញយកមុខងារបកប្រែ
import { useTranslation } from '../composables/useTranslation.js'

const router = useRouter()
// ២. ប្រើប្រាស់មុខងារបកប្រែ (វានឹងទាញយកភាសាពី localStorage ដោយស្វ័យប្រវត្តិ)
const { t, loadTranslations, currentLang } = useTranslation()

// ===== STATE =====
const isLogin = ref(true)
const isLoading = ref(false)
const toasts = ref([])
const showPassword = ref(false)

const form = ref({ name: '', email: '', password: '' })

// ===== សម្រាប់ Forgot Password =====
const isForgotPassword = ref(false)
const forgotStep = ref(1) // 1: Email, 2: OTP, 3: New Pass
const forgotForm = ref({ email: '', otp: '', newPassword: '' })
const showNewPassword = ref(false)

// ===== COMPUTED =====
// បន្ថែម currentLang.value ដើម្បីឲ្យវា Refresh ពេលទាញទិន្នន័យបាន
const pageTitle = computed(() => {
  currentLang.value
  return t('login_title', 'DUC Library')
})

const pageDesc = computed(() => {
  currentLang.value
  return isLogin.value
    ? t('login_desc_in', 'Sign in to access digital library.')
    : t('login_desc_up', 'Join the community of readers.')
})

// មុខងារបំប្លែងទិន្នន័យ (Decode) ពី Google
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (e) { return null }
}

async function handleGoogleCallback(response) {
  const payload = parseJwt(response.credential)
  if (!payload) {
    showToast('Fail to Catching Data from Google', 'error')
    return
  }

  isLoading.value = true
  try {
    const data = await authApi.googleLogin(payload.name, payload.email, payload.picture)

    if (data.success) {
      sessionStorage.setItem('currentUser', JSON.stringify(data.user))
      if (data.session_id) sessionStorage.setItem('session_id', data.session_id)

      sessionStorage.setItem('flashMessage', 'Login Success!')
      router.push(data.user.role === 'admin' ? '/admin' : '/dashboard')
    } else {
      showToast(data.message, 'error')
    }
  } catch (e) {
    showToast('Fail connecting to Server', 'error')
  } finally {
    isLoading.value = false
  }
}

function renderGoogleButton() {
  const checkGoogle = setInterval(() => {
    if (window.google) {
      clearInterval(checkGoogle)
      const googleBtnDiv = document.getElementById('google-button')
      if (googleBtnDiv) {
        window.google.accounts.id.initialize({
          client_id: '824715499710-po98qc793p53qckdnp3l9d0cl5mtmk4e.apps.googleusercontent.com',
          callback: handleGoogleCallback
        })
        window.google.accounts.id.renderButton(
          googleBtnDiv,
          { theme: 'outline', size: 'large', shape: 'pill', width: '100%', text: 'continue_with' }
        )
      }
    }
  }, 100)
}

async function backToLogin() {
  isForgotPassword.value = false
  form.value.password = ''
  await nextTick()
  renderGoogleButton()
}

onMounted(async () => {
  // ៣. អានឯកសារ translations.json និងកំណត់ភាសាពី localStorage
  await loadTranslations()

  const flashMsg = sessionStorage.getItem('flashMessage')
  if (flashMsg) {
    showToast(flashMsg, 'success')
    sessionStorage.removeItem('flashMessage')
  }

  renderGoogleButton()
})

// ===== METHODS =====
function toggleMode() {
  isLogin.value = !isLogin.value
  isForgotPassword.value = false
  form.value = { name: '', email: '', password: '' }
  showPassword.value = false
}

function toggleForgotPassword() {
  isForgotPassword.value = true
  forgotStep.value = 1
  forgotForm.value = { email: form.value.email, otp: '', newPassword: '' }
}

async function handleForgotSubmit() {
  isLoading.value = true
  try {
    if (forgotStep.value === 1) {
      if (!forgotForm.value.email) return showToast('Please Enter your email', 'error')
      const data = await authApi.forgotPassword(forgotForm.value.email)
      if (data.success) {
        showToast(data.message, 'success')
        forgotStep.value = 2
      } else showToast(data.message, 'error')
    }
    else if (forgotStep.value === 2) {
      if (!forgotForm.value.otp) return showToast('Please enter OTP', 'error')
      const data = await authApi.verifyOTP(forgotForm.value.email, forgotForm.value.otp)
      if (data.success) {
        showToast(data.message, 'success')
        forgotStep.value = 3
      } else showToast(data.message, 'error')
    }
    else if (forgotStep.value === 3) {
      if (forgotForm.value.newPassword.length < 6) return showToast('Password must be at least 6 digits', 'error')
      const data = await authApi.resetPassword(forgotForm.value.email, forgotForm.value.newPassword)
      if (data.success) {
        showToast(data.message, 'success')
        isForgotPassword.value = false
        form.value.password = ''
      } else showToast(data.message, 'error')
    }
  } catch (e) {
    showToast('Fail connecting to Server', 'error')
  } finally {
    isLoading.value = false
  }
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
    showToast('Please enter your email and password', 'error')
    return
  }
  if (!isLogin.value && !name) {
    showToast('Please enter your username', 'error')
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

        sessionStorage.setItem('flashMessage', 'Login success!')
        router.push(data.user.role === 'admin' ? '/admin' : '/dashboard')
      } else {
        showToast('Register success! Please login', 'success')
        toggleMode()
      }
    } else {
      showToast(data.message || 'Fail to connecting data', 'error')
    }
  } catch (e) {
    showToast('Unable to connect to server.', 'error')
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

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 25px 0 15px;
  color: #94A3B8;
  font-size: 13px;
}

.input-login::placeholder,
.login-btn {
  font-family: 'Kantumruy Pro', 'Inter', sans-serif;
}

.logo-login {
  width: 120px;
  height: auto;
  text-align: center;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.divider span {
  padding: 0 10px;
}

.google-btn-wrapper {
  display: flex;
  justify-content: center;
  width: 100%;
}

.nsm7Bb-HzV7m-LgbsSe {
  background-color: red !important;
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
  margin-top: 5rem;
}

.header {
  margin-bottom: 40px;
  text-align: center;
}

.header h1 {
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
  padding: 15px 15px 15px 45px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: #F8FAFC;
  font-size: 12px;
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
  font-size: 14px;
}

/* បន្ថែមកូដថ្មីនេះពីក្រោម */
.input-box .eye-icon {
  left: auto;
  right: 20px;
  /* រុញមកខាងស្តាំវិញ */
  cursor: pointer;
  /* លោតរូបដៃពេលដាក់ Mouse លើ */
  transition: color 0.3s ease;
}

.input-box .eye-icon:hover {
  color: #D4AF37;
  /* ដូរទៅពណ៌មាសពេលយក Mouse ដាក់ពីលើ */
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
  padding: 16px;
  background: #D4AF37;
  color: #0F172A;
  border: none;
  border-radius: 9999px;
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

.switch-text .link-register-form {
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
  font-family: 'Kantumruy Pro', 'Inter', sans-serif;
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
