(function () {
  const DEFAULT_SEQUENCE = [
    {
      id: 'ascii-awakening',
      horizontalSrc: '/data/ascii-output.mp4',
      verticalSrc: '/data/ascii-output.mp4',
      startDelayMs: 5000,
      muted: true,
      loopMode: 'tape-rewind'
    }
  ];

  const state = {
    sequence: DEFAULT_SEQUENCE.slice(),
    activeIndex: 0,
    isVisible: false,
    overlayHooks: new Map()
  };

  const introScreen = document.querySelector('#introScreen');
  const stage = document.querySelector('#videoStage');
  const video = document.querySelector('#backgroundVideo');
  const rewindButton = document.querySelector('#videoRewind');
  const overlayLayer = document.querySelector('#videoOverlayLayer');
  const telemetry = document.querySelector('#videoTelemetry');
  const transcribeButton = document.querySelector('#transcribeAudio');
  const transcript = document.querySelector('#videoTranscript');

  function isVerticalViewport() {
    return window.innerHeight > window.innerWidth;
  }

  function sourceFor(item) {
    if (isVerticalViewport()) {
      return item.verticalSrc || item.horizontalSrc;
    }
    return item.horizontalSrc || item.verticalSrc;
  }

  function applyActiveSource() {
    const item = state.sequence[state.activeIndex];
    if (!video || !item) {
      return;
    }

    const nextSrc = sourceFor(item);
    if (!video.getAttribute('src') || !video.currentSrc.includes(nextSrc)) {
      video.src = nextSrc;
      video.load();
    }

    video.muted = true;
    video.volume = 0;
    video.playsInline = true;
  }

  function playActive() {
    if (!video) {
      return;
    }

    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        video.muted = true;
      });
    }
  }

  function reveal() {
    if (!stage) {
      return;
    }

    state.isVisible = true;
    stage.classList.add('video-stage--visible');
    applyActiveSource();
    playActive();
    document.dispatchEvent(new CustomEvent('beacon:video-revealed', {
      detail: getState()
    }));
  }

  function rewind() {
    if (!video || !stage) {
      return;
    }

    stage.classList.add('video-stage--rewinding');
    window.setTimeout(() => {
      video.currentTime = 0;
      playActive();
      stage.classList.remove('video-stage--rewinding');
    }, 520);
  }

  function setSequence(sequence, startIndex = 0) {
    state.sequence = sequence.length ? sequence.slice() : DEFAULT_SEQUENCE.slice();
    state.activeIndex = Math.max(0, Math.min(startIndex, state.sequence.length - 1));
    applyActiveSource();
    if (state.isVisible) {
      playActive();
    }
  }

  function setActiveById(id) {
    const nextIndex = state.sequence.findIndex((item) => item.id === id);
    if (nextIndex < 0) {
      return false;
    }

    state.activeIndex = nextIndex;
    applyActiveSource();
    if (state.isVisible) {
      playActive();
    }
    return true;
  }

  function addOverlay(id, render) {
    state.overlayHooks.set(id, render);
    if (overlayLayer && typeof render === 'function') {
      render(overlayLayer, state);
    }
  }

  function removeOverlay(id) {
    state.overlayHooks.delete(id);
    if (overlayLayer) {
      overlayLayer.querySelector(`[data-overlay-id="${id}"]`)?.remove();
    }
  }

  function handleCommand(command) {
    // Future hook: command-triggered video changes and overlay animation cues.
    document.dispatchEvent(new CustomEvent('beacon:video-command', {
      detail: { command, active: state.sequence[state.activeIndex] }
    }));
  }

  function getState() {
    return {
      active: state.sequence[state.activeIndex],
      visible: state.isVisible,
      orientation: isVerticalViewport() ? 'vertical' : 'horizontal'
    };
  }

  if (video) {
    video.addEventListener('ended', rewind);
  }

  if (rewindButton) {
    rewindButton.addEventListener('click', rewind);
  }

  if (transcribeButton && transcript) {
    transcribeButton.addEventListener('click', () => {
      transcript.textContent = 'you cant be up this must be a glitch from the solar storms. how is this signal holding stable duri';
      transcript.hidden = false;
    });
  }

  function updateTelemetry() {
    if (!telemetry || !video) {
      return;
    }

    const frame = Math.floor((video.currentTime || 0) * 24).toString().padStart(5, '0');
    const signal = Math.max(17, Math.min(98, 61 + Math.round(Math.sin(Date.now() / 1700) * 19)));
    const drift = (Math.sin(Date.now() / 2600) * 0.034).toFixed(3);
    const channels = ['ARK-12', 'CRYO-E', 'BEACON-4', 'GHOST-7'];
    const channel = channels[Math.floor(Date.now() / 5000) % channels.length];
    const tapeHead = stage && stage.classList.contains('video-stage--rewinding') ? 'REWIND' : 'READ';

    telemetry.innerHTML = [
      `<span>time ${new Date().toISOString().slice(11, 19)}</span>`,
      `<span>frame ${frame}</span>`,
      `<span>signal ${signal}%</span>`,
      `<span>sync drift ${drift}</span>`,
      `<span>channel ${channel}</span>`,
      `<span>tape head ${tapeHead}</span>`
    ].join('');
  }

  window.addEventListener('resize', () => {
    applyActiveSource();
    if (state.isVisible) {
      playActive();
    }
  });

  applyActiveSource();
  window.setInterval(updateTelemetry, 850);
  updateTelemetry();
  window.setTimeout(() => {
    introScreen?.classList.add('intro-screen--hidden');
  }, 2000);
  window.setTimeout(reveal, state.sequence[0].startDelayMs);

  window.BeaconVideo = {
    reveal,
    rewind,
    setSequence,
    setActiveById,
    addOverlay,
    removeOverlay,
    handleCommand,
    getState
  };

  // Future hook: sequence dashboard can coordinate terminal beats, video cuts,
  // and overlay layers by calling BeaconVideo.setSequence/addOverlay.
})();
