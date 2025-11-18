<script setup>
import { computed } from 'vue';
import { resolveAssetUrl } from '../utils/assetPaths';

const props = defineProps({
  config: {
    type: Object,
    required: false,
    default: null
  }
});

const defaultAvatar = resolveAssetUrl('img/avatar.png').toString();

const avatarUrl = computed(() => {
  const configured = props.config?.avatar_url;
  if (!configured) {
    return defaultAvatar;
  }
  return resolveAssetUrl(configured).toString();
});
const authorName = computed(() => props.config?.author_name ?? 'Marcel Ochsendorf');
const appName = computed(() => props.config?.app_name ?? 'Terminal Node');
const version = computed(() => props.config?.version ?? '0.0');
const hostname = computed(() => props.config?.hostname ?? 'local');
const about = computed(() => props.config?.about_text ?? '');
const skills = computed(() => props.config?.main_skills ?? []);
const eventsCount = computed(() => props.config?.events?.length ?? 0);
const documentsCount = computed(() => props.config?.documents?.length ?? 0);
const links = computed(() => props.config?.redirect_urls ?? {});
</script>

<template>
  <aside class="hud">
    <div class="hud-card identity">
      <img :src="avatarUrl" :alt="authorName" width="92" height="92" />
      <div>
        <p class="hud-name">{{ authorName }}</p>
        <p class="hud-role">{{ appName }}</p>
        <p class="hud-meta">node: {{ hostname }}</p>
      </div>
    </div>
    <div class="hud-card stats">
      <div>
        <span class="label">events</span>
        <span class="value">{{ eventsCount }}</span>
      </div>
      <div>
        <span class="label">documents</span>
        <span class="value">{{ documentsCount }}</span>
      </div>
      <div>
        <span class="label">version</span>
        <span class="value">v{{ version }}</span>
      </div>
    </div>
    <div class="hud-card">
      <p class="hud-label">transmission</p>
      <p class="hud-about">{{ about }}</p>
    </div>
    <div class="hud-card">
      <p class="hud-label">core skills</p>
      <div class="badges">
        <span v-for="skill in skills" :key="skill" class="badge">{{ skill }}</span>
        <span v-if="!skills.length" class="badge ghost">updating...</span>
      </div>
    </div>
    <div class="hud-card">
      <p class="hud-label">launch codes</p>
      <ul class="link-list">
        <li v-for="(url, alias) in links" :key="alias">
          <a :href="url" target="_blank" rel="noopener">{{ alias }}</a>
        </li>
        <li v-if="!Object.keys(links).length" class="ghost">links pending</li>
      </ul>
    </div>
  </aside>
</template>

<style scoped>
.hud {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.hud-card {
  background: rgba(1, 8, 15, 0.7);
  border: 1px solid rgba(72, 255, 203, 0.3);
  border-radius: 1.2rem;
  padding: 1.2rem 1.4rem;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.45);
}

.identity {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.identity img {
  border-radius: 0.8rem;
  border: 2px solid rgba(72, 255, 203, 0.7);
  box-shadow: 0 0 18px rgba(72, 255, 203, 0.35);
  object-fit: cover;
}

.hud-name {
  margin: 0;
  font-size: 2rem;
}

.hud-role {
  margin: 0.2rem 0 0;
  text-transform: uppercase;
  font-size: 1.2rem;
  letter-spacing: 0.2rem;
  color: var(--crt-yellow);
}

.hud-meta {
  margin: 0.2rem 0 0;
  color: var(--crt-dim);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.2rem;
}

.label {
  font-size: 1.1rem;
  color: var(--crt-dim);
}

.value {
  font-size: 2rem;
  color: var(--crt-accent);
}

.hud-label {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.3rem;
  font-size: 1.2rem;
  color: var(--crt-accent);
}

.hud-about {
  margin: 0.6rem 0 0;
  color: var(--crt-text);
  opacity: 0.85;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.badge {
  border: 1px solid rgba(247, 243, 166, 0.6);
  border-radius: 99rem;
  padding: 0.2rem 0.9rem;
  font-size: 1.3rem;
  letter-spacing: 0.1rem;
  color: var(--crt-yellow);
}

.badge.ghost {
  opacity: 0.4;
}

.link-list {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.link-list a {
  color: var(--crt-text);
  text-decoration: none;
}

.link-list a::after {
  content: ' ↗';
  font-size: 1.1rem;
  color: var(--crt-accent);
}

.ghost {
  opacity: 0.5;
}
</style>
