<script setup>
import { onMounted, ref, watch } from 'vue';

const props = defineProps({
  lines: {
    type: Array,
    default: () => []
  },
  prompt: {
    type: String,
    default: 'guest@node:~$'
  },
  inputValue: {
    type: String,
    default: ''
  },
  selectedCommand: {
    type: String,
    default: ''
  },
  busy: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  'update:inputValue',
  'execute',
  'execute-selected',
  'history',
  'move-selection'
]);

const outputRef = ref(null);
const inputRef = ref(null);

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus();
  }
});

watch(
  () => props.lines.length,
  () => {
    requestAnimationFrame(() => {
      const node = outputRef.value;
      if (node) {
        node.scrollTop = node.scrollHeight;
      }
    });
  }
);

const handleInput = (event) => {
  emit('update:inputValue', event.target.value);
};

const handleSubmit = (event) => {
  event.preventDefault();
  if (props.inputValue.trim()) {
    emit('execute', props.inputValue.trim());
  } else {
    emit('execute-selected');
  }
  emit('update:inputValue', '');
};

const handleKeyDown = (event) => {
  if (event.key === 'ArrowUp') {
    event.preventDefault();
    emit('history', -1);
    return;
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    emit('history', 1);
    return;
  }
  if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && !props.inputValue) {
    event.preventDefault();
    emit('move-selection', event.key === 'ArrowLeft' ? -1 : 1);
  }
};

const urlPattern = /https?:\/\/[^\s)]+/g;

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatLine = (text = '') => {
  const escaped = escapeHtml(text);
  return escaped.replace(urlPattern, (match) => {
    const url = match.endsWith('.') ? match.slice(0, -1) : match;
    const suffix = match.endsWith('.') ? '.' : '';
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>${suffix}`;
  });
};
</script>

<template>
  <section class="terminal">
    <div class="terminal-output" ref="outputRef" role="log" aria-live="polite">
      <p
        v-for="line in lines"
        :key="line.id"
        class="terminal-line"
        :class="line.type"
      >
        <span v-if="line.html" v-html="line.text"></span>
        <span v-else v-html="formatLine(line.text)"></span>
      </p>
      <p v-if="busy" class="terminal-line hint">running diagnostics...</p>
    </div>
    <form class="terminal-input" @submit="handleSubmit" autocomplete="off" spellcheck="false">
      <span class="prompt">{{ prompt }}</span>
      <input
        ref="inputRef"
        type="text"
        name="command"
        :value="inputValue"
        @input="handleInput"
        @keydown="handleKeyDown"
        :placeholder="selectedCommand ? `enter | ${selectedCommand}` : 'enter command'"
        autocomplete="off"
      />
    </form>
    <p class="terminal-hint">Use arrow keys to cycle commands, Enter to execute selected, type for manual input.</p>
  </section>
</template>

<style scoped>
.terminal {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.terminal-output {
  flex: 1;
  overflow-y: auto;
  padding: 1.2rem;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(72, 255, 203, 0.2);
  border-radius: 1rem;
  box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.5);
}

.terminal-line {
  margin: 0.2rem 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.terminal-line.system {
  color: var(--crt-accent);
}

.terminal-line.error {
  color: var(--crt-warning);
}

.terminal-line.command {
  color: var(--crt-yellow);
}

.terminal-line.banner {
  color: var(--crt-accent);
  text-shadow: 0 0 12px rgba(72, 255, 203, 0.6);
}

.terminal-line.hint {
  color: var(--crt-dim);
}

.terminal-input {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(72, 255, 203, 0.3);
  background: rgba(1, 6, 13, 0.7);
}

.prompt {
  color: var(--crt-yellow);
}

input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--crt-text);
  font: inherit;
  outline: none;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.terminal-hint {
  margin: 0.8rem 0 0;
  font-size: 1.2rem;
  text-transform: uppercase;
  letter-spacing: 0.2rem;
  color: var(--crt-dim);
}
</style>
