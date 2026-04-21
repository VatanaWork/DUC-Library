<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // កូដចាស់: const theme = localStorage.getItem('theme') || 'dark'
  // ប្តូរទៅជា 'light' វិញ៖
  const theme = localStorage.getItem('theme') || 'light'
  
  if (theme === 'light') {
    document.body.classList.add('light-mode')
  } else {
    document.body.classList.remove('light-mode')
  }
})
</script>