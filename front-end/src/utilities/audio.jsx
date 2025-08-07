import { Howl } from 'howler';
import { useEffect } from 'react';

export let isMuted = localStorage.getItem("isMuted") === "true";
export const setIsMuted = (value) => {
  isMuted = value;
  localStorage.setItem("isMuted", value);
};






const audioFiles = {
  'open-modal': 'https://storage.googleapis.com/dewlist_interaction_audio/OpenModal.mp3',
  'close-modal': 'https://storage.googleapis.com/dewlist_interaction_audio/CloseModal.mp3',
  'button-press-1': 'https://storage.googleapis.com/dewlist_interaction_audio/ButtonPress1.mp3',
  'button-press-2': 'https://storage.googleapis.com/dewlist_interaction_audio/ButtonPress2.mp3',
  'slide-1': 'https://storage.googleapis.com/dewlist_interaction_audio/Slide1.mp3',
  'bubble-up': 'https://storage.googleapis.com/dewlist_interaction_audio/BubbleUp.mp3',
  'growth': 'https://storage.googleapis.com/dewlist_interaction_audio/Growth.mp3',
  'shrinkage': 'https://storage.googleapis.com/dewlist_interaction_audio/Shrinkage.mp3',
  'single-drop': 'https://storage.googleapis.com/dewlist_interaction_audio/SingleDrop.mp3',
  'progress-full': 'https://storage.googleapis.com/dewlist_interaction_audio/ProgressFull.mp3',
  'progress9-10': 'https://storage.googleapis.com/dewlist_interaction_audio/Progress9-10.mp3',
  'progress8-10': 'https://storage.googleapis.com/dewlist_interaction_audio/Progress8-10.mp3',
  'progress7-10': 'https://storage.googleapis.com/dewlist_interaction_audio/Progress7-10.mp3',
  'progress6-10': 'https://storage.googleapis.com/dewlist_interaction_audio/Progress6-10.mp3',
  'progress5-10': 'https://storage.googleapis.com/dewlist_interaction_audio/Progress5-10.mp3',
  'progress4-10': 'https://storage.googleapis.com/dewlist_interaction_audio/Progress4-10.mp3',
  'progress3-10': 'https://storage.googleapis.com/dewlist_interaction_audio/Progress3-10.mp3',
  'progress2-10': 'https://storage.googleapis.com/dewlist_interaction_audio/Progress2-10.mp3',
  'success-bubbles': 'https://storage.googleapis.com/dewlist_interaction_audio/SuccessBubbles.mp3',
  'task-complete': 'https://storage.googleapis.com/dewlist_interaction_audio/TaskComplete.mp3',
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
      volume: key === 'single-drop' ? 0.05 : progressBarKeys.includes(key) ? 0.15 : key === 'success-bubbles' || key === 'task-complete' ? 0.25 : 0.4,
    });
  }

  const pitchVariance = 0.1;
  const sound = cache[key];
  sound.rate(1 + (Math.random() * 2 - 1) * pitchVariance);
  sound.play();
};
