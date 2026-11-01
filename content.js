(() => {
  const { HangulComposer, jamoForKey, KEYS } = globalThis.HangulIME;
  const TEXT_INPUT_TYPES = new Set(['text', 'search']);
  const LAYOUT = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

  const composer = new HangulComposer();
  // Lets a tab ignore the storage events caused by its own writes.
  const instanceId = crypto.randomUUID();
  let language = 'ko';
  let ui = null;

  function editableFrom(event) {
    const el = event.composedPath()[0];
    if (!(el instanceof Element)) return null;
    if (el.isContentEditable) return el;
    if (el.readOnly || el.disabled) return null;
    if (el.tagName === 'TEXTAREA') return el;
    // Password and email fields are deliberately left alone.
    if (el.tagName === 'INPUT' && TEXT_INPUT_TYPES.has(el.type)) return el;
    return null;
  }

  // Selects the in-progress syllable so the next insert replaces it. Returns false if the caret
  // is no longer right after that syllable, e.g. because the page re-rendered the text.
  function selectPreedit(el, text) {
    if ('selectionStart' in el) {
      const end = el.selectionEnd;
      const start = end - text.length;
      if (el.selectionStart !== end || start < 0 || el.value.slice(start, end) !== text) return false;
      el.setSelectionRange(start, end);
      return true;
    }
    const selection = window.getSelection();
    if (!selection.isCollapsed) return false;
    selection.modify('extend', 'backward', 'character');
    if (selection.toString() === text) return true;
    selection.collapseToEnd();
    return false;
  }

  // DeepL's editor syncs its model from DOM mutations and input events, both of which execCommand
  // produces. It ignores input during IME composition, so no composition events are simulated.
  function writeText(text) {
    if (text) document.execCommand('insertText', false, text);
    else document.execCommand('delete');
  }

  function typeJamo(el, jamo) {
    const preedit = composer.preedit;
    if (preedit && !selectPreedit(el, preedit)) composer.reset();
    const result = composer.type(jamo);
    writeText(result.commit + result.preedit);
  }

  function backspace(el) {
    const preedit = composer.preedit;
    if (!preedit) return false;
    if (!selectPreedit(el, preedit)) {
      composer.reset();
      return false;
    }
    writeText(composer.backspace());
    return true;
  }

  function setLanguage(value, save = true) {
    language = value;
    composer.reset();
    if (ui) ui.refresh();
    if (save) chrome.storage.local.set({ settings: { language, writer: instanceId } });
  }

  function toggleLanguage() {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  }

  function consume(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function onKeyDown(event) {
    if (event.isComposing || event.keyCode === 229) return;

    const isToggle = event.key === 'HangulMode' || event.code === 'Lang1'
      || (event.code === 'Space' && event.shiftKey && !event.ctrlKey && !event.altKey && !event.metaKey);
    if (isToggle) {
      consume(event);
      toggleLanguage();
      return;
    }

    if (language !== 'ko' || ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(event.key)) return;

    const el = editableFrom(event);
    if (!el || event.ctrlKey || event.altKey || event.metaKey) {
      composer.reset();
      return;
    }

    if (event.key === 'Backspace') {
      if (backspace(el)) consume(event);
      return;
    }

    const jamo = jamoForKey(event.code, event.shiftKey);
    if (jamo) {
      consume(event);
      typeJamo(el, jamo);
    } else {
      // Space, Enter, digits, punctuation and arrows finish the syllable and behave as usual.
      composer.reset();
    }
  }

  function createUI() {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `
      <style>
        :host { all: initial; position: fixed; right: 16px; bottom: 16px; z-index: 2147483647; }
        * { box-sizing: border-box; font: 13px/1.3 system-ui, "Noto Sans CJK KR", sans-serif; }
        .bar { display: flex; justify-content: flex-end; gap: 6px; }
        button { height: 34px; min-width: 34px; padding: 0 10px; border: 1px solid #b8c0cc; border-radius: 8px;
                 background: #fff; color: #1a2433; cursor: pointer; box-shadow: 0 1px 4px #0003; }
        button.on { background: #0f2b46; border-color: #0f2b46; color: #fff; font-weight: 600; }
        .chart { margin-bottom: 8px; padding: 10px; border-radius: 10px; background: #fff; color: #1a2433;
                 box-shadow: 0 2px 12px #0004; }
        .chart[hidden] { display: none; }
        .row { display: flex; gap: 3px; margin-top: 3px; }
        .row:nth-child(2) { margin-left: 12px; }
        .row:nth-child(3) { margin-left: 24px; }
        .key { width: 30px; height: 36px; border: 1px solid #d5dae1; border-radius: 5px; text-align: center; }
        .key b { display: block; font-size: 14px; font-weight: 600; }
        .key i { display: block; font-size: 10px; font-style: normal; color: #6b7686; }
        .note { margin-top: 8px; font-size: 11px; color: #6b7686; }
      </style>
      <div class="chart" hidden>
        ${LAYOUT.map((row) => `<div class="row">${[...row].map((letter) => {
          const jamo = KEYS[`Key${letter}`];
          return `<div class="key"><b>${jamo}</b><i>${letter}</i></div>`;
        }).join('')}</div>`).join('')}
        <div class="note">The second jamo on a key needs Shift. Shift+Space switches Korean/English.</div>
      </div>
      <div class="bar">
        <button class="layout" title="Show the Korean keyboard layout">Keys</button>
        <button class="mode" title="Switch Korean/English (Shift+Space)"></button>
      </div>`;

    const mode = root.querySelector('.mode');
    const chart = root.querySelector('.chart');
    // Keep the caret in the editor when the buttons are clicked.
    root.addEventListener('mousedown', (event) => event.preventDefault());
    mode.addEventListener('click', toggleLanguage);
    root.querySelector('.layout').addEventListener('click', () => { chart.hidden = !chart.hidden; });

    document.documentElement.append(host);
    return {
      refresh() {
        mode.textContent = language === 'ko' ? '한' : 'A';
        mode.classList.toggle('on', language === 'ko');
      },
    };
  }

  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('mousedown', () => composer.reset(), true);
  window.addEventListener('focusout', () => composer.reset(), true);
  window.addEventListener('compositionstart', () => composer.reset(), true);

  ui = createUI();
  ui.refresh();
  chrome.storage.local.get({ settings: { language } }, ({ settings }) => {
    if (settings.language !== language) setLanguage(settings.language, false);
  });
  chrome.storage.onChanged.addListener(({ settings }) => {
    const next = settings && settings.newValue;
    if (next && next.writer !== instanceId && next.language !== language) setLanguage(next.language, false);
  });
})();
