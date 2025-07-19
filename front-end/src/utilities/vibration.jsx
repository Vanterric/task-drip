export const vibration = (type) => {
  if (!('vibrate' in navigator)) {
    return
  }
  switch (type) {
    case 'button-press':
      navigator.vibrate(10)
      break

    case 'task-completion':
      // Light confirmation rhythm
      navigator.vibrate([10, 20, 10])
      break

    case 'task-list-completion':
      // Mirrors your 250ms fill + 500ms delay before sparkles
      // Matches visual impact timing with crescendo feel
      setTimeout(() => {
        navigator.vibrate([15, 30, 20, 20, 40])
      }, 500) // sync to explosion scale + sparkle moment
      break

    default:
      break
  }
}
