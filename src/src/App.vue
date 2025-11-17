<script setup>
import { computed, onMounted, ref } from 'vue';
import CommandPalette from './components/CommandPalette.vue';
import HudPanel from './components/HudPanel.vue';
import PageFooter from './components/PageFooter.vue';
import TerminalScreen from './components/TerminalScreen.vue';
import { resolveAssetUrl } from './utils/assetPaths';

const config = ref(null);
const loading = ref(true);
const errorMessage = ref('');
const terminalLines = ref([]);
const inputValue = ref('');
const history = ref([]);
const historyIndex = ref(-1);
const selectedIndex = ref(0);
const showIntroModal = ref(false);
const gameState = ref({
  active: false,
  code: '',
  attempts: 0,
  maxAttempts: 7
});

const commandDeck = [
  { command: 'help', description: 'List all commands' },
  { command: 'about', description: 'Mission statement' },
  { command: 'skills', description: 'Core and programming skills' },
  { command: 'education', description: 'Academic log' },
  { command: 'events', description: 'Awards & achievements' },
  { command: 'projects', description: 'Highlighted builds' },
  { command: 'documents', description: 'Research and theses' },
  { command: 'contact', description: 'Reach out to Marcel' },
  { command: 'links', description: 'Shortcut aliases' },
  { command: 'open <alias>', description: 'Open alias (use links)' },
  { command: 'ls [path]', description: 'List virtual filesystem entries' },
  { command: 'cat <path>', description: 'Read a file from the virtual FS' },
  { command: 'tree [path]', description: 'Visualize the FS structure' },
  { command: 'game', description: 'Launch the cipher mini-game' },
  { command: 'hack <code>', description: 'Submit guesses during the game' },
  { command: 'fortune', description: 'Receive an R&D fortune' },
  { command: 'coffee', description: 'Check the coffee telemetry' },
  { command: 'matrix', description: 'Render a brief data rain' },
  { command: 'version', description: 'Display deployment info' },
  { command: 'clear', description: 'Reset the console' }
];

const prompt = computed(() => {
  const host = config.value?.hostname ?? 'crt-node';
  return `guest@${host}:~$`;
});

const selectedCommand = computed(() => commandDeck[selectedIndex.value]?.command ?? 'help');
const isBooting = computed(() => loading.value && !errorMessage.value);
const appTitle = computed(() => config.value?.app_name ?? 'CRT Terminal');
const hostLabel = computed(() => config.value?.hostname ?? 'offline');
const versionLabel = computed(() => config.value?.version ?? '0.0');

const INTRO_SEEN_KEY = 'crtTerminalIntroSeen';
const fortunes = [
  'Firmware upgrade scheduled: expect unexpected miracles.',
  'The next prototype you build will work on the first try (probably).',
  'Beware of stakeholders bearing feature requests.',
  'A bold idea from 2016 will resurface and finally shine.',
  'Your solder joints are stronger than imposter syndrome.'
];
const coffeeStates = [
  'Coffee level critical. Recommend immediate refill.',
  'Espresso shot pulled and ready for deployment.',
  'All mugs currently in use. Deploy reusable beaker?',
  'Latte art resembles a Gantt chart—eerily accurate.',
  'Beans calibrated. Proceed with secret projects.'
];
const matrixGlyphs = '01░▒▓█0123456789ABCDEF';
const matrixChars = matrixGlyphs.split('');
const DEFAULT_FS_PATH = '/home/marcel';
const virtualFs = {
  type: 'dir',
  entries: {
    home: {
      type: 'dir',
      entries: {
        marcel: {
          type: 'dir',
          entries: {
            'readme.txt': {
              type: 'file',
              content:
                'Welcome to the hidden home directory. Type "cat blueprint.nfo" or explore the files for extra lore.'
            },
            'blueprint.nfo': {
              type: 'file',
              content:
                'Project ENIGMA: blend of robotics, rail innovation, and low-field MRI wizardry.\nStatus: perpetually iterating.'
            },
            'todo.md': {
              type: 'file',
              content:
                '- [ ] Finish magnet shim controller\n- [ ] Refactor makerspace booking bot\n- [x] Build retro CV terminal'
            },
            secrets: {
              type: 'dir',
              entries: {
                'vault.log': {
                  type: 'file',
                  content:
                    'Log entry 042:\n"Remember: best ideas are born between midnight commits and espresso refills."'
                },
                'arcade.rom': {
                  type: 'file',
                  content:
                    'Binary blob? Maybe. Or maybe just a reminder that nostalgia fuels creativity. (Try the matrix command!)'
                }
              }
            },
            experiments: {
              type: 'dir',
              entries: {
                'ai_lab.log': {
                  type: 'file',
                  content:
                    'Model accuracy improved after embedding coffee temperature sensor data. Correlation? Possibly.'
                }
              }
            },
            devices: {
              type: 'dir',
              entries: {
                'uart_config.ini': {
                  type: 'file',
                  content: 'baud=115200\nparity=none\nnotes=Connect to prototype train controller for diagnostics.'
                }
              }
            }
          }
        }
      }
    },
    etc: {
      type: 'dir',
      entries: {
        'motd': {
          type: 'file',
          content: 'System MOTD: "Build boldly. Iterate relentlessly."'
        }
      }
    },
    usr: {
      type: 'dir',
      entries: {
        bin: {
          type: 'dir',
          entries: {
            'deploy.sh': {
              type: 'file',
              content: '#!/bin/bash\nvite build && echo "Deployment uplink complete."'
            }
          }
        }
      }
    }
  }
};

