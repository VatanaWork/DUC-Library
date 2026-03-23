<template>
  <div class="notif-header">
    <div class="notif-top-row">
      <button class="back-circle-btn" @click="$emit('back')">
        <i class="fas fa-arrow-left"></i>
      </button>
      <h2>{{ title }}</h2>
      <div style="width:40px;"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({ title: String })
defineEmits(['back'])
</script>

<style setup>
/* ==========================================================
   CLEAN & PROFESSIONAL SUB-PAGE HEADER
   ========================================================== */

.notif-header {
  position: sticky;
  width: 100%;
  top: 0;
  z-index: 50;
  background: var(--bg-glass);
  /* Uses your translucent glass variable */
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  padding: clamp(12px, 1.5vw, 16px) clamp(20px, 3vw, 24px);
  transition: background 0.3s ease;
}

/* Using CSS Grid to guarantee the Title is exactly in the center */
.notif-top-row {
  display: grid;
  grid-template-columns: clamp(36px, 5vw, 40px) 1fr clamp(36px, 5vw, 40px);
  align-items: center;
  width: 100%;
}

.notif-top-row h2 {
  font-family: 'Kantumruy Pro', 'Inter', sans-serif;
  font-size: clamp(16px, 2vw, 18px);
  font-weight: 600;
  color: var(--text-white);
  text-align: center;
  /* Perfectly centered between the two side columns */
  margin: 0;
  letter-spacing: 0.3px;
}

/* Minimalist "Ghost" Back Button */
.back-circle-btn {
  width: clamp(36px, 5vw, 40px);
  height: clamp(36px, 5vw, 40px);
  border-radius: 50%;
  background: transparent;
  /* Removes heavy background */
  border: none;
  /* Removes harsh borders */
  color: var(--text-gray);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: clamp(16px, 2.2vw, 18px);
  padding: 0;
}

/* Soft, elegant hover effect */
.back-circle-btn:hover {
  background: rgba(128, 128, 128, 0.1);
  color: var(--text-white);
}

.back-circle-btn:active {
  transform: scale(0.92);
}
</style>