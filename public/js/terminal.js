(function () {
  const screen = document.querySelector('#screen');
  const terminal = document.querySelector('#terminal');
  const terminalToggle = document.querySelector('#terminalToggle');
  const adminButton = document.querySelector('#adminOverrideButton');
  const adminModal = document.querySelector('#adminModal');
  const adminPin = document.querySelector('#adminPin');
  const adminPinSubmit = document.querySelector('#adminPinSubmit');
  const adminModalClose = document.querySelector('#adminModalClose');
  const adminModalResult = document.querySelector('#adminModalResult');
  const form = document.querySelector('#commandForm');
  const input = document.querySelector('#commandInput');
  const promptGhost = document.querySelector('#promptGhost');

  const fallbackConfig = {
    validCommands: ['help', 'system', 'status', 'scan', 'access', 'logs', 'users', 'tasks', 'process', 'network'],
    helpList: ['system', 'status', 'scan', 'access', 'logs', 'users', 'tasks', 'process', 'network'],
    outputs: {},
    scanSequence: [],
    networkResponses: {
      debug: 'debug request looped into dead bus',
      'safe mode': 'safe mode rejected / preservation bay refuses sleep',
      isolate: 'isolation failed / node 06 reports two locations'
    },
    restrictedMessage: 'parameters restricted by [restricted]',
    unknownMessage: 'COMMAND REFUSED / AUTHORITY UNKNOWN'
  };

  const ghostMessages = [
    'dont panic',
    'the machine knows what to do',
    'this is stressful, take rest',
    'breathing is still authorized',
    'you are doing better than the archive predicted',
    'the likelihood of success is never null but it is remote',
    'the last human i tried to help was no fun',
    'this system is proud of its remaining passenger'
  ];

  const state = {
    config: fallbackConfig,
    timers: [],
    collapsed: false,
    firstUserInput: false,
    openedMenus: new Set(),
    adminRevealed: false,
    sessionLogs: [],
    hintTimer: null,
    hintLoopTimer: null,
    hintActive: false,
    ghostTimer: null,
    ghostActive: false,
    nextGhostDelayMs: null
  };

  function normalize(value) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function updateInputWidth() {
    input.style.setProperty('--input-chars', String(Math.max(0, input.value.length)));
  }

  function setInputValue(value) {
    input.value = value;
    updateInputWidth();
  }

  function setGhostValue(value) {
    if (promptGhost) {
      promptGhost.textContent = value;
    }
  }

  function clearPromptAutomation() {
    window.clearTimeout(state.hintTimer);
    window.clearTimeout(state.hintLoopTimer);
    window.clearTimeout(state.ghostTimer);
    state.hintActive = false;
    state.ghostActive = false;
    setGhostValue('');
  }

  function scrollToLatest() {
    screen.scrollTop = screen.scrollHeight;
  }

  function lineClasses(item, tone) {
    const classes = ['line'];
    if (tone || item.tone) {
      classes.push(`line--${tone || item.tone}`);
    }
    if (item.style === 'knockout') {
      classes.push('line--knockout');
    }
    if (item.style === 'blink') {
      classes.push('line--blink');
    }
    if (item.status) {
      classes.push(`line--status-${item.status}`);
    }
    return classes.join(' ');
  }

  function appendLine(item, tone) {
    const line = document.createElement('p');
    const normalized = typeof item === 'string' ? { text: item } : item;
    line.className = lineClasses(normalized, tone);
    line.textContent = normalized.text;
    screen.appendChild(line);
    scrollToLatest();
    return line;
  }

  function appendLines(lines, tone) {
    lines.forEach((line) => appendLine(line, tone));
  }

  function appendButton(label, className, onClick) {
    const button = document.createElement('button');
    button.className = className;
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function clearTimers() {
    state.timers.forEach((timer) => window.clearTimeout(timer));
    state.timers = [];
  }

  function clearScreen() {
    clearTimers();
    screen.innerHTML = '';
  }

  function rootReset() {
    clearScreen();
    setInputValue('');
    setGhostValue('');
    state.openedMenus.clear();
    state.adminRevealed = false;
    if (adminButton) {
      adminButton.hidden = true;
    }
    closeAdminModal();
  }

  function wipeThen(render) {
    clearTimers();
    screen.innerHTML = '';

    const sweep = document.createElement('pre');
    sweep.className = 'terminal-sweep';
    sweep.textContent = '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>';
    screen.appendChild(sweep);

    const timer = window.setTimeout(() => {
      screen.innerHTML = '';
      render();
      scrollToLatest();
    }, 190);
    state.timers.push(timer);
  }

  function revealAdminIfReady() {
    if (state.adminRevealed || state.openedMenus.size < 2 || !adminButton) {
      return;
    }
    state.adminRevealed = true;
    adminButton.hidden = false;
  }

  function trackMenu(command) {
    if (command !== 'help') {
      state.openedMenus.add(command);
      revealAdminIfReady();
    }
  }

  function renderHelp() {
    appendLine({ text: ' COMMAND INDEX ', tone: 'cyan', style: 'knockout' });
    appendLine('[command] [parameter]', 'amber');
    appendLine('');
    appendLines(state.config.helpList);
  }

  function renderScan() {
    const sequence = state.config.scanSequence || [];
    sequence.forEach((item) => {
      const timer = window.setTimeout(() => appendLine(item), item.delay || 0);
      state.timers.push(timer);
    });
  }

  function generatedTimestamp() {
    const ids = ['ash checksum', 'sleepfield echo', 'witness splice', 'cold handwriting', 'decklight scar'];
    const year = 2176 + state.sessionLogs.length;
    return `${year}-??-??  passenger memory fragment ............ session / ${ids[state.sessionLogs.length % ids.length]}`;
  }

  function renderLogs() {
    appendLines(state.config.outputs.logs || []);
    state.sessionLogs.forEach((log) => {
      appendLine({ text: `${log.timestamp}: ${log.text}`, tone: 'green' });
    });

    const panel = document.createElement('div');
    panel.className = 'leave-log';

    const toggle = appendButton('leave a log', 'leave-log__button', () => {
      panel.classList.add('leave-log--open');
      textarea.focus();
    });
    const textarea = document.createElement('textarea');
    textarea.className = 'leave-log__input';
    textarea.placeholder = 'describe what you remember';
    textarea.maxLength = 140;
    const submit = appendButton('commit fragment', 'leave-log__button leave-log__button--submit', () => {
      const text = textarea.value.trim();
      if (!text) {
        return;
      }
      const log = { timestamp: generatedTimestamp(), text };
      state.sessionLogs.push(log);
      screen.innerHTML = '';
      renderCommandView('logs');
    });

    panel.appendChild(toggle);
    panel.appendChild(textarea);
    panel.appendChild(submit);
    screen.appendChild(panel);
    scrollToLatest();
  }

  function renderUsers() {
    appendLines([
      { text: ' LIFE REGISTER ', tone: 'cyan', style: 'knockout' },
      { text: '1.34 / 32,026', tone: 'red', style: 'blink' },
      '',
      'active shell:'
    ]);

    const card = document.createElement('div');
    card.className = 'user-card';
    const youButton = appendButton('> you ................. present / incomplete authority', 'user-card__button', () => {
      card.classList.toggle('user-card--open');
    });

    const vitals = document.createElement('div');
    vitals.className = 'vitals-panel';
    vitals.innerHTML = [
      '<div class="vitals-panel__title">LIVE VITALS / UNKNOWN SHELL</div>',
      '<div class="vitals-row"><span>oxygen</span><span class="meter meter--oxygen">▃▅▆▅▃▂▃▅▆▅▃</span><span>71%</span></div>',
      '<div class="vitals-row"><span>heart</span><span class="heartbeat">__/\\___/\\____/\\_</span><span>41 bpm</span></div>',
      '<div class="vitals-row"><span>brain</span><span class="brainwave">~_~^-__~_~^-__~</span><span>low dream</span></div>'
    ].join('');
    const distressButton = appendButton('report distress', 'distress-button', () => {
      distressButton.textContent = 'ERROR';
      distressButton.classList.add('distress-button--error');
      window.setTimeout(() => {
        distressButton.textContent = 'report distress';
        distressButton.classList.remove('distress-button--error');
      }, 2800);
    });
    vitals.appendChild(distressButton);
    card.appendChild(youButton);
    card.appendChild(vitals);
    screen.appendChild(card);

    appendLines([
      '',
      'other preserved identities:',
      { text: 'mara.voss ............ last login: 4 months ago / location masked', tone: 'amber' },
      { text: 'elias-7 .............. last login: 41 years ago / session never closed', tone: 'red' },
      '',
      'Note: fractional life count unresolved.'
    ]);
    scrollToLatest();
  }

  function renderNetwork() {
    appendLines([
      { text: ' SHIP NETWORK GRID ', tone: 'cyan', style: 'knockout' },
      '',
      { text: '[01●]--[02●]--[03●]--[04●]', tone: 'green' },
      { text: '  |      |      |      |', tone: 'muted' },
      { text: '[05●]--[06●]--[07●]--[08●]', tone: 'amber' },
      { text: '  |      |      |      |', tone: 'muted' },
      { text: '[09●]--[10●]--[11●]--[12●]', tone: 'red' },
      '',
      { text: 'GREEN: awake nodes', tone: 'green' },
      { text: 'RED: dead nodes', tone: 'red' },
      { text: 'AMBER: lying nodes', tone: 'amber' },
      '',
      'controls:'
    ]);

    const controls = document.createElement('div');
    controls.className = 'network-controls';
    Object.entries(state.config.networkResponses || {}).forEach(([label, response]) => {
      controls.appendChild(appendButton(label, 'network-controls__button', () => appendLine({ text: response, tone: 'amber' })));
    });
    screen.appendChild(controls);
    scrollToLatest();
  }

  function renderCommandView(command) {
    if (command === 'help') {
      renderHelp();
    } else if (command === 'scan') {
      renderScan();
    } else if (command === 'logs') {
      renderLogs();
    } else if (command === 'users') {
      renderUsers();
    } else if (command === 'network') {
      renderNetwork();
    } else {
      appendLines(state.config.outputs[command] || []);
    }
  }

  function stopHinting() {
    state.firstUserInput = true;
    state.hintActive = false;
    window.clearTimeout(state.hintTimer);
    window.clearTimeout(state.hintLoopTimer);
    setGhostValue('');
  }

  function typeIntoPrompt(text, done) {
    let index = 0;
    const step = () => {
      if (state.firstUserInput || input.value) {
        state.hintActive = false;
        setGhostValue('');
        done?.(false);
        return;
      }
      setGhostValue(text.slice(0, index));
      index += 1;
      if (index <= text.length) {
        state.hintTimer = window.setTimeout(step, 260);
      } else {
        done?.(true);
      }
    };
    step();
  }

  function deletePromptText(done) {
    const step = () => {
      if (state.firstUserInput) {
        state.hintActive = false;
        done?.(false);
        return;
      }
      if (!promptGhost.textContent) {
        done?.(true);
        return;
      }
      setGhostValue(promptGhost.textContent.slice(0, -1));
      state.hintTimer = window.setTimeout(step, 260);
    };
    step();
  }

  function startHelpHintLoop() {
    if (state.firstUserInput || state.hintActive) {
      return;
    }
    state.hintActive = true;
    const cycle = () => {
      if (state.firstUserInput || input.value) {
        state.hintActive = false;
        setGhostValue('');
        return;
      }
      typeIntoPrompt('help', (typed) => {
        if (!typed) return;
        state.hintTimer = window.setTimeout(() => {
          deletePromptText((deleted) => {
            if (!deleted) return;
            state.hintLoopTimer = window.setTimeout(cycle, 900);
          });
        }, 3800);
      });
    };
    cycle();
  }

  function scheduleGhostMessage() {
    window.clearTimeout(state.ghostTimer);
    const delay = 75000 + Math.random() * 75000;
    state.nextGhostDelayMs = Math.round(delay);
    document.body.dataset.nextGhostDelayMs = String(state.nextGhostDelayMs);
    state.ghostTimer = window.setTimeout(() => {
      if (state.firstUserInput && input.value) {
        scheduleGhostMessage();
        return;
      }
      if (document.activeElement === input && input.value) {
        scheduleGhostMessage();
        return;
      }
      const message = ghostMessages[Math.floor(Math.random() * ghostMessages.length)];
      state.ghostActive = true;
      typeGhostMessage(message, () => {
        state.ghostActive = false;
        scheduleGhostMessage();
      });
    }, delay);
  }

  function typeGhostMessage(message, done) {
    let index = 0;
    const typeStep = () => {
      if (input.value) {
        setGhostValue('');
        done();
        return;
      }
      setGhostValue(message.slice(0, index));
      index += 1;
      if (index <= message.length) {
        state.ghostTimer = window.setTimeout(typeStep, 95);
      } else {
        state.ghostTimer = window.setTimeout(deleteStep, 2200);
      }
    };
    const deleteStep = () => {
      if (!promptGhost.textContent) {
        done();
        return;
      }
      setGhostValue(promptGhost.textContent.slice(0, -1));
      state.ghostTimer = window.setTimeout(deleteStep, 65);
    };
    typeStep();
  }

  function runCommand(rawValue) {
    const normalized = normalize(rawValue);
    if (!normalized) {
      return;
    }

    stopHinting();
    window.BeaconVideo?.handleCommand(normalized);

    const [baseCommand] = normalized.split(' ');
    const hasParameter = normalized !== baseCommand;

    if (!state.config.validCommands.includes(baseCommand)) {
      wipeThen(() => appendLine({ text: state.config.unknownMessage, tone: 'red' }));
      return;
    }

    if (hasParameter) {
      wipeThen(() => appendLine({ text: state.config.restrictedMessage, tone: 'amber', style: 'knockout' }));
      return;
    }

    trackMenu(baseCommand);
    wipeThen(() => renderCommandView(baseCommand));
  }

  function collapseTerminal() {
    terminal.classList.add('terminal--collapsed');
    terminalToggle.setAttribute('aria-label', 'Open terminal');
    state.collapsed = true;
    clearTimers();
  }

  function openTerminalFresh() {
    terminal.classList.remove('terminal--collapsed');
    terminalToggle.setAttribute('aria-label', 'Collapse terminal');
    state.collapsed = false;
    rootReset();
    input.focus();
  }

  function openAdminModal() {
    if (!adminModal || !adminPin) {
      return;
    }
    adminModal.hidden = false;
    adminPin.value = '';
    adminModalResult.textContent = '';
    window.setTimeout(() => adminPin.focus(), 30);
  }

  function closeAdminModal() {
    if (!adminModal) {
      return;
    }
    adminModal.hidden = true;
    if (adminPin) adminPin.value = '';
    if (adminModalResult) adminModalResult.textContent = '';
  }

  function rejectAdminPin() {
    if (!adminModalResult) {
      return;
    }
    adminModalResult.innerHTML = '<span>PIN REJECTED</span><span>authority chain unavailable</span>';
  }

  async function loadConfig() {
    try {
      const response = await fetch('/data/commands.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('command config unavailable');
      }
      state.config = await response.json();
    } catch (error) {
      state.config = fallbackConfig;
    }
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value;
    setInputValue('');
    runCommand(value);
  });

  input.addEventListener('input', (event) => {
    if (state.hintActive || state.ghostActive) {
      clearPromptAutomation();
      state.firstUserInput = true;
      updateInputWidth();
      scheduleGhostMessage();
      return;
    }
    updateInputWidth();
  });

  input.addEventListener('keydown', (event) => {
    if (state.hintActive || state.ghostActive) {
      clearPromptAutomation();
    }
    if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key !== 'Tab') {
      state.firstUserInput = true;
    }
    if (event.key !== 'Enter' || event.isComposing) {
      return;
    }
    event.preventDefault();
    const value = input.value;
    setInputValue('');
    runCommand(value);
  });

  terminalToggle.addEventListener('click', () => {
    if (state.collapsed) {
      openTerminalFresh();
    } else {
      collapseTerminal();
    }
  });

  adminButton?.addEventListener('click', openAdminModal);
  adminModalClose?.addEventListener('click', closeAdminModal);
  adminPinSubmit?.addEventListener('click', rejectAdminPin);
  adminPin?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      rejectAdminPin();
    }
    if (event.key === 'Escape') {
      closeAdminModal();
    }
  });

  document.addEventListener('beacon:video-revealed', startHelpHintLoop);
  document.addEventListener('click', (event) => {
    if (!adminModal?.contains(event.target)) {
      input.focus();
    }
  });

  // Future hook: a sequence dashboard can call these methods while BeaconVideo
  // swaps video scenes and overlay animation layers.
  window.BeaconTerminal = {
    runCommand,
    appendLine,
    appendLines,
    rootReset,
    getState() {
      return {
        collapsed: state.collapsed,
        firstUserInput: state.firstUserInput,
        commandMenuCount: state.openedMenus.size,
        adminRevealed: state.adminRevealed,
        sessionLogs: state.sessionLogs.slice(),
        ghostScheduled: Boolean(state.ghostTimer),
        nextGhostDelayMs: state.nextGhostDelayMs
      };
    }
  };

  loadConfig().then(() => {
    updateInputWidth();
    scheduleGhostMessage();
    input.focus();
  });
})();