let lineCounter = 0;
const newLineId = () => `${Date.now()}-${lineCounter++}`;

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generateSecretCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function startCipherGame() {
  gameState.value = {
    active: true,
    code: generateSecretCode(),
    attempts: 0,
    maxAttempts: 7
  };
  pushMessage([
    'Cipher mini-game initiated!',
    'Goal: crack the 4-digit code.',
    `You have ${gameState.value.maxAttempts} attempts.`,
    'Submit guesses using: hack 1234',
    'Type "game stop" to abort.'
  ], 'system');
}

function endCipherGame(message) {
  if (message) {
    pushMessage(message);
  }
  gameState.value.active = false;
}

function evaluateGuess(secret, guess) {
  let bulls = 0;
  let cows = 0;
  const secretCounts = {};
  const guessCounts = {};
  for (let i = 0; i < secret.length; i += 1) {
    if (secret[i] === guess[i]) {
      bulls += 1;
    } else {
      secretCounts[secret[i]] = (secretCounts[secret[i]] || 0) + 1;
      guessCounts[guess[i]] = (guessCounts[guess[i]] || 0) + 1;
    }
  }
  Object.keys(guessCounts).forEach((digit) => {
    if (secretCounts[digit]) {
      cows += Math.min(secretCounts[digit], guessCounts[digit]);
    }
  });
  return { bulls, cows };
}

function normalizeFsPath(targetPath) {
  if (!targetPath) return DEFAULT_FS_PATH;
  return targetPath.startsWith('/') ? targetPath : `${DEFAULT_FS_PATH}/${targetPath}`;
}

function resolveFsNode(path) {
  const segments = path.split('/').filter(Boolean);
  let node = virtualFs;
  for (const segment of segments) {
    if (!node.entries || !node.entries[segment]) {
      return null;
    }
    node = node.entries[segment];
  }
  return node;
}

function isDirectory(node) {
  return Boolean(node) && node.type === 'dir';
}

function listDirectoryEntries(node) {
  if (!isDirectory(node)) return [];
  return Object.entries(node.entries ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, child]) => (child.type === 'dir' ? `${name}/` : name));
}

function buildTreeLines(node, prefix = '') {
  if (!isDirectory(node)) return [];
  const entries = Object.entries(node.entries ?? {}).sort(([a], [b]) => a.localeCompare(b));
  const lines = [];
  entries.forEach(([name, child], index) => {
    const isLast = index === entries.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childName = child.type === 'dir' ? `${name}/` : name;
    lines.push(`${prefix}${connector}${childName}`);
    if (child.type === 'dir') {
      lines.push(...buildTreeLines(child, `${prefix}${isLast ? '    ' : '│   '}`));
    }
  });
  return lines;
}

function pushMessage(content, type = 'default', html = false) {
  const payload = Array.isArray(content) ? content : [content];
  payload.forEach((text) => {
    terminalLines.value.push({
      id: newLineId(),
      text,
      type,
      html
    });
  });
}

