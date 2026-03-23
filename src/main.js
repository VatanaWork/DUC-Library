import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'

import LoginView from './views/LoginView.vue'
import DashboardView from './views/DashboardView.vue'
import AdminView from './views/AdminView.vue'

// ==============================
// Vue Router - ការដឹកនាំ Pages
// ==============================
const router = createRouter({
  history: createWebHistory(), 
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView,
      beforeEnter: (to, from, next) => {
        const user = JSON.parse(sessionStorage.getItem('currentUser'))
        if (user) {
          next(user.role === 'admin' ? '/admin' : '/dashboard')
        } else {
          next()
        }
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      beforeEnter: (to, from, next) => {
        const user = JSON.parse(sessionStorage.getItem('currentUser'))
        if (!user) next('/')
        else next()
      }
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      beforeEnter: (to, from, next) => {
        const user = JSON.parse(sessionStorage.getItem('currentUser'))
        if (!user || user.role !== 'admin') next('/dashboard')
        else next()
      }
    }
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
