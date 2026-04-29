const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const previewPane = document.getElementById('preview-pane');
const divider = document.getElementById('divider');
const lineNumbers = document.getElementById('line-numbers');
const statusFile = document.getElementById('status-file');
const statusInfo = document.getElementById('status-info');
const statusWords = document.getElementById('status-words');
const container = document.getElementById('container');
const dragOverlay = document.getElementById('drag-overlay');
const validationBadge = document.getElementById('validation-badge');

let currentFile = null;
let isModified = false;
let viewMode = 'split';
let lineNumbersVisible = true;
let theme = 'system';

// -- JSON Tree Rendering --
function buildJsonTree(obj, key, isLast) {
  const comma = isLast ? '' : ',';
  const keyPrefix = key !== undefined ? `<span class="json-key">${escapeHtml(key)}</span>: ` : '';

  if (obj === null) {
    return `<li>${keyPrefix}<span class="json-null">null</span>${comma}</li>`;
  }

  if (typeof obj === 'string') {
    return `<li>${keyPrefix}<span class="json-string">"${escapeHtml(obj)}"</span>${comma}</li>`;
  }

  if (typeof obj === 'number') {
    return `<li>${keyPrefix}<span class="json-number">${obj}</span>${comma}</li>`;
  }

  if (typeof obj === 'boolean') {
    return `<li>${keyPrefix}<span class="json-boolean">${obj}</span>${comma}</li>`;
  }

  if (Array.isArray(obj)) {
    const items = obj.map((item, i) => buildJsonTree(item, undefined, i === obj.length - 1)).join('');
    return `<li><span class="json-toggle"></span>${keyPrefix}<span class="json-bracket">[</span><ul class="json-tree">${items}</ul><span class="json-bracket">]</span>${comma}</li>`;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    const items = keys.map((k, i) => buildJsonTree(obj[k], k, i === keys.length - 1)).join('');
    return `<li><span class="json-toggle"></span>${keyPrefix}<span class="json-bracket">{</span><ul class="json-tree">${items}</ul><span class="json-bracket">}</span>${comma}</li>`;
  }

  return '';
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderPreview() {
  const text = editor.value.trim();
  if (!text) {
    preview.innerHTML = '<div style="color: var(--text-muted); padding: 16px;">Enter JSON or Python dict to preview</div>';
    validationBadge.textContent = 'Empty';
    validationBadge.className = 'warning';
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
    validationBadge.textContent = 'Valid JSON';
    validationBadge.className = '';
  } catch (e) {
    try {
      parsed = parsePythonDict(text);
      validationBadge.textContent = 'Valid Python Dict';
      validationBadge.className = 'warning';
    } catch (err) {
      validationBadge.textContent = 'Invalid';
      validationBadge.className = 'invalid';
      preview.innerHTML = `<div class="json-error"><strong>Parse Error:</strong>\n${escapeHtml(err.message)}</div>`;
      return;
    }
  }

  const tree = buildJsonTree(parsed, undefined, true);
  preview.innerHTML = `<ul class="json-tree">${tree}</ul>`;

  // Add click handlers for tree toggle
  preview.querySelectorAll('.json-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.parentElement.classList.toggle('json-collapsed');
    });
  });
}

// -- Python Dict Parser --
function parsePythonDict(text) {
  // Convert Python dict syntax to valid JSON
  let json = text
    // Remove trailing commas (before } or ])
    .replace(/,\s*([}\]])/g, '$1')
    // Convert Python True/False/None to JSON true/false/null
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false')
    .replace(/\bNone\b/g, 'null')
    // Convert single quotes to double quotes
    .replace(/'/g, '"')
    // Remove Python set syntax (single values without keys)
    // Handle trailing commas in arrays/objects
    .replace(/,\s*([}\]])/g, '$1');

  return JSON.parse(json);
}

// -- Line numbers --
function updateLineNumbers() {
  const lines = editor.value.split('\n').length;
  let html = '';
  for (let i = 1; i <= lines; i++) {
    html += i + '<br>';
  }
  lineNumbers.innerHTML = html;
}

// -- Cursor position --
function updateCursorInfo() {
  const text = editor.value.substring(0, editor.selectionStart);
  const lines = text.split('\n');
  const ln = lines.length;
  const col = lines[lines.length - 1].length + 1;
  statusInfo.textContent = `Ln ${ln}, Col ${col}`;
}

