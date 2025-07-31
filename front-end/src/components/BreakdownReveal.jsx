import { motion, AnimatePresence, useMotionValue, useMotionTemplate, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, AlarmClock } from 'lucide-react';
import ArrowLayer from './ArrowLayer';
import { audio } from '../utilities/audio';
import { vibration } from '../utilities/vibration';
import { useAuth } from '../context/AuthContext';


export default function BreakdownReveal({ key, subtasks = [], originRef, setIsEditTaskModalOpen, setSelectedTask, visible}) {
  const containerRef = useRef(null);
  const subtaskRefs = useRef([]);
  const [activeDescription, setActiveDescription] = useState(null);
  const [hasMeasured, setHasMeasured] = useState(false);
  const {isMuted, setIsMuted} = useAuth();

  useEffect(() => {
  let frame;
  let timeout;

  frame = requestAnimationFrame(() => {
    if (!originRef?.current || !containerRef?.current) return;

    const originRect = originRef.current.getBoundingClientRect();
    origin.x.set(originRect.left + originRect.width / 2);
    origin.y.set(originRect.top + 10);

    subtasks.forEach((_, i) => {
      const ref = subtaskRefs.current[i];
      if (ref && containerRef.current) {
        const refRect = ref.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        targets[i].x.set(refRect.left + refRect.width / 2);
        targets[i].y.set(refRect.top + refRect.height);
      }
    });

    // 🔥 Wait one tick before showing cards
    timeout = setTimeout(() => setHasMeasured(true), 30);
  });

  return () => {
    cancelAnimationFrame(frame);
    clearTimeout(timeout);
  };
}, [subtasks.length]);




  const origin = { x: useMotionValue(0), y: useMotionValue(0) };
  const targets = subtasks.map(() => ({
    x: useMotionValue(0),
    y: useMotionValue(0)
  }));

  useEffect(() => {
  if (!containerRef.current) return;

  subtasks.forEach((_, i) => {
    const ref = subtaskRefs.current[i];
    const containerRect = containerRef.current.getBoundingClientRect();
    if (!ref) return;

    const refRect = ref.getBoundingClientRect();
    const x = refRect.left + refRect.width / 2 - containerRect.left;
    const y = refRect.top + refRect.height - containerRect.top;

  });
}, [subtasks, activeDescription]); // re-run when subtasks or height changes


  useEffect(() => {
    let animationFrame;

    const updatePositions = () => {
      if (originRef?.current && containerRef?.current) {
        const originRect = originRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        origin.x.set(originRect.left + originRect.width / 2);
        origin.y.set(originRect.top + 10);
      }

      subtasks.forEach((_, i) => {
        const ref = subtaskRefs.current[i];
        if (ref && containerRef.current) {
          const refRect = ref.getBoundingClientRect();
          const containerRect = containerRef.current.getBoundingClientRect();
          targets[i].x.set(refRect.left + refRect.width / 2);
            targets[i].y.set(refRect.top + refRect.height);

        }
      });

      animationFrame = requestAnimationFrame(updatePositions);
    };

    animationFrame = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animationFrame);
  }, [subtasks.length, activeDescription]);

 const renderArrow = (i, subtask) => {
  const toX = targets[i].x;
    const toY = targets[i].y;


  const controlY = useTransform([origin.y, toY], ([oy, ty]) => oy + 0.4 * (ty - oy));
    const midX = useTransform([origin.x, toX], ([ox, tx]) => ox + 0.5 * (tx - ox));

  const path = subtask.content !== '' ? useMotionTemplate`
    M ${origin.x} ${origin.y}
    C ${origin.x} ${controlY}
      ${midX} ${toY}
      ${toX} ${toY}
  ` : useMotionTemplate`
    M ${origin.x} ${origin.y}
    L ${origin.x} ${origin.y}
  `;

  return (
    <svg
      key={`arrow-${i}`}
      className="absolute z-0 pointer-events-none"
      style={{ left: 0, top: 0, width: '100%', height: '100%' }}
    >
      <motion.path
        d={path}
        stroke="#4F5962"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1 + i * 0.08,
          duration: 0.6,
          ease: 'easeInOut'
        }}
      />
    </svg>
  );
};



  return (
    <motion.div
      className={`flex flex-col items-center z-10 gap-3  relative overflow-visible `}
      ref={containerRef}
      initial="hidden"
      animate="show"
    >
      <ArrowLayer>
  {subtasks.map((subtask, i) => renderArrow(i, subtask))}
</ArrowLayer>


      <div className={`flex ${visible ? 'gap-4' : ''} z-10 items-start  ${window.innerWidth < 700 ?  'flex-col' : 'flex-row'}`}>
        {subtasks.map((subtask, i) => {
          if (!hasMeasured) {
    return (
      <div
        key={`subtask-${i}`}
        ref={(el) => (subtaskRefs.current[i] = el)}
        style={{ visibility: "hidden", position: "absolute" }}
        className="w-xs h-28" // or your default card height
      />
    );
  }
            
           const isSmall = window.innerWidth < 1000;
          const isMobile = window.innerWidth < 700;
          const cardWidth = isMobile
            ? window.innerWidth - 20
            : isSmall
            ? window.innerWidth / 3 - 20
            : 384;
          const gap = 16
          const xOffset = (cardWidth + gap);
          const x = isMobile ? 0 :i === 0 ? xOffset : i === 1 ? 0 : -xOffset;

          const y = !isMobile ? 80 : i === 0 ? 200 : i === 1 ? 110 : 20;
            return(
          <motion.div
            key={`subtask-${i}`}
            ref={(el) => (subtaskRefs.current[i] = el)}
            className={`relative text-[1rem] z-0 bg-background-card dark:bg-background-darkcard rounded-3xl shadow-lg  font-semibold max-w-[calc(100vw-4rem)]  max-[1000px]:w-[calc(100vw/3-20px)] max-[700px]:w-[20rem] transition cursor-default flex-col flex ${visible ? 'h-auto pt-4 px-6 pb-2 text-xl ' : 'h-0 text-transparent'} ${hasMeasured ? " w-xs " : "h-0 text-transparent"}`}
            onClick={() => {setActiveDescription(activeDescription === i ? null : i); audio(activeDescription === i ? 'button-press' : 'open-modal', isMuted); vibration('button-press');}}
            initial="exit"
            animate={visible ? 'visible' : 'exit'}
            exit="exit"
            variants={{
              hidden: { opacity: 1, x, y, scale: 0.1 },
              visible: hasMeasured ? { opacity: 1, x: 0, y: 0, scale: 1 } : false,
              exit: { opacity: 1, x, y, scale: 0.1 }
            }}
            transition={{ duration: 0.4, ease: 'easeOut' }}

          >
            {subtask.content || `Subtask ${i + 1}`}
            <span className="text-xs dark:text-text-darkinfo text-text-info">
              {subtask.timeEstimate ? `${subtask.timeEstimate} min` : ''}
            </span>
            <ChevronDown
              onClick={(e) => {
                e.stopPropagation();
                activeDescription === i ? audio('button-press', isMuted) : audio('open-modal', isMuted);
                vibration('button-press');
                setActiveDescription(activeDescription === i ? null : i);
              }}
              className={`transition-transform duration-300 origin-center flex justify-center items-center mx-auto  cursor-pointer w-5 h-5 dark:text-white/60 text-text-info`}
              style={{
                transform: activeDescription === i ? "rotateX(180deg)" : "rotateX(0deg)",
                transformStyle: "preserve-3d",
              }}
            />

            <AnimatePresence initial={false}>
              {activeDescription === i && (
                <motion.div
                  key={"description-" + i}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ overflow: "hidden" }}
                >
                  <hr className="border-gray-300 dark:border-[#A1A8B0] w-full mt-2" />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-sm mt-5 text-left font-normal whitespace-pre-line max-h-[calc(100vh-450px)] overflow-y-auto mb-5"
                  >
                    {subtask.description ? (
                      subtask.description
                    ) : (
                      <span className="dark:text-white/60 text-[#4F5962]/60 italic">
                        No description provided. Click "Replace" to replace the existing task with the available subtasks so that you can edit them. Or try regenerating another set of subtasks!
                      </span>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )})}
      </div>
    </motion.div>
  );
}
