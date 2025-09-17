// Simple background task scheduler to run queued tasks sequentially with a small gap.
// This prevents a burst of background network requests all starting at once.

const queue = [];
let running = false;

function dequeueAndRun() {
  if (running) return;
  const task = queue.shift();
  if (!task) return;
  running = true;
  // Run the task (it can be async)
  Promise.resolve()
    .then(() => task())
    .catch(() => {})
    .finally(() => {
      // Small gap before next task so we don't hit the network all at once
      setTimeout(() => {
        running = false;
        // schedule next
        dequeueAndRun();
      }, 300);
    });
}

export function scheduleBackground(task) {
  if (typeof window === "undefined") {
    // server-side fallback: run later
    setTimeout(() => {
      try {
        task();
      } catch (e) {}
    }, 500);
    return;
  }

  queue.push(task);
  // Use requestIdleCallback if available to prioritize UI
  if (window.requestIdleCallback) {
    // give the runtime a chance to schedule when idle
    window.requestIdleCallback(() => dequeueAndRun(), { timeout: 1000 });
  } else {
    // otherwise run after a short delay
    setTimeout(() => dequeueAndRun(), 200);
  }
}

export default scheduleBackground;
