<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const theme = localStorage.getItem('theme') || 'dark'
  if (theme === 'light') {
    document.body.classList.add('light-mode')
  } else {
    document.body.classList.remove('light-mode')
  }
})
</script>