function clearTerminal() {
  terminalLines.value = [];
}

function bootSequence() {
  clearTerminal();
  pushMessage([
    `Access granted :: ${new Date().toLocaleString()}`,
    `${config.value?.app_name ?? 'Marcel Ochsendorf'} v${config.value?.version ?? '1.0'}`,
    `Authenticated node: ${config.value?.hostname ?? 'offline'}`,
    "Use arrow keys to cycle command deck, press Enter to execute."
  ], 'system');
}

async function fetchConfig() {
  try {
    pushMessage('Establishing secure uplink...', 'hint');
    const configUrl = resolveAssetUrl('config/config.json');
    configUrl.searchParams.set('ts', Date.now().toString());
    const response = await fetch(configUrl.toString());
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    config.value = await response.json();
    bootSequence();
  } catch (error) {
    console.error(error);
    errorMessage.value = 'Unable to load config.json';
    pushMessage('Boot failure :: config file missing or corrupt.', 'error');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  try {
    showIntroModal.value =
      typeof window !== 'undefined'
        ? localStorage.getItem(INTRO_SEEN_KEY) !== 'true'
        : false;
  } catch {
    showIntroModal.value = true;
  }
  pushMessage('Booting CRT terminal...', 'hint');
  pushMessage('Awaiting data stream...', 'hint');
  fetchConfig();
});

function dismissIntroModal() {
  showIntroModal.value = false;
  try {
    localStorage.setItem(INTRO_SEEN_KEY, 'true');
  } catch {
    // ignore storage errors
  }
}

function handleHistory(direction) {
  if (!history.value.length) return;
  const nextIndex = Math.min(
    Math.max(historyIndex.value + direction, 0),
    history.value.length
  );
  historyIndex.value = nextIndex;
  if (nextIndex === history.value.length) {
    inputValue.value = '';
  } else {
    inputValue.value = history.value[nextIndex];
  }
}

function handleMoveSelection(delta) {
  const total = commandDeck.length;
  selectedIndex.value = (selectedIndex.value + delta + total) % total;
}

async function runCommand(raw, options = {}) {
  const { clearBefore = false } = options;
  if (!raw) return;
  const trimmed = raw.trim();
  if (!trimmed) return;

  history.value.push(trimmed);
  historyIndex.value = history.value.length;

  if (clearBefore) {
    clearTerminal();
  }
  pushMessage(`${prompt.value} ${trimmed}`, 'command');

  const [cmd, ...args] = trimmed.split(/\s+/);
  const handler = commandHandlers[cmd.toLowerCase()];
  if (!handler) {
    pushMessage(`Unknown command: ${cmd}. Type 'help' to list commands.`, 'error');
    return;
  }
  await handler(args);
}

