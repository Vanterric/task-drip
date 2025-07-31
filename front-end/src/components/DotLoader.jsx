import { useEffect } from 'react';
import { audio } from '../utilities/audio';
import { vibration } from '../utilities/vibration';
import { useAuth } from '../context/AuthContext';

export function DotLoader() {
  const {isMuted} = useAuth();
  useEffect(() => {
    const first = setTimeout(() => {
      audio('single-drop', isMuted); vibration('button-press');
      setTimeout(() => {audio('single-drop', isMuted); vibration('button-press')}, 100);
      setTimeout(() => {audio('single-drop', isMuted); vibration('button-press')}, 200);
    }, 500);

    let interval;

    const loopStarter = setTimeout(() => {
      interval = setInterval(() => {
        audio('single-drop', isMuted); vibration('button-press');
        setTimeout(() => {audio('single-drop', isMuted); vibration('button-press')}, 100);
        setTimeout(() => {audio('single-drop', isMuted); vibration('button-press')}, 200);
      }, 1000);
    }, 500);

    return () => {
      clearTimeout(first);
      clearTimeout(loopStarter);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex gap-[2px]">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-[4px] h-[4px] rounded-full bg-white animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}
