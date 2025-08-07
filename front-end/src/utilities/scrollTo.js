import { animate } from "framer-motion"

/**
 * Smooth scroll to an element with optional offset and duration
 * @param {HTMLElement} el - The element to scroll to
 * @param {Object} options
 * @param {number} [options.duration=1] - Duration in seconds
 * @param {number} [options.offset=0] - Optional vertical offset (e.g. -100 to scroll above)
 * @param {Array} [options.ease=[0.22, 1, 0.36, 1]] - Easing function
 */
export function scrollTo(el, { duration = 1, offset = 0, ease = [0.22, 1, 0.36, 1] } = {}) {
  const targetY = el.getBoundingClientRect().top + window.pageYOffset + offset
  animate(window.scrollY, targetY, {
    duration,
    ease,
    onUpdate: latest => window.scrollTo(0, latest)
  })
}