const commandHandlers = {
  help() {
    const rows = ['Available commands:'];
    commandDeck.forEach((item) => {
      rows.push(`${item.command.padEnd(14, ' ')} ${item.description}`);
    });
    pushMessage(rows, 'system');
  },
  about() {
    pushMessage([
      config.value?.author_name ?? 'Marcel Ochsendorf',
      config.value?.about_text ?? 'No bio configured.'
    ]);
  },
  skills() {
    const main = config.value?.main_skills ?? [];
    const programming = config.value?.programming_skills ?? [];
    if (!main.length && !programming.length) {
      pushMessage('Skill data not configured.', 'hint');
      return;
    }
    if (main.length) {
      pushMessage('Core disciplines:', 'system');
      pushMessage(main.map((skill, index) => `${index + 1}. ${skill}`));
    }
    if (programming.length) {
      pushMessage('Programming stacks:', 'system');
      pushMessage(programming.map((skill) => `- ${skill}`));
    }
  },
  education() {
    const list = config.value?.education_list ?? [];
    if (!list.length) {
      pushMessage('Education log empty.', 'hint');
      return;
    }
    pushMessage('Education & research log:', 'system');
    const formatted = list.map((item) => {
      const range = item.data_string_simplified || `${item.date_start ?? ''} - ${item.date_end ?? ''}`;
      const rows = [
        `• [${range}] ${item.school_name} — ${item.degree_name}`
      ];
      if (item.subject) {
        rows.push(`    (${item.subject})`);
      }
      if (item.url) {
        rows.push(`    ↗ ${item.url}`);
      }
      return rows.join('\n');
    });
    pushMessage(formatted);
  },
  events() {
    const items = config.value?.events ?? [];
    if (!items.length) {
      pushMessage('No events recorded.', 'hint');
      return;
    }
    pushMessage('Awards & notable events:', 'system');
    items.forEach((event) => {
      pushMessage(`[${event.data_string_simplified}] ${event.what} — ${event.info}`);
    });
  },
  projects() {
    const list = config.value?.latest_projects ?? [];
    const limit = config.value?.latest_projects_visible_count ?? list.length;
    if (!list.length) {
      pushMessage('Projects are redacted for this build. Ask Marcel for demos.', 'hint');
      return;
    }
    pushMessage('Highlighted projects:', 'system');
    list.slice(0, limit).forEach((project) => {
      const stack = project.stack?.length ? ` [${project.stack.join(', ')}]` : '';
      pushMessage(`${project.title}${stack} — ${project.description} (${project.url})`);
    });
  },
  documents() {
    const items = config.value?.documents ?? [];
    if (!items.length) {
      pushMessage('No public documents linked.', 'hint');
      return;
    }
    pushMessage('Documents & publications:', 'system');
    items.forEach((doc) => {
      if (doc.url) {
        pushMessage(`<a href="${doc.url}" target="_blank" rel="noopener">${doc.title}</a> — ${doc.description}`, 'default', true);
      } else {
        pushMessage(`${doc.title} — ${doc.description}`);
      }
    });
  },
  contact() {
    const email = config.value?.email_url ?? 'info@marcelochsendorf.com';
    const phone = config.value?.impressum?.phone ?? 'On request';
    const address = config.value?.impressum?.address ?? 'Remote';
    const linkedin = config.value?.redirect_urls?.linkedin ?? 'https://www.linkedin.com';
    const github = config.value?.redirect_urls?.github ?? 'https://github.com';
    pushMessage([
      `Email   : <a href="mailto:${email}">${email}</a>`,
      `Phone   : ${phone}`,
      `Address : ${address}`,
      `LinkedIn: <a href="${linkedin}" target="_blank" rel="noopener">${linkedin}</a>`,
      `GitHub  : <a href="${github}" target="_blank" rel="noopener">${github}</a>`
    ], 'default', true);
  },
  links() {
    const redirect = config.value?.redirect_urls ?? {};
    const entries = Object.entries(redirect);
    if (!entries.length) {
      pushMessage('No aliases mapped.', 'hint');
      return;
    }
    pushMessage('Shortcut aliases:', 'system');
    entries.forEach(([alias, url]) => {
      pushMessage(`${alias.padEnd(12, ' ')} -> ${url}`);
    });
    pushMessage("Use 'open <alias>' to launch in a new tab.", 'hint');
  },
  open(args = []) {
    if (!args.length) {
      pushMessage("Usage: open <alias>. Run 'links' for list.", 'hint');
      return;
    }
    const alias = args[0].toLowerCase();
    const url = config.value?.redirect_urls?.[alias];
    if (!url) {
      pushMessage(`Alias '${alias}' not registered.`, 'error');
      return;
    }
    window.open(url, '_blank', 'noopener');
    pushMessage(`Opening ${alias} -> ${url}`, 'system');
  },
  ls(args = []) {
    const targetPath = normalizeFsPath(args[0]);
    const node = resolveFsNode(targetPath);
    if (!node) {
      pushMessage(`Path not found: ${targetPath}`, 'error');
      return;
    }
    if (!isDirectory(node)) {
      pushMessage(`File: ${targetPath}`, 'system');
      return;
    }
    const entries = listDirectoryEntries(node);
    pushMessage([`Directory listing for ${targetPath}`, ...entries]);
  },
  cat(args = []) {
    if (!args.length) {
      pushMessage('Usage: cat <path>. Example: cat readme.txt', 'hint');
      return;
    }
    const targetPath = normalizeFsPath(args[0]);
    const node = resolveFsNode(targetPath);
    if (!node) {
      pushMessage(`Path not found: ${targetPath}`, 'error');
      return;
    }
    if (isDirectory(node)) {
      pushMessage(`Cannot cat a directory: ${targetPath}`, 'error');
      return;
    }
    pushMessage(node.content ?? '(empty file)');
  },
  tree(args = []) {
    const targetPath = normalizeFsPath(args[0]);
    const node = resolveFsNode(targetPath);
    if (!node) {
      pushMessage(`Path not found: ${targetPath}`, 'error');
      return;
    }
    if (!isDirectory(node)) {
      pushMessage('Tree command expects a directory path.', 'error');
      return;
    }
    const lines = [`${targetPath}/`, ...buildTreeLines(node)];
    pushMessage(lines);
  },
  game(args = []) {
    const directive = args[0]?.toLowerCase();
    if (directive === 'stop') {
      if (!gameState.value.active) {
        pushMessage('No active game to stop.', 'hint');
        return;
      }
      endCipherGame(`Abort acknowledged. Secret code was ${gameState.value.code}.`);
      return;
    }
    startCipherGame();
  },
  hack(args = []) {
    if (!gameState.value.active) {
      pushMessage('Start the mini-game first with the "game" command.', 'hint');
      return;
    }
    if (!args.length || !/^[0-9]{4}$/.test(args[0])) {
      pushMessage('Provide a 4-digit code. Example: hack 5729', 'hint');
      return;
    }
    const guess = args[0];
    gameState.value.attempts += 1;
    if (guess === gameState.value.code) {
      endCipherGame('Access granted. You cracked the cipher!');
      return;
    }
    const { bulls, cows } = evaluateGuess(gameState.value.code, guess);
    const remaining = gameState.value.maxAttempts - gameState.value.attempts;
    pushMessage(
      `Match report :: exact ${bulls}, displaced ${cows}. Attempts left: ${remaining}`,
      'system'
    );
    if (gameState.value.attempts >= gameState.value.maxAttempts) {
      endCipherGame(`System locked. Correct code was ${gameState.value.code}.`);
    }
  },
  fortune() {
    pushMessage(randomItem(fortunes), 'system');
  },
  coffee() {
    pushMessage(randomItem(coffeeStates));
  },
  matrix() {
    const rows = Array.from({ length: 8 }, () =>
      Array.from({ length: 32 }, () => randomItem(matrixChars)).join('')
    );
    pushMessage(rows, 'system');
  },
  version() {
    pushMessage([
      `${config.value?.app_name ?? 'CRT Terminal'} v${config.value?.version ?? '1.0'}`,
      `Host: ${config.value?.hostname ?? 'offline'}`,
      `Author: ${config.value?.author_name ?? 'Marcel Ochsendorf'}`,
      `Config: /config/config.json`
    ]);
  },
  clear() {
    clearTerminal();
    pushMessage('Console flushed.', 'hint');
  },
  cls() {
    commandHandlers.clear();
  }
};

