import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, Undo2, XCircle } from "lucide-react";
import { audio, isMuted } from "../utilities/audio";

const waveKeyframes = [
  // Flat baseline
  "M0,30 C30,30 60,30 90,30 C120,30 150,30 180,30 L180,80 L0,80 Z",

  // Exaggerated crest & trough
  "M0,30 C30,-10 60,70 90,30 C120,-10 150,70 180,30 L180,80 L0,80 Z",

  // Slightly less intense version to ease back
  "M0,30 C30,5 60,55 90,30 C120,5 150,55 180,30 L180,80 L0,80 Z",

  // Back to flat
  "M0,30 C30,30 60,30 90,30 C120,30 150,30 180,30 L180,80 L0,80 Z"
];


const successMessages = [
      "Nice Job!",
      "Well Done!",
      "Great Work!",
      "Keep it Up!",
      "Fantastic!",
      "Awesome!",
      "You Did It!",
      "Success!",
      "Bravo!",
      "Excellent!"
    ];


export default function SuccessToast({ isVisible, onClose, onUndo }) {
  const SUCCESS_TOAST_DURATION = 3000;
  const [progress, setProgress] = useState(100);
  const [showDroplets, setShowDroplets] = useState(false);
  const [successMessage, setSuccessMessage] = useState(() => {
    
    return successMessages[Math.floor(Math.random() * successMessages.length)];
  });
  
  useEffect(() => {
  if (isVisible) {
    setTimeout(() => { audio('task-complete', isMuted); }, 150);
  }
}, [isVisible]);

useEffect(() => {
  if (isVisible) {
    setSuccessMessage(successMessages[Math.floor(Math.random() * successMessages.length)]);
  }
}, [isVisible]);

useEffect(() => {
  if (!isVisible) return;
  
  // Trigger droplets just after crest (aligned w/ wave animation peak ~300ms)
  const timeout = setTimeout(() => {
    setShowDroplets(true);
    setTimeout(() => setShowDroplets(false), 600); // remove after anim
  }, 300);

  return () => clearTimeout(timeout);
}, [isVisible]);


  useEffect(() => {
    if (!isVisible) return;

    let startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const percent = 100 - (elapsed / SUCCESS_TOAST_DURATION) * 100;
      setProgress(Math.max(0, percent));
    };
    const interval = setInterval(tick, 50);
    const timeout = setTimeout(() => {
      onClose();
    }, SUCCESS_TOAST_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (<>
        <motion.div
  initial={{ y: 170}}
  animate={{ y: [150, -55, -53, -15] }}
  exit={{ y: 170}}
  transition={{
    type: "tween",
    duration: 1,
    times: [0, 0.3, .5, 1],
  }}
  className="fixed bottom-[-70px] left-1/2 -translate-x-1/2 z-10 w-full max-w-md pointer-events-none overflow-hidden"
>
  <svg
    viewBox="0 0 180 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-40"
    preserveAspectRatio="none"
  >
    <motion.path
        initial={{ d: waveKeyframes[0] , x: "0%" }}
      d={waveKeyframes[0]}
      animate={{ d: waveKeyframes, x: ["50%", "-50%"] }}
      transition={{
        repeat: Infinity,
        duration: 2,
        ease: "linear",
        times: [0, 1],
      }}
      fill="currentColor"
      className="text-accent-focusring dark:text-accent-primary scale-150"
    />
  </svg>
</motion.div>
{showDroplets && (
  <>
    {[...Array(12)].map((_, i) => (
      <motion.div
        key={`droplet-${i}`}
        initial={{
          y: 0,
          opacity: 0.9,
          scale: 0.8,
          x: (Math.random() - 0.5) * 400,
        }}
        animate={{
          y: -60 - Math.random() * 20,
          opacity: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.6 + Math.random() * 0.3,
          ease: "easeOut",
        }}
        className="absolute bottom-[80px] left-1/2 w-[6px] z-9 h-[6px] rounded-full bg-white dark:bg-accent-success mix-blend-screen pointer-events-none"
        style={{ zIndex: 20 }}
      />
    ))}
  </>
)}


        <motion.div
          initial={{  y: 150 }}
          animate={{  y: 0 }}
          exit={{  y: 150 }}
          transition={{ type: "spring", damping: 20, stiffness: 300, duration: 0.5 }}
          className="fixed bottom-[-20px] left-1/2 z-10 w-full max-w-md h-30 -translate-x-1/2 rounded-t-xl bg-accent-success dark:bg-background-darkinsetcard shadow-lg text-text-darkprimary dark:text-accent-success overflow-hidden"
        >
          {/* Inverse Progress Bar */}
          <div
            className="h-1 bg-accent-successhover dark:bg-accent-success transition-all duration-75"
            style={{ width: `${progress}%` }}
          />

          {/* Content */}
          <div className="p-4 flex flex-col gap-2">
            <span className="text-2xl font-semibold flex items-center gap-2">
              <CheckCircle size={25} /> {successMessage}
            </span>
            <button
              onClick={() => { onUndo(); onClose(); }}
              className="mt-2 flex items-center gap-1 text-sm font-medium hover:underline cursor-pointer "
            >
              <Undo2 size={16} /> Undo
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              onClose();
            }}
            className="absolute top-2 right-2 cursor-pointer"
          >
            <span className="sr-only">Close</span>
            <XCircle />
          </button>
        </motion.div></>
      )}
    </AnimatePresence>
  );
}
