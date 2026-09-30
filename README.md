# Progress & Timer Tracker

A clean, interactive progress tracker supporting both task-increment progress and a single countdown timer.

## Project Structure

```text
progress bar/
├── index.html          # Semantic HTML layout, mode switcher, and favicon link
├── css/
│   └── styles.css      # Design tokens, progress bar animations, and PiP/widget mode
├── js/
│   ├── sound.js        # Web Audio API engine with master volume, test chime, and compressor
│   ├── confetti.js     # Lightweight canvas particle celebration engine
│   ├── state.js        # State store for task increments, countdown timer, and volume
│   └── app.js          # Dynamic favicon, PiP engine, live tab updates, and shortcuts
└── README.md           # Documentation and shortcut guide
```

## Features

### 1. Two Progress Bar Modes
- **Task Increment Mode**:
  - Set a custom percentage increment (presets like `+5%`, `+10%`, `+12.5%`, `+20%`, `+25%`, `+33.3%`, or enter any custom percentage).
  - Optional total tasks calculator (e.g. 8 tasks &rarr; sets increment to `12.5%`).
  - Progress bar advances by said % increment on each completed task.
  - Displays **Tasks Completed**, **Progress Remaining**, and **Est. Tasks Remaining**.
  - Milestone markers at `0%`, `25%`, `50%`, `75%`, and `100%`.
  - Undo button (<kbd>Ctrl</kbd>+<kbd>Z</kbd>) to revert the last completed task.
- **Countdown Timer Mode**:
  - Duration presets in a single row (`1 min`, `5 min`, `10 min`, `15 min`, `30 min`, `60 min`) or custom minutes and seconds.
  - Large digital countdown clock (`MM:SS`) with live 60fps/120fps progress bar tracking time elapsed.
  - Displays **Time Elapsed**, **Time Remaining**, and **Total Duration**.
  - Start, Pause, and Reset controls.

### 2. Live Browser Tab Updates
- **Dynamic Tab Title**: Real-time display in the browser tab title (e.g. `(45%) Project Milestone` or `(03:42) Countdown Timer`) so you can track progress when switched to other tabs or windows.
- **Dynamic Rainbow Favicon Ring**: Generates an in-tab rainbow circular progress ring that fills in real time alongside your progress bar.

### 3. Audio & Volume Control
- **Volume Slider**: Adjust sound volume from 0% to 100% with a dynamic compressor for loud, clear output.
- **Brief Test Chime Preview**: Plays a short, pleasant preview chime when dragging or adjusting the volume slider.
- **Mute Button**: One-click toggle to silence or restore audio.

### 4. Compact Widget Mode, Mini View & Micro View (Picture-in-Picture)
- **Widget Mode Toggle**: Click the minimize/expand icon in the header to collapse into a distraction-free widget bar.
- **Picture-in-Picture Floating Window**: Click the PiP icon in the header to detach the tracker into a native OS **Always-On-Top** floating window (Document Picture-in-Picture API) or standalone compact popup window. Keep your progress bar or countdown visible over any application while working.
- **Responsive View Scaling in PiP & Compact Windows**:
  - **Normal Widget View**: Full header, stats strip, progress bar, and controls.
  - **Mini View**: Automatically activates when window size is reduced; features enlarged vertical scaling (taller progress bar and taller complete/resume button), timer/percentage progress display, and a dedicated **Undo** button beside Complete Task in Task Mode.
  - **Micro View (Ultimate Condensed View)**: Automatically activates when window is shrunk even smaller; hides all timer text/clocks and displays strictly the progress bar and primary action button (with **Undo** button retained in Task Mode).
- **Cross-Window Realtime Sync**: Changes in the floating mini/micro window or main tab sync instantly via `localStorage`.

## Keyboard Shortcuts

- <kbd>Space</kbd> or <kbd>Enter</kbd>:
  - **Task Mode**: Complete a task
  - **Timer Mode**: Start or Pause the countdown timer
- <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Cmd</kbd>+<kbd>Z</kbd>: Undo last completed task (Task Mode)