function handleExecute(command) {
  runCommand(command);
}

function handleExecuteSelected(clearBefore = true) {
  if (!selectedCommand.value) return;
  const parts = selectedCommand.value.split(' ');
  runCommand(parts[0], { clearBefore });
}

function handleSelectCommand(index) {
  selectedIndex.value = index;
  handleExecuteSelected(true);
}
</script>

<template>
  <div class="crt-shell">
    <div class="crt-overlay scanlines" aria-hidden="true"></div>
    <div class="crt-overlay noise" aria-hidden="true"></div>
    <div class="crt-frame">
      <div v-if="errorMessage" class="error-state">
        <p>{{ errorMessage }}</p>
        <p>Ensure config/config.json is reachable.</p>
      </div>
      <main v-else class="crt-grid">
        <section class="screen-panel">
          <header class="terminal-header">
            <div>
              <p class="terminal-title">{{ appTitle }}</p>
              <p class="terminal-host">node: {{ hostLabel }}</p>
            </div>
            <p class="terminal-version">v{{ versionLabel }}</p>
          </header>
          <TerminalScreen
            :lines="terminalLines"
            :prompt="prompt"
            :input-value="inputValue"
            @update:input-value="(val) => (inputValue = val)"
            :selected-command="selectedCommand"
            :busy="isBooting"
            @execute="handleExecute"
            @execute-selected="handleExecuteSelected"
            @history="handleHistory"
            @move-selection="handleMoveSelection"
          />
          <CommandPalette
            :commands="commandDeck"
            :selected-index="selectedIndex"
            @select="handleSelectCommand"
          />
        </section>
        <HudPanel :config="config" />
      </main>
      <PageFooter :config="config" />
    </div>
    <div v-if="showIntroModal" class="intro-overlay">
      <div class="intro-modal">
        <h2>Welcome, operator</h2>
        <p>Navigate this CV like a retro terminal:</p>
        <ul>
          <li>Use <kbd>↑</kbd>/<kbd>↓</kbd> to traverse command history.</li>
          <li>Use <kbd>←</kbd>/<kbd>→</kbd> or click chips to select commands.</li>
          <li>Hit <kbd>Enter</kbd> to run the highlighted command.</li>
          <li>Type directly for manual commands (try <code>help</code>).</li>
        </ul>
        <button type="button" @click="dismissIntroModal">Enter Console</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.crt-shell {
  position: relative;
  min-height: 100vh;
  padding: clamp(1rem, 2vw, 2.5rem);
  background: linear-gradient(135deg, #040814 0%, #01030a 40%, #02050f 100%);
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.crt-frame {
  position: relative;
  width: min(1300px, 100%);
  min-height: 80vh;
  background: var(--crt-inner);
  border-radius: 2rem;
  border: 2px solid rgba(25, 150, 125, 0.4);
  box-shadow:
    inset 0 0 80px rgba(0, 0, 0, 0.9),
    0 20px 60px rgba(0, 0, 0, 0.7);
  padding: clamp(1.2rem, 2vw, 2.4rem);
  display: flex;
  flex-direction: column;
}

.crt-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.scanlines {
  background-image: linear-gradient(rgba(255, 255, 255, 0.05) 2px, transparent 2px);
  background-size: 100% 4px;
  opacity: 0.35;
}

.noise {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.15'/%3E%3C/svg%3E");
  opacity: 0.2;
}

.crt-grid {
  position: relative;
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: clamp(1.2rem, 2vw, 2rem);
  z-index: 1;
  flex: 1;
}

.intro-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 4, 10, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  padding: 1.5rem;
}

.intro-modal {
  background: rgba(0, 0, 0, 0.8);
  border: 1px solid var(--crt-accent);
  border-radius: 1.2rem;
  max-width: 420px;
  width: 100%;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
}

.intro-modal h2 {
  margin-top: 0;
  font-family: var(--font-pixel);
  text-transform: uppercase;
  letter-spacing: 0.3rem;
  color: var(--crt-accent);
}

.intro-modal ul {
  padding-left: 1.2rem;
}

.intro-modal button {
  margin-top: 1.2rem;
  border: 1px solid var(--crt-yellow);
  background: transparent;
  color: var(--crt-yellow);
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  font-family: var(--font-pixel);
  letter-spacing: 0.2rem;
  text-transform: uppercase;
  cursor: pointer;
}

.intro-modal button:hover,
.intro-modal button:focus-visible {
  background: rgba(247, 243, 166, 0.1);
  outline: none;
}

.screen-panel {
  display: flex;
  flex-direction: column;
  background: rgba(2, 8, 18, 0.7);
  border: 1px solid rgba(72, 255, 203, 0.25);
  border-radius: 1.5rem;
  padding: clamp(1rem, 1.5vw, 1.8rem);
  box-shadow: inset 0 0 45px rgba(0, 0, 0, 0.5);
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(72, 255, 203, 0.3);
  padding-bottom: 0.8rem;
  margin-bottom: 1rem;
}

.terminal-title {
  margin: 0;
  font-family: var(--font-pixel);
  letter-spacing: 0.3rem;
  text-transform: uppercase;
  font-size: 1.2rem;
}

.terminal-host {
  margin: 0.2rem 0 0;
  color: var(--crt-dim);
}

.terminal-version {
  margin: 0;
  font-family: var(--font-pixel);
  color: var(--crt-yellow);
}

.error-state {
  text-align: center;
  padding: 3rem;
  color: var(--crt-warning);
}

@media (max-width: 1100px) {
  .crt-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .crt-shell {
    padding: 1rem 0.5rem;
  }
}
</style>
