<template>
  <footer class="page-footer">
    <p class="footer-brand">© {{ year }} {{ author }}</p>
    <nav class="footer-links">
      <a :href="imprintUrl" target="_blank" rel="noopener">Imprint</a>
      <a :href="privacyUrl" target="_blank" rel="noopener">Privacy</a>
    </nav>
  </footer>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  config: {
    type: Object,
    default: null
  }
});

const year = new Date().getFullYear();
const author = computed(() => props.config?.author_name ?? 'Marcel Ochsendorf');
const redirects = computed(() => props.config?.redirect_urls ?? {});
const imprintUrl = computed(() => redirects.value.impressum ?? '/impressum');
const privacyUrl = computed(() => redirects.value.datenschutz ?? '/datenschutz');
</script>

<style scoped>
.page-footer {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(72, 255, 203, 0.25);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  color: var(--crt-dim);
}

.footer-brand {
  margin: 0;
  font-size: 1.3rem;
}

.footer-links {
  display: flex;
  gap: 1rem;
  font-size: 1.2rem;
}

.footer-links a {
  color: var(--crt-accent);
  text-decoration: none;
}

.footer-links a:hover,
.footer-links a:focus-visible {
  text-decoration: underline;
}
</style>
