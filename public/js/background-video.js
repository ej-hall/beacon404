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
    audioEnabled: false,
    overlayHooks: new Map()
  };

  const stage = document.querySelector('#videoStage');
  const video = document.querySelector('#backgroundVideo');
  const audioToggle = document.querySelector('#videoAudioToggle');
  const rewindButton = document.querySelector('#videoRewind');
  const overlayLayer = document.querySelector('#videoOverlayLayer');

  function isVerticalViewport() {
    return window.innerHeight > window.innerWidth;
  }

  function sourceFor(item) {
    if (isVerticalViewport()) {
      return item.verticalSrc || item.horizontalSrc;
    }
    return item.horizontalSrc || item.verticalSrc;
  }

  function setButtonState() {
    if (!audioToggle || !video) {
      return;
    }

    audioToggle.textContent = state.audioEnabled ? 'audio on' : 'audio off';
    video.muted = !state.audioEnabled;
    video.volume = state.audioEnabled ? 0.55 : 0;
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

    video.muted = item.muted !== false || !state.audioEnabled;
    video.playsInline = true;
    setButtonState();
  }

  function playActive() {
    if (!video) {
      return;
    }

    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === 'function') {
      playAttempt.catch(() => {
        video.muted = true;
        state.audioEnabled = false;
        setButtonState();
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
      audioEnabled: state.audioEnabled,
      visible: state.isVisible,
      orientation: isVerticalViewport() ? 'vertical' : 'horizontal'
    };
  }

  if (video) {
    video.addEventListener('ended', rewind);
  }

  if (audioToggle) {
    audioToggle.addEventListener('click', () => {
      state.audioEnabled = !state.audioEnabled;
      setButtonState();
      if (state.audioEnabled) {
        playActive();
      }
    });
  }

  if (rewindButton) {
    rewindButton.addEventListener('click', rewind);
  }

  window.addEventListener('resize', () => {
    applyActiveSource();
    if (state.isVisible) {
      playActive();
    }
  });

  applyActiveSource();
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
