import { Howl } from 'howler';

export let isMuted = localStorage.getItem("isMuted") === "true";
export const setIsMuted = (value) => {
  isMuted = value;
  localStorage.setItem("isMuted", value);
};

const audioFiles = {
  'open-modal': '/audio/OpenModal.wav',
  'close-modal': '/audio/CloseModal.wav',
  'button-press-1': '/audio/ButtonPress1.wav',
  'button-press-2': '/audio/ButtonPress2.wav',
  'slide-1': '/audio/Slide1.wav',
  'bubble-up': '/audio/BubbleUp.wav',
  'growth': '/audio/Growth.wav',
  'shrinkage': '/audio/Shrinkage.wav',
  'single-drop': '/audio/SingleDrop.wav',
  'progress-full': '/audio/ProgressFull.wav',
  'progress9-10': '/audio/Progress9-10.wav',
  'progress8-10': '/audio/Progress8-10.wav',
  'progress7-10': '/audio/Progress7-10.wav',
  'progress6-10': '/audio/Progress6-10.wav',
  'progress5-10': '/audio/Progress5-10.wav',
  'progress4-10': '/audio/Progress4-10.wav',
  'progress3-10': '/audio/Progress3-10.wav',
  'progress2-10': '/audio/Progress2-10.wav',
  'success-bubbles': '/audio/SuccessBubbles.wav',
};

const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const cache = {};
const progressBarKeys = [
  'progress9-10',
  'progress8-10',
  'progress7-10',
  'progress6-10',
  'progress5-10',
  'progress4-10',
  'progress3-10',
  'progress2-10',
  'progress-full',
];

const lastPlayTimestamps = {};

export const audio = (type) => {
  if (isMuted) return;
  

  let key = type;

  if (type === 'button-press') {
    key = `button-press-${getRandomInt(1, 2)}`;
  } else if (type === 'slide') {
    key = `slide-${getRandomInt(1, 1)}`;
  }

  if (!audioFiles[key]) return;

  const now = Date.now();
  const debounceInterval = 100; // ms
  if (lastPlayTimestamps[key] && now - lastPlayTimestamps[key] < debounceInterval) return;
  lastPlayTimestamps[key] = now;

  if (!cache[key]) {
    cache[key] = new Howl({
      src: [audioFiles[key]],
      volume: key === 'single-drop' ? 0.05 : progressBarKeys.includes(key) ? 0.15 : key === 'success-bubbles' ? 0.25 : 0.4,
    });
  }

  const pitchVariance = 0.1;
  const sound = cache[key];
  sound.rate(1 + (Math.random() * 2 - 1) * pitchVariance);
  sound.play();
};
