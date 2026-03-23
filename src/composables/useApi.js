// ==============================
// useApi.js - API Composable
// ការភ្ជាប់ Google Apps Script
// ==============================

export const API_URL = "https://script.google.com/macros/s/AKfycbyZgSOujgXRI7JbF5pMHta2XfFmiEo40fY5MyNvK40qUOGYla--Gb0HcNYtQ2DB09i2YQ/exec"

/**
 * Helper: POST data to Google Apps Script
 * @param {object} payload
 * @returns {Promise<object>}
 */
export async function apiPost(payload) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  return response.json()
}

// ==============================
// Auth API
// ==============================
export const authApi = {
  login: (email, password) => apiPost({ action: 'login', email, password }),
  register: (name, email, password) => apiPost({ action: 'register', name, email, password }),
  logout: (email, session_id) => apiPost({ action: 'logout', email, session_id }),
  heartbeat: (email, session_id, role) => apiPost({ action: 'heartbeat', email, session_id: parseInt(session_id), role }),
  getUserDetails: (email) => apiPost({ action: 'getUserDetails', email }),
}

// ==============================
// Books API
// ==============================
export const booksApi = {
  getBooks: () => apiPost({ action: 'getBooks' }),
  saveBook: (book) => apiPost({ action: 'saveBook', book }),
  deleteBook: (id) => apiPost({ action: 'deleteBook', id }),
}

// ==============================
// Requests API
// ==============================
export const requestsApi = {
  borrowBook: (payload) => apiPost({ ...payload, action: 'borrowBook' }),
  returnBook: (payload) => apiPost({ ...payload, action: 'returnBook' }),
  myRequests: (email) => apiPost({ action: 'myRequests', email }),
  myNotifications: (email) => apiPost({ action: 'myNotifications', email }),
  updateRequest: (payload) => apiPost({ ...payload, action: 'updateRequest' }),
  deleteRequest: (id) => apiPost({ action: 'deleteRequest', id }),
}

// ==============================
// Users API
// ==============================
export const usersApi = {
  saveUser: (user) => apiPost({ action: 'saveUser', user }),
  deleteUser: (email) => apiPost({ action: 'deleteUser', email }),
  updateProfile: (payload) => apiPost({ ...payload, action: 'updateProfile' }),
  changePassword: (payload) => apiPost({ ...payload, action: 'changePassword' }),
  toggleFavorite: (email, book_id) => apiPost({ action: 'toggleFavorite', email, book_id }),
}

// ==============================
// Admin API
// ==============================
export const adminApi = {
  getAdminData: () => apiPost({ action: 'getAdminData' }),
  getAdminNotifications: () => apiPost({ action: 'getAdminNotifications' }),
  forceLogout: (id) => apiPost({ action: 'forceLogout', id }),
  unkickUser: (id) => apiPost({ action: 'unkickUser', id }),
  deleteActivity: (id) => apiPost({ action: 'deleteActivity', id }),
}
