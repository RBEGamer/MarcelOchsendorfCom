<script setup>
const props = defineProps({
  commands: {
    type: Array,
    default: () => []
  },
  selectedIndex: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['select']);

const handleSelect = (index) => {
  emit('select', index);
};
</script>

<template>
  <div class="palette">
    <p class="palette-label">command deck</p>
    <div class="palette-grid">
      <button
        type="button"
        v-for="(item, index) in props.commands"
        :key="item.command"
        class="chip"
        :class="{ active: index === props.selectedIndex }"
        @click="handleSelect(index)"
      >
        {{ item.command }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.palette {
  margin-top: 1rem;
  border: 1px solid rgba(72, 255, 203, 0.25);
  border-radius: 0.8rem;
  padding: 0.8rem 1rem;
  background: rgba(0, 0, 0, 0.3);
}

.palette-label {
  margin: 0 0 0.6rem;
  font-size: 1.1rem;
  letter-spacing: 0.3rem;
  text-transform: uppercase;
  color: var(--crt-dim);
}

.palette-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.chip {
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.2rem;
  font-size: 1.1rem;
  color: var(--crt-dim);
  background: transparent;
  font-family: inherit;
}

.chip.active {
  border-color: var(--crt-accent);
  color: var(--crt-accent);
  box-shadow: 0 0 12px rgba(72, 255, 203, 0.5);
}

.chip:focus-visible {
  outline: 2px solid var(--crt-accent);
  outline-offset: 2px;
}
</style>
