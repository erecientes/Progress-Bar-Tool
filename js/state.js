/**
 * state.js
 * State management for task increment progress tracking and single countdown timer.
 */
class StateManager {
  constructor(storageKey = 'antigravity_goal_progress_data') {
    this.storageKey = storageKey;
    this.defaultState = {
      mode: 'task', // 'task' | 'timer'
      goalTitle: 'Project Milestone',
      currentPercent: 0,
      increment: 10,
      tasksCompleted: 0,
      history: [],
      // Countdown Timer state
      timerTotalSeconds: 300, // 5 min default
      timerRemainingSeconds: 300,
      timerRunning: false,
      // Audio & Theme
      volume: 80,
      soundEnabled: true,
      theme: 'dark',
      widgetMode: false
    };
    this.state = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          // Guard against prototype pollution and validate types
          const clean = {};
          const safeKeys = Object.keys(this.defaultState);
          for (const key of safeKeys) {
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
            if (Object.prototype.hasOwnProperty.call(parsed, key)) {
              clean[key] = parsed[key];
            } else {
              clean[key] = this.defaultState[key];
            }
          }

          return {
            ...this.defaultState,
            mode: ['task', 'timer'].includes(clean.mode) ? clean.mode : this.defaultState.mode,
            goalTitle: typeof clean.goalTitle === 'string' ? clean.goalTitle.slice(0, 100) : this.defaultState.goalTitle,
            currentPercent: typeof clean.currentPercent === 'number' && Number.isFinite(clean.currentPercent) ? Math.max(0, Math.min(100, clean.currentPercent)) : 0,
            increment: typeof clean.increment === 'number' && Number.isFinite(clean.increment) ? Math.max(0.1, Math.min(100, clean.increment)) : 10,
            tasksCompleted: typeof clean.tasksCompleted === 'number' && Number.isFinite(clean.tasksCompleted) ? Math.max(0, Math.floor(clean.tasksCompleted)) : 0,
            history: Array.isArray(clean.history) ? clean.history.slice(-100).filter(h => h && typeof h === 'object').map(h => ({
              taskNumber: Number.isFinite(h.taskNumber) ? Math.max(0, Math.floor(h.taskNumber)) : 0,
              delta: Number.isFinite(h.delta) ? Math.round(h.delta * 100) / 100 : 0,
              newTotal: Number.isFinite(h.newTotal) ? Math.round(h.newTotal * 100) / 100 : 0,
              timestamp: typeof h.timestamp === 'string' ? h.timestamp.slice(0, 30) : ''
            })) : [],
            timerTotalSeconds: typeof clean.timerTotalSeconds === 'number' && Number.isFinite(clean.timerTotalSeconds) ? Math.max(1, Math.min(86400, Math.floor(clean.timerTotalSeconds))) : 300,
            timerRemainingSeconds: typeof clean.timerRemainingSeconds === 'number' && Number.isFinite(clean.timerRemainingSeconds) ? Math.max(0, Math.min(86400, Math.floor(clean.timerRemainingSeconds))) : 300,
            timerRunning: false,
            volume: typeof clean.volume === 'number' && Number.isFinite(clean.volume) ? Math.max(0, Math.min(100, clean.volume)) : 80,
            soundEnabled: Boolean(clean.soundEnabled),
            theme: clean.theme === 'light' ? 'light' : 'dark',
            widgetMode: Boolean(clean.widgetMode)
          };
        }
      }
    } catch (e) {
      console.warn('Could not load state from localStorage:', e);
    }
    return { ...this.defaultState };
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save state to localStorage:', e);
    }
  }

  get() {
    return this.state;
  }

  setMode(mode) {
    if (['task', 'timer'].includes(mode)) {
      this.state.mode = mode;
      this.saveState();
    }
  }

  setTitle(title) {
    if (typeof title === 'string') {
      this.state.goalTitle = title.slice(0, 100);
      this.saveState();
    }
  }

  setIncrement(val) {
    if (val > 0) {
      const clamped = Math.min(100, Math.max(0.1, val));
      this.state.increment = Math.round(clamped * 100) / 100;
      this.saveState();
    }
  }

  setVolume(vol) {
    this.state.volume = Math.max(0, Math.min(100, vol));
    this.saveState();
  }

  setSoundEnabled(enabled) {
    this.state.soundEnabled = !!enabled;
    this.saveState();
  }

  setTheme(theme) {
    this.state.theme = theme;
    this.saveState();
  }

  setWidgetMode(enabled) {
    this.state.widgetMode = !!enabled;
    this.saveState();
  }

  // --- Task Increment Actions ---

  completeTask() {
    if (this.state.currentPercent >= 100) return null;

    const inc = this.state.increment;
    const prev = this.state.currentPercent;
    let next = Math.round((prev + inc) * 100) / 100;

    // Prevent floating-point remainder stall (e.g. 33.3% * 3 = 99.9% requiring an unintended 4th task)
    // Only snap tiny fractional remainders (<= 0.105% and <= 5% of increment) on subsequent steps (prev > 0)
    if (prev > 0 && 100 - next <= 0.105 && (100 - next) <= inc * 0.05) {
      next = 100;
    } else {
      next = Math.min(100, next);
    }
    const actualDelta = Math.round((next - prev) * 100) / 100;

    this.state.currentPercent = next;
    this.state.tasksCompleted += 1;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const entry = {
      taskNumber: this.state.tasksCompleted,
      delta: actualDelta,
      newTotal: next,
      timestamp: timeStr
    };

    this.state.history.push(entry);
    if (this.state.history.length > 100) {
      this.state.history = this.state.history.slice(-100);
    }
    this.saveState();

    return {
      prev,
      next,
      newTotal: next,
      delta: actualDelta,
      isComplete: next >= 100,
      entry
    };
  }

  undoTask() {
    if (this.state.history.length === 0) return null;

    const last = this.state.history.pop();
    this.state.currentPercent = Math.max(0, Math.round((this.state.currentPercent - last.delta) * 100) / 100);
    this.state.tasksCompleted = Math.max(0, this.state.tasksCompleted - 1);
    this.saveState();

    return last;
  }

  resetTaskProgress() {
    this.state.currentPercent = 0;
    this.state.tasksCompleted = 0;
    this.state.history = [];
    this.saveState();
  }

  jumpToMilestone(targetStep) {
    if (typeof targetStep !== 'number' || !Number.isFinite(targetStep)) return null;
    const clampedStep = Math.max(0, Math.min(100, targetStep));
    if (clampedStep === this.state.currentPercent) return null;

    const delta = Math.round((clampedStep - this.state.currentPercent) * 100) / 100;
    this.state.currentPercent = clampedStep;

    if (delta > 0) {
      this.state.tasksCompleted += 1;
      this.state.history.push({
        taskNumber: this.state.tasksCompleted,
        delta: delta,
        newTotal: clampedStep,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      if (this.state.history.length > 100) {
        this.state.history = this.state.history.slice(-100);
      }
    }

    this.saveState();
    return { delta, targetStep: clampedStep, isComplete: clampedStep >= 100 };
  }

  // --- Countdown Timer Actions ---

  setTimerDuration(totalSeconds) {
    this.state.timerTotalSeconds = Math.max(1, totalSeconds);
    this.state.timerRemainingSeconds = this.state.timerTotalSeconds;
    this.state.timerRunning = false;
    this.saveState();
  }

  setTimerRemaining(remainingSeconds) {
    this.state.timerRemainingSeconds = Math.max(0, remainingSeconds);
  }

  setTimerRunning(isRunning) {
    this.state.timerRunning = !!isRunning;
  }

  resetTimer() {
    this.state.timerRemainingSeconds = this.state.timerTotalSeconds;
    this.state.timerRunning = false;
    this.saveState();
  }
}
