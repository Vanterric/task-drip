import { useEffect, useState } from 'react';
import { vibration } from '../utilities/vibration';
import { audio } from '../utilities/audio';
import { useHasInteracted } from '../utilities/useHasInteracted';
import { useAuth } from '../context/AuthContext';


export default function ProgressBar({ previousCompletedCount, completedCount, tasks }) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [sparkles, setSparkles] = useState([]);
  const [justHitFull, setJustHitFull] = useState(false);
  const [triggeredExplosion, setTriggeredExplosion] = useState(false);
    const [showScale, setShowScale] = useState(false);
  const hasInteracted = useHasInteracted();
  const {isMuted} = useAuth();

  const totalTasks = tasks.length;
  const progress = totalTasks === 0 ? 0 : (completedCount / totalTasks) * 100;
  const isComplete = totalTasks > 0 && completedCount === totalTasks;

  useEffect(() => {
    setTimeout(() => {
      if (isComplete && hasInteracted ) {
        audio('progress-full', isMuted);
      }
    }, 100);
  }, [isComplete]);

  useEffect(() => {
    setPulse(true);
  
    const timeout = setTimeout(() => {
      setAnimatedProgress(progress);
      setPulse(false);
      if (hasInteracted && progress > 0 && progress < 100) {
        const percentPrevious = previousCompletedCount / totalTasks * 100;
        const difference = progress - percentPrevious;
        console.log('Progress difference:', previousCompletedCount, '->', completedCount, '=>', difference);
        if (difference >= 90 && difference < 100) {
          audio('progress9-10', isMuted);
        } else if (difference >= 80 && difference < 90) {
          audio('progress8-10', isMuted);
        } else if (difference >= 70 && difference < 80) {
          audio('progress7-10', isMuted);
        } else if (difference >= 60 && difference < 70) {
          audio('progress6-10', isMuted);
        } else if (difference >= 50 && difference < 60) {
          audio('progress5-10', isMuted);
        } else if (difference >= 40 && difference < 50) {
          audio('progress4-10', isMuted);
        } else if (difference >= 20 && difference < 40) {
          audio('progress3-10', isMuted);
        } else if (difference > 0 && difference < 20) {
          audio('progress2-10', isMuted);
        }
      }
  
      // Trigger explosion exactly when bar *visually* fills
      if (progress === 100) {
        vibration('task-list-completion')
        setTimeout(() => {
          setShowScale(true);             
          setTriggeredExplosion(true); 
          audio('success-bubbles', isMuted);   
          generateSparkles();
      
          // Let scale ease back down after 1s
          setTimeout(() => {
            setShowScale(false);          
          }, 1000);
      
          // Let sparkles disappear after 1.5s
          setTimeout(() => {
            setTriggeredExplosion(false);
            setSparkles([]);
            setCelebrating(false);
          }, 1500);
        }, 500); // delay to match progress fill
      }
      
    }, 250);
  
    return () => clearTimeout(timeout);
  }, [completedCount, totalTasks]);
  
  

  const generateSparkles = () => {
    const newSparkles = Array.from({ length: 24 }).map((_, i) => {
      const originPercent = Math.random() * 100; // random horizontal origin
      const angle = Math.random() * 2 * Math.PI;
      const distance = 40 + Math.random() * 60;
      const translateX = Math.cos(angle) * distance;
      const translateY = Math.sin(angle) * distance;
  
      return {
        id: Date.now() + i,
        left: `${originPercent}%`, // 👈 spread across the bar
        translate: `translate(${translateX}px, ${translateY}px)`,
        rotate: `${Math.floor(Math.random() * 360)}deg`,
        size: `${6 + Math.random() * 8}px`,
        delay: `${Math.random() * 0.2}s`,
      };
    });
  
    setSparkles(newSparkles);
  
    setTimeout(() => {
        setJustHitFull(false);  // this is what triggers the scale-down
        setSparkles([]);
        setCelebrating(false);
      }, 1500);
      
  };
  
  
  

  return (
    <div className="w-full mt-4">
      <div className="flex justify-between items-center mb-1">
        <p className="text-sm text-[#91989E] cursor-default">
          {completedCount} of {totalTasks} completed
        </p>
        <p className="text-sm text-[#91989E] cursor-default">{Math.round(progress)}%</p>
      </div>

      <div className="relative w-full h-2 bg-[#D4E3FF] dark:bg-[#4C6CA8] rounded-full overflow-visible">
        {/* Animated Sparkles */}
        {sparkles.map((sparkle) => (
  <div
    key={sparkle.id}
    className="absolute top-0 z-20 rounded-full bg-yellow-300 animate-sparkleBurst"
    style={{
      left: sparkle.left,
      width: sparkle.size,
      height: sparkle.size,
      animationDelay: sparkle.delay,
      opacity: 0.8,
      '--sparkle-translate': sparkle.translate,
      '--sparkle-rotate': sparkle.rotate,
    }}
  />
))}

        {/* Progress bar */}
        <div
            className={`h-full origin-left rounded-full ${
                triggeredExplosion || isComplete
                ? 'bg-yellow-400 shadow-[0_0_10px_2px_rgba(255,215,0,0.5)]'
                : 'bg-[#4BAF8E]'
            } ${pulse ? 'animate-pulse' : ''}`}
            style={{
                width: `${animatedProgress}%`,
                transform: `scaleY(${showScale ? 1.5 : 1})`,
                transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), width 0.5s ease-out',
            }}
            />




      </div>
    </div>
  );
}