// -- Byte count --
function updateByteCount() {
  const bytes = new Blob([editor.value]).size;
  statusWords.textContent = `${bytes} bytes`;
}

// -- Status bar --
function updateStatusBar() {
  const modified = isModified ? ' *' : '';
  const name = currentFile ? currentFile.split(/[/\\]/).pop() : 'Untitled';
  statusFile.textContent = name + modified;
  updateLineNumbers();
  updateCursorInfo();
  updateByteCount();
  updateWindowTitle();
}

// -- Window title --
function updateWindowTitle() {
  const dirty = isModified ? '* ' : '';
  const name = currentFile ? currentFile.split(/[/\\]/).pop() : 'Untitled';
  document.title = `${dirty}${name} — JSONight`;
}

// -- Editor events --
editor.addEventListener('input', () => {
  isModified = true;
  updateStatusBar();
  renderPreview();
});

editor.addEventListener('click', updateCursorInfo);
editor.addEventListener('keyup', updateCursorInfo);

// Scroll sync: line numbers
editor.addEventListener('scroll', () => {
  lineNumbers.style.transform = `translateY(${-editor.scrollTop}px)`;
});

// -- Tab key support --
editor.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = start + 4;
    editor.dispatchEvent(new Event('input'));
  }
});

// -- Keyboard shortcuts --
document.addEventListener('keydown', (e) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const mod = isMac ? e.metaKey : e.ctrlKey;
  const shiftMod = mod && e.shiftKey;

  if (shiftMod && e.key === 'F') {
    e.preventDefault();
    handleFormat();
  } else if (shiftMod && e.key === 'M') {
    e.preventDefault();
    handleMinify();
  } else if (shiftMod && e.key === 'P') {
    e.preventDefault();
    handleParsePython();
  } else if (mod && e.key === 's') {
    e.preventDefault();
    e.shiftKey ? handleSaveAs() : handleSave();
  } else if (mod && e.key === 'o') {
    e.preventDefault();
    handleOpen();
  } else if (mod && e.key === 'n') {
    e.preventDefault();
    handleNew();
  } else if (mod && e.key === 'p') {
    e.preventDefault();
    togglePreview();
  } else if (mod && e.key === 'l') {
    e.preventDefault();
    toggleLineNumbers();
  }
});

// -- Menu handler --
window.__handleMenu = (action) => {
  switch (action) {
    case 'new': handleNew(); break;
    case 'open': handleOpen(); break;
    case 'save': handleSave(); break;
    case 'save_as': handleSaveAs(); break;
    case 'select_all': editor.select(); break;
    case 'toggle_preview': togglePreview(); break;
    case 'toggle_line_numbers': toggleLineNumbers(); break;
    case 'layout_split': setViewMode('split'); break;
    case 'layout_editor': setViewMode('editor'); break;
    case 'layout_preview': setViewMode('preview'); break;
    case 'theme_light': setTheme('light'); break;
    case 'theme_dark': setTheme('dark'); break;
    case 'theme_system': setTheme('system'); break;
    case 'format': handleFormat(); break;
    case 'minify': handleMinify(); break;
    case 'parse_python': handleParsePython(); break;
  }
};

// -- View modes --
function setViewMode(mode) {
  viewMode = mode;
  document.getElementById('editor-pane').style.flex = '';
  document.getElementById('preview-pane').style.flex = '';
  container.classList.remove('view-editor', 'view-preview');
  if (mode === 'editor') container.classList.add('view-editor');
  if (mode === 'preview') container.classList.add('view-preview');
}

function togglePreview() {
  if (viewMode === 'split') {
    setViewMode('editor');
  } else {
    setViewMode('split');
  }
}

// -- Line numbers toggle --
function toggleLineNumbers() {
  lineNumbersVisible = !lineNumbersVisible;
  container.classList.toggle('lines-hidden', !lineNumbersVisible);
}

// -- Theme system --
function setTheme(t) {
  theme = t;
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('jsonight-theme', t);
}

