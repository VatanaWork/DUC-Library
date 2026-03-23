// ==============================
// useTranslation.js - Composable ការបកប្រែភាសា
// ==============================
import { ref, computed } from 'vue'

const translations = ref({})
const currentLang = ref(localStorage.getItem('appLang') || 'en')

export function useTranslation() {

  async function loadTranslations() {
    try {
      const res = await fetch('/translations.json')
      translations.value = await res.json()
      applyBodyFont(currentLang.value)
    } catch (e) {
      console.error('Cannot load translations:', e)
    }
  }

  function applyBodyFont(lang) {
    document.body.style.fontFamily = lang === 'kh'
      ? "'Kantumruy Pro', sans-serif"
      : "'Inter', sans-serif"
  }

  function setLanguage(lang) {
    currentLang.value = lang
    localStorage.setItem('appLang', lang)
    applyBodyFont(lang)
  }

  function t(key, fallback = '') {
    const langData = translations.value[currentLang.value] || translations.value['en'] || {}
    return langData[key] || fallback || key
  }

  return { translations, currentLang, loadTranslations, setLanguage, t }
}
