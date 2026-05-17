(function () {
  const screen = document.querySelector('#screen');
  const form = document.querySelector('#commandForm');
  const input = document.querySelector('#commandInput');

  const VALID_COMMANDS = [
    'help',
    'system',
    'status',
    'scan',
    'access',
    'logs',
    'users',
    'tasks',
    'process',
    'network'
  ];

  const commandOutputs = {
    help: [
      'VALID COMMANDS',
      'help',
      'system',
      'status',
      'scan',
      'access',
      'logs',
      'users',
      'tasks',
      'process',
      'network'
    ],

    system: [
      'BEACON VESSEL INDEX',
      '',
      'CLASS: LONG-RANGE ARK / CIVILIAN PRESERVATION',
      'DESIGN CAPACITY: 32,026',
      'CURRENT LIFE REGISTER: 1.34 / 32,026',
      '',
      'DECKS 01-07 .......... PARTIAL',
      'DECKS 08-19 .......... NO RESPONSE',
      'ENGINE ROOMS A-C ..... COLD',
      'ENGINE ROOM D ........ UNKNOWN HEAT SIGNATURE',
      'PRESERVATION BAY ..... ACTIVE',
      'NAVIGATION ........... BLIND',
      'BEACON ARRAY ......... TRANSMITTING',
      'AI CORE .............. DEGRADED / LISTENING'
    ],

    status: [
      'STATUS: PRESERVE LIFE MODE',
      '',
      'Metabolic suspension field: unstable but holding',
      'Atmospheric recycling: minimum survivable loop',
      'Nutrient synthesis: degraded / ration ghost active',
      'Thermal envelope: narrowed to inhabited zone',
      'Command authority: orphaned',
      'Primary directive: KEEP REMAINING LIFE ONLINE'
    ],

    access: [
      'ACCESS REQUEST RECEIVED',
      'credential: unknown@beacon404',
      'rank: not issued',
      'biometric match: partial',
      'authority chain: broken',
      'RESULT: ACCESS DEFERRED',
      'note: the ship recognizes you, but not your permission.'
    ],

    logs: [
      'LOG INDEX RECOVERED',
      '',
      '2176-04-09  emergency recovery attempt 17 ........ unreadable / ash checksum',
      '2159-11-22  deck 12 pressure hymn ................ locked by user',
      '2118-02-03  crew census correction ................ error: personcount drift',
      '2077-08-30  food engine confession ................ corrupt / wet memory',
      '2041-01-14  beacon relight protocol ............... locked by user',
      '2029-05-18  first silence event ................... error: witness table missing',
      '',
      'OPEN LOG: unavailable',
      'archive spine reports impossible age.',
      '/logs/scan_ghostfault_7741: corrupt / unreadable'
    ],

    tasks: [
      'TASK QUEUE',
      'classified',
      'classified',
      'classified',
      '',
      'current task: CLASSIFIED',
      'assigned by: no surviving authority'
    ],

    process: [
      'PROCESS MONITOR',
      '',
      'oxygen recycle     [##--------] CRITICAL LOW',
      'water memory       [#---------] CRITICAL LOW',
      'AI intelligence    [##--------] LOW / FRAGMENTED',
      'make fuel          [####------] UNSTABLE',
      'make biomass       [#####-----] MINIMUM ACTIVE',
      'dream archive      [#---------] LEAKING',
      'heat discipline    [###-------] FAILING SAFE'
    ]
  };

  const scanSequence = [
    { text: 'SCAN INITIATED', tone: 'cyan', delay: 0 },
    { text: 'sweep: deck-index', delay: 420 },
    { text: 'sweep: thermal pockets', delay: 760 },
    { text: 'sweep: motion residue', delay: 1080 },
    { text: 'sweep: unauthorized sleep fields', delay: 1420 },
    { text: '', delay: 1720 },
    { text: 'WARNING: map lattice disagreement', tone: 'amber', delay: 2020 },
    { text: 'WARNING: 782 decks reported inside 19-deck structure', tone: 'amber', delay: 2380 },
    { text: 'WARNING: biological echo duplicated', tone: 'amber', delay: 2760 },
    { text: '', delay: 3060 },
    { text: 'SCAN ABORTED', tone: 'red', delay: 3380 },
    { text: 'CRASH LOG WRITTEN: /logs/scan_ghostfault_7741', tone: 'red', delay: 3740 },
    { text: 'READBACK STATUS: CORRUPT', tone: 'red', delay: 4080 }
  ];

  const state = {
    timers: []
  };

  function normalize(value) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function scrollToLatest() {
    screen.scrollTop = screen.scrollHeight;
  }

  function appendLine(text, tone) {
    const line = document.createElement('p');
    line.className = `line${tone ? ` line--${tone}` : ''}`;
    line.textContent = text;
    screen.appendChild(line);
    scrollToLatest();
    return line;
  }

  function appendLines(lines, tone) {
    lines.forEach((line) => appendLine(line, tone));
  }

  function clearTimers() {
    state.timers.forEach((timer) => window.clearTimeout(timer));
    state.timers = [];
  }

  function runTimedScan() {
    clearTimers();
    scanSequence.forEach((item) => {
      const timer = window.setTimeout(() => {
        appendLine(item.text, item.tone);
      }, item.delay);
      state.timers.push(timer);
    });
  }

  function appendButton(label, className, onClick) {
    const button = document.createElement('button');
    button.className = className;
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function appendVitalsPanel() {
    appendLines([
      'LIFE REGISTER',
      '1.34 / 32,026',
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
      'mara.voss ............ last login: 4 months ago / location masked',
      'elias-7 .............. last login: 41 years ago / session never closed',
      '',
      'Note: fractional life count unresolved.'
    ]);

    scrollToLatest();
  }

  function appendNetworkPanel() {
    appendLines([
      'SHIP NETWORK GRID',
      '',
      '[01●]--[02●]--[03●]--[04●]',
      '  |      |      |      |',
      '[05●]--[06●]--[07●]--[08●]',
      '  |      |      |      |',
      '[09●]--[10●]--[11●]--[12●]',
      '',
      'GREEN: awake nodes',
      'RED: dead nodes',
      'AMBER: lying nodes',
      '',
      'controls:'
    ]);

    const controls = document.createElement('div');
    controls.className = 'network-controls';
    [
      ['debug', 'debug request looped into dead bus'],
      ['safe mode', 'safe mode rejected / preservation bay refuses sleep'],
      ['isolate', 'isolation failed / node 06 reports two locations']
    ].forEach(([label, response]) => {
      controls.appendChild(appendButton(label, 'network-controls__button', () => appendLine(response, 'amber')));
    });
    screen.appendChild(controls);
    scrollToLatest();
  }

  function runCommand(rawValue) {
    const command = normalize(rawValue);
    if (!command) {
      return;
    }

    window.BeaconVideo?.handleCommand(command);
    appendLine(`unknown@beacon404: ${rawValue.trim()}`, 'input');

    if (command === 'scan') {
      runTimedScan();
      return;
    }

    if (command === 'users') {
      appendVitalsPanel();
      return;
    }

    if (command === 'network') {
      appendNetworkPanel();
      return;
    }

    if (commandOutputs[command]) {
      appendLines(commandOutputs[command]);
      return;
    }

    appendLine('COMMAND REFUSED / AUTHORITY UNKNOWN', 'red');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const value = input.value;
    input.value = '';
    runCommand(value);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || event.isComposing) {
      return;
    }

    event.preventDefault();
    const value = input.value;
    input.value = '';
    runCommand(value);
  });

  document.addEventListener('click', () => {
    input.focus();
  });

  // Future hook: a sequence dashboard can call runCommand-like beats while
  // BeaconVideo swaps video scenes and overlay animation layers.
  window.BeaconTerminal = {
    runCommand,
    appendLine,
    appendLines,
    validCommands: VALID_COMMANDS.slice()
  };

  input.focus();
})();