// -- Format JSON --
function handleFormat() {
  const text = editor.value.trim();
  if (!text) return;

  try {
    const parsed = JSON.parse(text);
    editor.value = JSON.stringify(parsed, null, 2);
    isModified = true;
    updateStatusBar();
    renderPreview();
  } catch (e) {
    try {
      const parsed = parsePythonDict(text);
      editor.value = JSON.stringify(parsed, null, 2);
      isModified = true;
      updateStatusBar();
      renderPreview();
    } catch (err) {
      alert(`Cannot format: ${err.message}`);
    }
  }
}

// -- Minify JSON --
function handleMinify() {
  const text = editor.value.trim();
  if (!text) return;

  try {
    const parsed = JSON.parse(text);
    editor.value = JSON.stringify(parsed);
    isModified = true;
    updateStatusBar();
    renderPreview();
  } catch (e) {
    try {
      const parsed = parsePythonDict(text);
      editor.value = JSON.stringify(parsed);
      isModified = true;
      updateStatusBar();
      renderPreview();
    } catch (err) {
      alert(`Cannot minify: ${err.message}`);
    }
  }
}

// -- Parse Python Dict --
function handleParsePython() {
  const text = editor.value.trim();
  if (!text) return;

  try {
    const parsed = parsePythonDict(text);
    editor.value = JSON.stringify(parsed, null, 2);
    isModified = true;
    updateStatusBar();
    renderPreview();
  } catch (err) {
    alert(`Cannot parse Python dict: ${err.message}`);
  }
}

// -- Copy to Clipboard --
function handleClipboard() {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(editor.value).then(() => {
      const btn = document.getElementById('btn-clipboard');
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
    });
  } else {
    document.execCommand('copy');
  }
}

// -- File operations --
async function handleOpen() {
  if (isModified && !confirm('Discard unsaved changes?')) return;

  const { open } = window.__TAURI__.dialog;
  const selected = await open({
    multiple: false,
    filters: [{ name: 'JSON', extensions: ['json', 'py', 'txt'] }]
  });

  if (selected) {
    const { readTextFile } = window.__TAURI__.fs;
    const content = await readTextFile(selected);
    editor.value = content;
    currentFile = selected;
    isModified = false;
    updateStatusBar();
    renderPreview();
  }
}

async function handleSave() {
  if (!currentFile) {
    await handleSaveAs();
    return;
  }
  const { writeTextFile } = window.__TAURI__.fs;
  await writeTextFile(currentFile, editor.value);
  isModified = false;
  updateStatusBar();
}

async function handleSaveAs() {
  const { save } = window.__TAURI__.dialog;
  const selected = await save({
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'Python', extensions: ['py'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (selected) {
    const { writeTextFile } = window.__TAURI__.fs;
    await writeTextFile(selected, editor.value);
    currentFile = selected;
    isModified = false;
    updateStatusBar();
  }
}

function handleNew() {
  if (isModified && !confirm('Discard unsaved changes?')) return;
  editor.value = '';
  currentFile = null;
  isModified = false;
  updateStatusBar();
  renderPreview();
}

// -- Divider drag resize with overlay --
let isDragging = false;
divider.addEventListener('mousedown', (e) => {
  isDragging = true;
  divider.style.background = 'var(--accent)';
  dragOverlay.style.display = 'block';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const rect = container.getBoundingClientRect();
  const offset = e.clientX - rect.left;
  const total = rect.width;
  const pct = Math.max(20, Math.min(80, (offset / total) * 100));
  document.getElementById('editor-pane').style.flex = `0 0 ${pct}%`;
  document.getElementById('preview-pane').style.flex = `0 0 ${100 - pct}%`;
});

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    divider.style.background = '';
    dragOverlay.style.display = 'none';
  }
});

// -- Window close warning --
window.addEventListener('beforeunload', (e) => {
  if (isModified) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// -- Init --
const savedTheme = localStorage.getItem('jsonight-theme') || 'system';
setTheme(savedTheme);

// Toolbar buttons
document.getElementById('btn-format').addEventListener('click', handleFormat);
document.getElementById('btn-minify').addEventListener('click', handleMinify);
document.getElementById('btn-parse-python').addEventListener('click', handleParsePython);
document.getElementById('btn-clipboard').addEventListener('click', handleClipboard);

updateStatusBar();
renderPreview();
