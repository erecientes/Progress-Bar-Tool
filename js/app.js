/**
 * app.js
 * Main application controller: manages Task Increment mode and Countdown Timer mode,
 * volume slider with loud audio output, UI animations, and keyboard shortcuts.
 */
document.addEventListener('DOMContentLoaded', () => {
  const stateMgr = new StateManager();
  const sound = new SoundController();
  const confetti = new ConfettiController('confettiCanvas');

  // DOM Elements - Mode Switcher
  const taskModeBtn = document.getElementById('taskModeBtn');
  const timerModeBtn = document.getElementById('timerModeBtn');
  const taskControlsArea = document.getElementById('taskControlsArea');
  const timerControlsArea = document.getElementById('timerControlsArea');
  const headerSubtitle = document.getElementById('headerSubtitle');

  // DOM Elements - Shell & Widget Mode
  const trackerCard = document.getElementById('trackerCard');
  const mainContainer = document.getElementById('mainContainer');
  const widgetToggleBtn = document.getElementById('widgetToggleBtn');
  const widgetIcon = document.getElementById('widgetIcon');
  const pipBtn = document.getElementById('pipBtn');
  const dynamicFavicon = document.getElementById('dynamicFavicon');

  // DOM Elements - Header & Audio
  const goalTitleInput = document.getElementById('goalTitleInput');
  const soundToggle = document.getElementById('soundToggle');
  const volumeIcon = document.getElementById('volumeIcon');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeLevelText = document.getElementById('volumeLevelText');
  const themeToggle = document.getElementById('themeToggle');
  const resetBtn = document.getElementById('resetBtn');
  const resetConfirmModal = document.getElementById('resetConfirmModal');
  const cancelResetBtn = document.getElementById('cancelResetBtn');
  const confirmResetBtn = document.getElementById('confirmResetBtn');

  // DOM Elements - Display & Progress
  const completionBanner = document.getElementById('completionBanner');
  const bannerTitle = document.getElementById('bannerTitle');
  const bannerDesc = document.getElementById('bannerDesc');
  const percentageDisplayWrapper = document.getElementById('percentageDisplayWrapper');
  const percentageNumber = document.getElementById('percentageNumber');
  const timerClockDisplay = document.getElementById('timerClockDisplay');
  const statusBadge = document.getElementById('statusBadge');
  const statusText = document.getElementById('statusText');
  const barFill = document.getElementById('barFill');
  const milestoneNodes = document.querySelectorAll('.milestone-node');

  // DOM Elements - Metrics Strip
  const metricLabel1 = document.getElementById('metricLabel1');
  const metricValue1 = document.getElementById('metricValue1');
  const metricLabel2 = document.getElementById('metricLabel2');
  const metricValue2 = document.getElementById('metricValue2');
  const metricLabel3 = document.getElementById('metricLabel3');
  const metricValue3 = document.getElementById('metricValue3');

  // DOM Elements - Task Mode Controls
  const customIncrementInput = document.getElementById('customIncrementInput');
  const totalTasksHelper = document.getElementById('totalTasksHelper');
  const presetChips = document.querySelectorAll('.preset-chip:not(.timer-preset)');
  const actionArea = document.getElementById('actionArea');
  const completeBtn = document.getElementById('completeBtn');
  const completeBtnText = document.getElementById('completeBtnText');
  const undoBtn = document.getElementById('undoBtn');
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');
  const historyHeader = document.getElementById('historyHeader');
  const historyArrow = document.getElementById('historyArrow');

  // DOM Elements - Timer Mode Controls
  const timerPresets = document.querySelectorAll('.timer-preset');
  const timerMinutesInput = document.getElementById('timerMinutesInput');
  const timerSecondsInput = document.getElementById('timerSecondsInput');
  const timerToggleBtn = document.getElementById('timerToggleBtn');
  const timerBtnText = document.getElementById('timerBtnText');
  const timerPlayIcon = document.getElementById('timerPlayIcon');
  const timerResetBtn = document.getElementById('timerResetBtn');

  // --- AUDIO SETUP ---
  const initialVolume = stateMgr.state.volume !== undefined ? stateMgr.state.volume : 80;
  volumeSlider.value = initialVolume;
  volumeLevelText.textContent = `${initialVolume}%`;
  sound.setVolume(initialVolume);
  sound.setEnabled(stateMgr.state.soundEnabled);

  // --- DYNAMIC FAVICON GENERATOR ---
  const favCanvas = document.createElement('canvas');
  favCanvas.width = 32;
  favCanvas.height = 32;
  const favCtx = favCanvas.getContext('2d');

  let rainbowGradient = null;
  function getRainbowGradient() {
    if (!rainbowGradient) {
      if (typeof favCtx.createConicGradient === 'function') {
        rainbowGradient = favCtx.createConicGradient(-Math.PI / 2, 16, 16);
        rainbowGradient.addColorStop(0, '#ff0055');    // Rose Red
        rainbowGradient.addColorStop(0.17, '#ff5500'); // Vibrant Orange
        rainbowGradient.addColorStop(0.33, '#ffcc00'); // Bright Gold
        rainbowGradient.addColorStop(0.50, '#00e676'); // Neon Green
        rainbowGradient.addColorStop(0.67, '#00b0ff'); // Electric Blue
        rainbowGradient.addColorStop(0.83, '#9d4edd'); // Electric Purple
        rainbowGradient.addColorStop(1.0, '#ff0055');  // Seamless loop to Rose Red
      } else {
        rainbowGradient = favCtx.createLinearGradient(0, 0, 32, 32);
        rainbowGradient.addColorStop(0, '#ff0055');
        rainbowGradient.addColorStop(0.25, '#ffcc00');
        rainbowGradient.addColorStop(0.5, '#00e676');
        rainbowGradient.addColorStop(0.75, '#00b0ff');
        rainbowGradient.addColorStop(1, '#9d4edd');
      }
    }
    return rainbowGradient;
  }

  function updateFavicon(pct) {
    if (!dynamicFavicon) return;
    favCtx.clearRect(0, 0, 32, 32);

    // Dark circle base
    favCtx.beginPath();
    favCtx.arc(16, 16, 14, 0, 2 * Math.PI);
    favCtx.fillStyle = '#0f172a';
    favCtx.fill();

    // Muted background track
    favCtx.beginPath();
    favCtx.arc(16, 16, 10.5, 0, 2 * Math.PI);
    favCtx.lineWidth = 3.5;
    favCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    favCtx.stroke();

    // Active rainbow progress arc
    const clampedPct = Math.min(100, Math.max(0, pct));
    if (clampedPct > 0) {
      favCtx.beginPath();
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (Math.PI * 2 * (clampedPct / 100));
      favCtx.arc(16, 16, 10.5, startAngle, endAngle);
      favCtx.lineWidth = 3.5;
      favCtx.strokeStyle = getRainbowGradient();
      favCtx.lineCap = 'round';
      favCtx.stroke();
    }

    dynamicFavicon.href = favCanvas.toDataURL('image/png');
  }

  // --- DYNAMIC COMPACTNESS / MICRO-WIDGET HANDLER ---
  function updateWidgetCompactness(cardEl) {
    if (!cardEl) return;
    const win = cardEl.ownerDocument.defaultView || window;
    const winW = win.innerWidth;
    const winH = win.innerHeight;

    const inWidgetOrPopout = stateMgr.state.widgetMode || document.body.classList.contains('popout-window');

    if (!inWidgetOrPopout) {
      cardEl.classList.remove('micro-mode', 'nano-mode', 'dock-row');
      return;
    }

    // Mini Mode activates only when the window/viewport is too small for full widget mode
    const isMicro = winW <= 330 || winH <= 260;
    const isNano = winH <= 125 && winW < 420;
    const isDockRow = winW >= 420 && winH <= 140;

    cardEl.classList.toggle('micro-mode', isMicro);
    cardEl.classList.toggle('nano-mode', isNano);
    cardEl.classList.toggle('dock-row', isDockRow);
  }

  // --- WIDGET MODE HANDLER ---
  function applyWidgetMode(isWidget) {
    if (!trackerCard || !mainContainer) return;
    trackerCard.classList.toggle('widget-mode', isWidget);
    mainContainer.classList.toggle('widget-mode', isWidget);
    if (widgetToggleBtn) {
      widgetToggleBtn.classList.toggle('active', isWidget);
      widgetToggleBtn.title = isWidget ? 'Expand to full view' : 'Toggle compact widget mode';
    }
    if (widgetIcon) {
      widgetIcon.innerHTML = isWidget
        ? '<path d="M15 3h6v6m0-6L14 10M9 21H3v-6m0 6l7-7"></path>'
        : '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>';
    }
    updateWidgetCompactness(trackerCard);
  }

  // Observe window resize & viewport changes
  window.addEventListener('resize', () => {
    updateWidgetCompactness(trackerCard);
  });

  if (typeof ResizeObserver !== 'undefined' && document.body) {
    const bodyResizeObserver = new ResizeObserver(() => {
      updateWidgetCompactness(trackerCard);
    });
    bodyResizeObserver.observe(document.body);
  }

  // --- VOLUME ICON HANDLER ---
  function updateVolumeIcon(enabled, volume) {
    if (!volumeIcon) return;
    if (!enabled || volume <= 0) {
      volumeIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      `;
    } else {
      volumeIcon.innerHTML = `
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
      `;
    }
  }

  // Standalone Popout Window Mode (?popout=1)
  const urlParams = new URLSearchParams(window.location.search);
  const isPopoutWindow = urlParams.get('popout') === '1';
  if (isPopoutWindow) {
    document.body.classList.add('popout-window');
    applyWidgetMode(true);
    if (pipBtn) pipBtn.style.display = 'none';
    updateWidgetCompactness(trackerCard);
  } else {
    // Apply initial widget mode
    applyWidgetMode(!!stateMgr.state.widgetMode);
  }

  // --- ANIMATION & TIMER STATE ---
  let displayedPercent = 0;
  let counterAnimationId = null;
  let timerAnimFrame = null;
  let timerStartTime = null;
  let timerElapsedBeforePause = 0;
  let lastTimerSecLogged = -1;

  // Smooth odometer counter animation
  function animateNumber(target) {
    cancelAnimationFrame(counterAnimationId);
    const start = displayedPercent;
    const duration = 350;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - (1 - progress) * (1 - progress);
      const current = start + (target - start) * ease;
      displayedPercent = current;
      percentageNumber.textContent = current.toFixed(1);

      if (progress < 1) {
        counterAnimationId = requestAnimationFrame(update);
      } else {
        displayedPercent = target;
        percentageNumber.textContent = target.toFixed(1);
      }
    }
    counterAnimationId = requestAnimationFrame(update);
  }

  // Floating toast animation (+X% or -X%)
  function spawnFloatingToast(text, isNegative = false) {
    const toast = document.createElement('div');
    toast.className = 'floating-toast';
    toast.textContent = text;
    if (isNegative) {
      toast.style.color = '#ef4444';
      toast.style.textShadow = '0 2px 10px rgba(239, 68, 68, 0.5)';
    }

    const rect = completeBtn.getBoundingClientRect();
    toast.style.left = `${rect.width / 2 - 25}px`;
    toast.style.top = '-15px';

    actionArea.appendChild(toast);
    setTimeout(() => toast.remove(), 1000);
  }

  // Format seconds to MM:SS or HH:MM:SS
  function formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(s / 3600);
    const minutes = Math.floor((s % 3600) / 60);
    const seconds = s % 60;

    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  // --- RENDER TASK MODE ---
  function renderTaskMode() {
    const s = stateMgr.state;
    barFill.classList.remove('timer-mode');

    // Display toggle
    percentageDisplayWrapper.style.display = 'flex';
    timerClockDisplay.style.display = 'none';
    taskControlsArea.style.display = 'block';
    timerControlsArea.style.display = 'none';
    headerSubtitle.textContent = 'Task Increment Mode • Progress autosaved';

    // Metrics Strip Labels & Values
    metricLabel1.textContent = 'Tasks Completed';
    metricValue1.textContent = s.tasksCompleted;

    const pct = Math.min(Math.max(s.currentPercent, 0), 100);
    const rem = Math.max(0, 100 - pct);
    metricLabel2.textContent = 'Progress Remaining';
    metricValue2.textContent = `${rem.toFixed(1)}%`;

    metricLabel3.textContent = 'Est. Tasks Remaining';
    const cleanRem = Math.round(rem * 100) / 100;
    if (s.increment > 0 && cleanRem > 0.001) {
      const fullTasks = Math.floor(cleanRem / s.increment);
      const remainderPct = Math.round((cleanRem - fullTasks * s.increment) * 100) / 100;
      const canSnap = (fullTasks >= 2) || (fullTasks === 1 && s.currentPercent > 0);
      if (remainderPct <= 0.001 || (canSnap && remainderPct <= 0.105 && remainderPct <= s.increment * 0.05)) {
        metricValue3.textContent = fullTasks;
      } else {
        metricValue3.textContent = fullTasks + 1;
      }
    } else {
      metricValue3.textContent = '0';
    }

    // Progress bar fill & tip bead
    barFill.style.width = `${pct}%`;
    barFill.classList.toggle('has-progress', pct >= 3);
    animateNumber(pct);

    // Status Badge & Banner
    statusBadge.classList.remove('completed', 'in-progress', 'running', 'paused');
    if (pct >= 100) {
      statusBadge.classList.add('completed');
      statusText.textContent = 'Completed!';
      bannerTitle.textContent = '🎉 Goal Achieved! 100% Complete';
      bannerDesc.textContent = 'All tasks completed for this overarching milestone.';
      completionBanner.classList.add('show');
      completeBtn.disabled = true;
      completeBtnText.textContent = 'Goal 100% Complete!';
    } else {
      if (pct > 0) {
        statusBadge.classList.add('in-progress');
        statusText.textContent = 'In Progress';
      } else {
        statusText.textContent = 'Ready to Start';
      }
      completionBanner.classList.remove('show');
      completeBtn.disabled = false;
      completeBtnText.textContent = `Complete Task (+${s.increment}%)`;
    }

    // Milestones
    milestoneNodes.forEach((node) => {
      const step = parseFloat(node.getAttribute('data-step'));
      node.classList.toggle('passed', pct >= step);
    });

    // Undo & Reset buttons
    undoBtn.disabled = s.history.length === 0;
    const hasTaskProgress = pct > 0 || s.tasksCompleted > 0 || s.history.length > 0;
    resetBtn.disabled = !hasTaskProgress;
    resetBtn.title = hasTaskProgress ? 'Reset current progress' : 'No progress to reset';

    // Increment inputs & presets (only update text input if not actively typing)
    if (document.activeElement !== customIncrementInput) {
      customIncrementInput.value = s.increment;
    }
    presetChips.forEach((chip) => {
      const val = parseFloat(chip.getAttribute('data-val'));
      chip.classList.toggle('active', Math.abs(val - s.increment) < 0.05);
    });

    // History Log
    renderHistory(s.history);

    // Live Tab Update
    const titleText = s.goalTitle && s.goalTitle.trim().length > 0 ? s.goalTitle.trim() : 'Project Milestone';
    if (pct >= 100) {
      document.title = `(100% Done!) ${titleText}`;
    } else {
      document.title = `(${pct.toFixed(0)}%) ${titleText}`;
    }
    updateFavicon(pct);
  }

  // --- RENDER TIMER MODE ---
  function renderTimerMode() {
    const s = stateMgr.state;
    barFill.classList.add('timer-mode');

    // Display toggle
    percentageDisplayWrapper.style.display = 'none';
    timerClockDisplay.style.display = 'block';
    taskControlsArea.style.display = 'none';
    timerControlsArea.style.display = 'block';
    headerSubtitle.textContent = 'Countdown Timer Mode • Live tracking';

    const total = s.timerTotalSeconds;
    const remaining = s.timerRemainingSeconds;
    const elapsed = Math.max(0, total - remaining);
    const progressPct = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;

    // Clock
    timerClockDisplay.textContent = formatTime(remaining);

    // Metrics Strip Labels & Values
    metricLabel1.textContent = 'Time Elapsed';
    metricValue1.textContent = formatTime(elapsed);

    metricLabel2.textContent = 'Time Remaining';
    metricValue2.textContent = formatTime(remaining);

    metricLabel3.textContent = 'Total Duration';
    metricValue3.textContent = formatTime(total);

    // Progress bar fill, shimmer state & tip bead
    barFill.style.width = `${progressPct}%`;
    barFill.classList.toggle('has-progress', progressPct >= 3);
    barFill.classList.toggle('timer-running', !!s.timerRunning);

    // Milestones
    milestoneNodes.forEach((node) => {
      const step = parseFloat(node.getAttribute('data-step'));
      node.classList.toggle('passed', progressPct >= step);
    });

    // Status Badge & Banner
    statusBadge.classList.remove('completed', 'in-progress', 'running', 'paused');
    if (remaining <= 0) {
      statusBadge.classList.add('completed');
      statusText.textContent = 'Time Up!';
      bannerTitle.textContent = "⏰ Time's Up! Countdown Complete";
      bannerDesc.textContent = 'The countdown timer has reached zero.';
      completionBanner.classList.add('show');
      timerToggleBtn.disabled = true;
      timerBtnText.textContent = 'Timer Complete';
    } else if (s.timerRunning) {
      statusBadge.classList.add('running');
      statusText.textContent = 'Counting Down';
      completionBanner.classList.remove('show');
      timerToggleBtn.disabled = false;
      timerBtnText.textContent = 'Pause Timer';
      timerPlayIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
    } else {
      if (elapsed > 0) {
        statusBadge.classList.add('paused');
        statusText.textContent = 'Paused';
      } else {
        statusText.textContent = 'Ready';
      }
      completionBanner.classList.remove('show');
      timerToggleBtn.disabled = false;
      timerBtnText.textContent = elapsed > 0 ? 'Resume Timer' : 'Start Countdown';
      timerPlayIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
    }

    // Sync numeric duration inputs (when not actively focused by user)
    if (document.activeElement !== timerMinutesInput && document.activeElement !== timerSecondsInput) {
      timerMinutesInput.value = Math.floor(total / 60);
      timerSecondsInput.value = total % 60;
    }

    // Sync timer preset chips active state
    timerPresets.forEach((chip) => {
      const m = parseInt(chip.getAttribute('data-mins'), 10);
      chip.classList.toggle('active', m * 60 === total);
    });

    // Sync timer reset button and header reset button
    const hasTimerProgress = remaining < total || !!s.timerRunning;
    resetBtn.disabled = !hasTimerProgress;
    resetBtn.title = hasTimerProgress ? 'Reset countdown timer' : 'Timer at default duration';
    timerResetBtn.disabled = !hasTimerProgress;

    // Live Tab Update
    const titleText = s.goalTitle && s.goalTitle.trim().length > 0 ? s.goalTitle.trim() : 'Countdown Timer';
    if (remaining <= 0) {
      document.title = `(00:00 - Time's Up!) ${titleText}`;
    } else {
      document.title = `(${formatTime(remaining)}) ${titleText}`;
    }
    updateFavicon(progressPct);
  }

  function renderHistory(history) {
    const list = Array.isArray(history) ? history : [];
    historyCount.textContent = list.length;
    historyList.textContent = '';

    if (list.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.color = 'var(--text-muted)';
      emptyMsg.style.fontSize = '0.8rem';
      emptyMsg.style.padding = '0.5rem';
      emptyMsg.textContent = 'No tasks logged yet. Complete a task above to begin.';
      historyList.appendChild(emptyMsg);
      return;
    }

    const fragment = document.createDocumentFragment();
    list.slice(-15).reverse().forEach((item) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'history-item';

      const taskSpan = document.createElement('span');
      taskSpan.style.fontWeight = '600';
      taskSpan.textContent = `Task #${Number.isFinite(item.taskNumber) ? item.taskNumber : 0}`;

      const deltaDiv = document.createElement('div');

      const deltaSpan = document.createElement('span');
      deltaSpan.className = 'history-delta';
      const deltaVal = Number.isFinite(item.delta) ? item.delta : 0;
      deltaSpan.textContent = `${deltaVal >= 0 ? '+' : ''}${deltaVal}%`;

      const arrowSpan = document.createElement('span');
      arrowSpan.style.color = 'var(--text-muted)';
      arrowSpan.style.margin = '0 4px';
      arrowSpan.textContent = '→';

      const totalSpan = document.createElement('span');
      totalSpan.style.fontFamily = "'JetBrains Mono', monospace";
      totalSpan.style.fontWeight = '700';
      const totalVal = Number.isFinite(item.newTotal) ? item.newTotal : 0;
      totalSpan.textContent = `${totalVal.toFixed(1)}%`;

      deltaDiv.appendChild(deltaSpan);
      deltaDiv.appendChild(arrowSpan);
      deltaDiv.appendChild(totalSpan);

      const timeSpan = document.createElement('span');
      timeSpan.className = 'history-time';
      timeSpan.textContent = typeof item.timestamp === 'string' ? item.timestamp.slice(0, 30) : '';

      itemDiv.appendChild(taskSpan);
      itemDiv.appendChild(deltaDiv);
      itemDiv.appendChild(timeSpan);
      fragment.appendChild(itemDiv);
    });

    historyList.appendChild(fragment);
  }

  // Master render router
  function render() {
    if (document.activeElement !== goalTitleInput) {
      goalTitleInput.value = stateMgr.state.goalTitle;
    }
    document.documentElement.setAttribute('data-theme', stateMgr.state.theme);

    // Sync theme to Picture-in-Picture window if active
    if (pipWindowRef && !pipWindowRef.closed) {
      pipWindowRef.document.documentElement.setAttribute('data-theme', stateMgr.state.theme);
    }

    soundToggle.classList.toggle('active', stateMgr.state.soundEnabled && stateMgr.state.volume > 0);
    updateVolumeIcon(stateMgr.state.soundEnabled, stateMgr.state.volume);

    taskModeBtn.classList.toggle('active', stateMgr.state.mode === 'task');
    timerModeBtn.classList.toggle('active', stateMgr.state.mode === 'timer');

    if (stateMgr.state.mode === 'task') {
      renderTaskMode();
    } else {
      renderTimerMode();
    }
  }

  // --- TASK MODE HANDLERS ---

  function handleCompleteTask() {
    const result = stateMgr.completeTask();
    if (!result) return;

    spawnFloatingToast(`+${result.delta}%`);

    if (result.isComplete) {
      sound.playCelebration();
      confetti.launch();
    } else {
      // Exponential pitch ascension: stays grounded early on, then accelerates into an exhilarating crescendo toward 100%
      const currentPct = typeof result.next === 'number' ? result.next : 0;
      const progressRatio = Math.max(0, Math.min(1, currentPct / 100));
      const pitchMultiplier = Math.pow(1.5, Math.pow(progressRatio, 1.8));
      sound.playClick(pitchMultiplier);
    }

    render();
  }

  function handleUndoTask() {
    const undone = stateMgr.undoTask();
    if (!undone) return;

    sound.playUndo();
    spawnFloatingToast(`-${undone.delta}%`, true);
    render();
  }

  function handleReset() {
    if (stateMgr.state.mode === 'task') {
      if (stateMgr.state.currentPercent === 0 && stateMgr.state.tasksCompleted === 0) return;
      if (resetConfirmModal) {
        sound.playOriginalTaskSound();
        resetConfirmModal.classList.add('show');
      }
    } else {
      pauseTimer();
      stateMgr.resetTimer();
      sound.playReset();
      render();
    }
  }

  // --- TIMER MODE ENGINE ---

  let timerHeartbeat = null;

  function updateTimerTick() {
    if (!stateMgr.state.timerRunning) return true;

    const now = performance.now();
    const elapsedCurrentRun = (now - timerStartTime) / 1000;
    const totalElapsed = timerElapsedBeforePause + elapsedCurrentRun;
    const total = stateMgr.state.timerTotalSeconds;
    const remaining = Math.max(0, total - totalElapsed);

    stateMgr.setTimerRemaining(remaining);

    // Continuous, frame-by-frame smooth progress bar fill
    const progressPct = total > 0 ? Math.min(100, Math.max(0, (totalElapsed / total) * 100)) : 0;
    barFill.style.width = `${progressPct}%`;
    barFill.classList.toggle('has-progress', progressPct >= 3);

    // Milestones
    milestoneNodes.forEach((node) => {
      const step = parseFloat(node.getAttribute('data-step'));
      node.classList.toggle('passed', progressPct >= step);
    });

    // Time text updates
    timerClockDisplay.textContent = formatTime(remaining);
    metricValue1.textContent = formatTime(totalElapsed);
    metricValue2.textContent = formatTime(remaining);

    // Live Tab Update throttled to once per second
    const secFloor = Math.floor(remaining);
    if (secFloor !== lastTimerSecLogged) {
      lastTimerSecLogged = secFloor;
      const titleText = stateMgr.state.goalTitle && stateMgr.state.goalTitle.trim().length > 0
        ? stateMgr.state.goalTitle.trim()
        : 'Countdown Timer';
      document.title = remaining <= 0 ? `(00:00 - Time's Up!) ${titleText}` : `(${formatTime(remaining)}) ${titleText}`;
      updateFavicon(progressPct);
    }

    if (remaining <= 0) {
      cancelAnimationFrame(timerAnimFrame);
      clearInterval(timerHeartbeat);
      timerHeartbeat = null;
      stateMgr.setTimerRunning(false);
      sound.playTimerComplete();
      confetti.launch();
      renderTimerMode();
      return true;
    }
    return false;
  }

  function runTimerLoop() {
    if (!stateMgr.state.timerRunning) return;
    const isFinished = updateTimerTick();
    if (!isFinished && stateMgr.state.timerRunning) {
      timerAnimFrame = requestAnimationFrame(runTimerLoop);
    }
  }

  function startTimer() {
    if (stateMgr.state.timerRemainingSeconds <= 0) {
      stateMgr.resetTimer();
    }

    stateMgr.setTimerRunning(true);
    timerStartTime = performance.now();
    timerElapsedBeforePause = stateMgr.state.timerTotalSeconds - stateMgr.state.timerRemainingSeconds;

    sound.playOriginalTaskSound();

    cancelAnimationFrame(timerAnimFrame);
    clearInterval(timerHeartbeat);

    // Background interval heartbeat keeps live tab title, favicon, and chime firing on time even when tab is hidden
    timerHeartbeat = setInterval(() => {
      if (stateMgr.state.timerRunning) {
        updateTimerTick();
      }
    }, 250);

    timerAnimFrame = requestAnimationFrame(runTimerLoop);
    render();
  }

  function pauseTimer(playAudio = false) {
    cancelAnimationFrame(timerAnimFrame);
    clearInterval(timerHeartbeat);
    timerHeartbeat = null;
    const wasRunning = stateMgr.state.timerRunning;
    stateMgr.setTimerRunning(false);
    if (playAudio && wasRunning) {
      sound.playUndo();
    }
    render();
  }

  function toggleTimer() {
    if (stateMgr.state.timerRunning) {
      pauseTimer(true);
    } else {
      startTimer();
    }
  }

  // Set timer preset duration in minutes
  function setTimerPresetMinutes(minutes) {
    pauseTimer();
    const secs = minutes * 60;
    stateMgr.setTimerDuration(secs);
    timerMinutesInput.value = minutes;
    timerSecondsInput.value = 0;

    timerPresets.forEach((chip) => {
      const m = parseInt(chip.getAttribute('data-mins'), 10);
      chip.classList.toggle('active', m === minutes);
    });

    sound.playOriginalTaskSound();
    render();
  }

  function updateCustomTimerInput() {
    pauseTimer();
    const mins = parseInt(timerMinutesInput.value, 10) || 0;
    const secs = parseInt(timerSecondsInput.value, 10) || 0;
    const totalSecs = Math.max(1, mins * 60 + secs);

    stateMgr.setTimerDuration(totalSecs);

    timerPresets.forEach((chip) => {
      const m = parseInt(chip.getAttribute('data-mins'), 10);
      chip.classList.toggle('active', m * 60 === totalSecs);
    });

    render();
  }

  // --- EVENT LISTENERS ---

  // Mode Switchers
  taskModeBtn.addEventListener('click', () => {
    if (stateMgr.state.mode !== 'task') {
      pauseTimer();
      stateMgr.setMode('task');
      sound.playOriginalTaskSound();
      render();
    }
  });

  timerModeBtn.addEventListener('click', () => {
    if (stateMgr.state.mode !== 'timer') {
      stateMgr.setMode('timer');
      sound.playOriginalTaskSound();
      render();
    }
  });

  // Widget Mode Toggle Button
  if (widgetToggleBtn) {
    widgetToggleBtn.addEventListener('click', () => {
      const isCurrentlyWidget = trackerCard.classList.contains('widget-mode');
      const nextVal = !isCurrentlyWidget;
      stateMgr.setWidgetMode(nextVal);
      applyWidgetMode(nextVal);
      sound.playOriginalTaskSound();
    });
  }

  // Volume Slider with debounced test tone preview
  let volumeDebounceTimer = null;
  volumeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    volumeLevelText.textContent = `${val}%`;
    sound.setVolume(val);
    stateMgr.setVolume(val);

    // Auto-unmute if slider moved above 0 while muted
    if (val > 0 && !stateMgr.state.soundEnabled) {
      stateMgr.setSoundEnabled(true);
      sound.setEnabled(true);
    }
    updateVolumeIcon(stateMgr.state.soundEnabled, val);
    soundToggle.classList.toggle('active', stateMgr.state.soundEnabled && val > 0);

    clearTimeout(volumeDebounceTimer);
    volumeDebounceTimer = setTimeout(() => {
      sound.playTestTone();
    }, 120);
  });

  // Sound Mute Toggle
  soundToggle.addEventListener('click', () => {
    const nextVal = !stateMgr.state.soundEnabled;
    stateMgr.setSoundEnabled(nextVal);
    sound.setEnabled(nextVal);
    updateVolumeIcon(nextVal, stateMgr.state.volume);
    soundToggle.classList.toggle('active', nextVal && stateMgr.state.volume > 0);
    if (nextVal) sound.playClick(1);
  });

  // Theme Toggle
  themeToggle.addEventListener('click', () => {
    const nextTheme = stateMgr.state.theme === 'dark' ? 'light' : 'dark';
    stateMgr.setTheme(nextTheme);
    sound.playOriginalTaskSound();
    render();
  });

  // Reset
  resetBtn.addEventListener('click', handleReset);

  // Goal Title
  goalTitleInput.addEventListener('input', (e) => {
    stateMgr.setTitle(e.target.value);
  });

  // Task Mode Controls
  completeBtn.addEventListener('click', handleCompleteTask);
  undoBtn.addEventListener('click', handleUndoTask);

  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const val = parseFloat(chip.getAttribute('data-val'));
      stateMgr.setIncrement(val);
      totalTasksHelper.value = '';
      sound.playOriginalTaskSound();
      render();
    });
  });

  customIncrementInput.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      if (val > 100) {
        val = 100;
        e.target.value = '100';
      }
      stateMgr.setIncrement(val);
      totalTasksHelper.value = '';
      render();
    }
  });

  customIncrementInput.addEventListener('blur', () => {
    const val = parseFloat(customIncrementInput.value);
    if (isNaN(val) || val <= 0) {
      customIncrementInput.value = stateMgr.state.increment;
    } else if (val > 100) {
      customIncrementInput.value = '100';
      stateMgr.setIncrement(100);
      render();
    }
  });

  totalTasksHelper.addEventListener('input', (e) => {
    const total = parseInt(e.target.value, 10);
    if (!isNaN(total) && total > 0) {
      const computed = Math.round((100 / total) * 100) / 100;
      stateMgr.setIncrement(computed);
      customIncrementInput.value = computed;
      render();
    }
  });

  // Milestone direct jumps in Task Mode
  milestoneNodes.forEach((node) => {
    node.addEventListener('click', () => {
      if (stateMgr.state.mode !== 'task') return;
      const targetStep = parseFloat(node.getAttribute('data-step'));
      const jump = stateMgr.jumpToMilestone(targetStep);
      if (!jump) return;

      if (jump.delta > 0) {
        spawnFloatingToast(`+${jump.delta}%`);
        if (jump.isComplete) {
          sound.playCelebration();
          confetti.launch();
        } else {
          sound.playClick();
        }
      } else {
        sound.playUndo();
      }
      render();
    });
  });



  // Prime audio context and decode authentic chime on first user interaction
  const primeAudio = () => {
    sound.init();
    window.removeEventListener('pointerdown', primeAudio);
    window.removeEventListener('keydown', primeAudio);
  };
  window.addEventListener('pointerdown', primeAudio, { once: true });
  window.addEventListener('keydown', primeAudio, { once: true });

  // History Drawer toggle
  let historyExpanded = true;
  historyHeader.addEventListener('click', () => {
    historyExpanded = !historyExpanded;
    historyList.style.display = historyExpanded ? 'flex' : 'none';
    historyArrow.textContent = historyExpanded ? '▼' : '▶';
  });

  // Timer Mode Controls
  timerToggleBtn.addEventListener('click', toggleTimer);
  timerResetBtn.addEventListener('click', () => {
    pauseTimer();
    stateMgr.resetTimer();
    sound.playReset();
    render();
  });

  timerPresets.forEach((chip) => {
    chip.addEventListener('click', () => {
      const mins = parseInt(chip.getAttribute('data-mins'), 10);
      setTimerPresetMinutes(mins);
    });
  });

  timerMinutesInput.addEventListener('input', updateCustomTimerInput);
  timerSecondsInput.addEventListener('input', updateCustomTimerInput);

  // --- PICTURE-IN-PICTURE / STANDALONE MINI POP-OUT WINDOW ---
  let pipWindowRef = null;

  async function togglePictureInPicture() {
    // If PiP is already open, close it to restore to main tab
    if (pipWindowRef && !pipWindowRef.closed) {
      pipWindowRef.close();
      return;
    }

    // Option A: Document Picture-in-Picture API (Chrome 111+, Edge 111+)
    if ('documentPictureInPicture' in window) {
      try {
        const pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 440,
          height: 400
        });
        pipWindowRef = pipWindow;

        // Copy all stylesheets to PiP window
        [...document.styleSheets].forEach((styleSheet) => {
          try {
            const cssRules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
            const style = document.createElement('style');
            style.textContent = cssRules;
            pipWindow.document.head.appendChild(style);
          } catch (e) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = styleSheet.href;
            pipWindow.document.head.appendChild(link);
          }
        });

        // Copy fonts and font links
        document.querySelectorAll('link[rel*="font"], link[rel="preconnect"]').forEach((el) => {
          pipWindow.document.head.appendChild(el.cloneNode(true));
        });

        // Set title and body styling in PiP window
        pipWindow.document.title = document.title;
        pipWindow.document.documentElement.setAttribute('data-theme', stateMgr.state.theme);
        pipWindow.document.body.className = 'popout-window';
        pipWindow.document.body.style.background = 'var(--bg)';
        pipWindow.document.body.style.margin = '0';
        pipWindow.document.body.style.boxSizing = 'border-box';
        pipWindow.document.body.style.overflow = 'hidden';

        // Placeholder in main window
        const placeholder = document.createElement('div');
        placeholder.id = 'pipPlaceholder';
        placeholder.className = 'pip-placeholder';
        placeholder.innerHTML = `
          <div class="pip-placeholder-title">📌 Tracker Popped Out to Mini Window</div>
          <p style="font-size: 0.85rem; margin-top: 0.25rem;">Floating on your desktop. Close the floating window or click below to restore.</p>
          <button class="pip-placeholder-btn" id="restorePipBtn">Restore to Main Tab</button>
        `;

        trackerCard.parentNode.insertBefore(placeholder, trackerCard);
        pipWindow.document.body.appendChild(trackerCard);

        // Remember previous state before opening PiP
        const prePipWidgetMode = stateMgr.state.widgetMode;

        // Enter compact widget mode in PiP for ultra-sleek view
        stateMgr.setWidgetMode(true);
        applyWidgetMode(true);
        if (pipBtn) pipBtn.classList.add('active');

        // Dynamic compactness on PiP resize
        const onPipResize = () => {
          updateWidgetCompactness(trackerCard);
        };
        pipWindow.addEventListener('resize', onPipResize);
        onPipResize();

        placeholder.querySelector('#restorePipBtn').addEventListener('click', () => {
          pipWindow.close();
        });

        // Return card to main tab when PiP window closes
        pipWindow.addEventListener('pagehide', () => {
          pipWindow.removeEventListener('resize', onPipResize);
          if (placeholder.parentNode) {
            placeholder.parentNode.insertBefore(trackerCard, placeholder);
            placeholder.remove();
          }
          pipWindowRef = null;
          if (pipBtn) pipBtn.classList.remove('active');
          stateMgr.setWidgetMode(prePipWidgetMode);
          applyWidgetMode(prePipWidgetMode);
          updateWidgetCompactness(trackerCard);
        });

        return;
      } catch (err) {
        console.warn('Document Picture-in-Picture failed, falling back to popup window:', err);
      }
    }

    // Option B: Standard Popup Window Fallback
    const popoutUrl = new URL(window.location.href);
    popoutUrl.searchParams.set('popout', '1');
    const popup = window.open(
      popoutUrl.toString(),
      'ProgressTrackerPopout',
      'width=440,height=400,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
    if (popup) {
      popup.opener = null;
      popup.focus();
    }
  }

  if (pipBtn) {
    pipBtn.addEventListener('click', () => {
      sound.playOriginalTaskSound();
      togglePictureInPicture();
    });
  }

  // --- RESET CONFIRMATION MODAL LISTENERS (PiP & Main Window) ---
  if (cancelResetBtn && resetConfirmModal) {
    cancelResetBtn.addEventListener('click', () => {
      sound.playOriginalTaskSound();
      resetConfirmModal.classList.remove('show');
    });
  }

  if (confirmResetBtn && resetConfirmModal) {
    confirmResetBtn.addEventListener('click', () => {
      resetConfirmModal.classList.remove('show');
      stateMgr.resetTaskProgress();
      sound.playReset();
      render();
    });
  }

  if (resetConfirmModal) {
    resetConfirmModal.addEventListener('click', (e) => {
      if (e.target === resetConfirmModal) {
        sound.playOriginalTaskSound();
        resetConfirmModal.classList.remove('show');
      }
    });
  }

  // Cross-tab and popout window state synchronization
  window.addEventListener('storage', (e) => {
    if (e.key === stateMgr.storageKey) {
      stateMgr.state = stateMgr.loadState();
      sound.setVolume(stateMgr.state.volume);
      sound.setEnabled(stateMgr.state.soundEnabled);
      volumeSlider.value = stateMgr.state.volume;
      volumeLevelText.textContent = `${stateMgr.state.volume}%`;
      applyWidgetMode(stateMgr.state.widgetMode);
      render();
    }
  });

  // Re-sync immediately when tab visibility changes
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && stateMgr.state.mode === 'timer' && stateMgr.state.timerRunning) {
      updateTimerTick();
      cancelAnimationFrame(timerAnimFrame);
      timerAnimFrame = requestAnimationFrame(runTimerLoop);
    }
  });

  // Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && resetConfirmModal && resetConfirmModal.classList.contains('show')) {
      sound.playOriginalTaskSound();
      resetConfirmModal.classList.remove('show');
      return;
    }

    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.code === 'Space' || e.code === 'Enter') {
      e.preventDefault();
      if (stateMgr.state.mode === 'task') {
        handleCompleteTask();
      } else {
        toggleTimer();
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
      if (stateMgr.state.mode === 'task') {
        e.preventDefault();
        handleUndoTask();
      }
    }
  });

  // Initialize
  render();
});
