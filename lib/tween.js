const EASINGS = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeOutCubic: (t) => --t * t * t + 1,
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
};

export function createTween({ from = 0, to = 1, duration = 1, ease = 'linear', onUpdate, onComplete } = {}) {
  let elapsed = 0;
  let done = false;
  const easeFn = EASINGS[ease] || EASINGS.linear;

  return {
    update(delta) {
      if (done) return to;
      elapsed += delta;
      const t = Math.min(elapsed / duration, 1);
      const value = from + (to - from) * easeFn(t);
      if (onUpdate) onUpdate(value, t);
      if (t >= 1) {
        done = true;
        if (onComplete) onComplete(value);
      }
      return value;
    },
    reset() {
      elapsed = 0;
      done = false;
    },
    get finished() {
      return done;
    }
  };
}

export { EASINGS };
