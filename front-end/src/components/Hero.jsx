import { useScroll, useTransform, motion, useMotionValue, delay } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { audio } from "../utilities/audio";
import { vibration } from "../utilities/vibration";
import { scrollTo } from "../utilities/scrollTo";

export default function Hero({ referrerName, setShowModal, sectionRefs, buttonText }) {
  const containerRef = useRef(null);
   const logoOpacity = useMotionValue(1);
    const sectionHeadersOpacity = useMotionValue(1);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  const logoOpacityValues = sectionRefs.map((ref) => {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 58%", "end 40%"],
  });

  return useTransform(scrollYProgress, [0, .1, 0.9, 1], [1, 0, 0, 1]);
});
const [index,setIndex] = useState(0);
  const sectionHeaders = [
    "Built by Overwhelmed \nMinds, for Overwhelmed Minds",
    "Informed by Interviews with \n Coaches, Therapists, and Real Users",
    "Free Forever, \nbut Pro is Better 😎",
    "Not convinced yet? \nCheck out the Product Demo!",
    "Still scrolling? \nThe app's way more fun.",
  ]

  const sectionOpacityValues = sectionRefs.map((ref) => {
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["end 40%", "end -30%"],
  });

  return useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
});



useEffect(() => {
  const unsubscribers = logoOpacityValues.map((opacity, index) => {
    return opacity.on("change", () => {
      const minOpacity = Math.min(...logoOpacityValues.map(o => o.get()));
      logoOpacity.set(minOpacity);
    });
  });

  return () => unsubscribers.forEach(unsub => unsub());
}, [logoOpacityValues]);

useEffect(() => {
    const unsubscribers = sectionOpacityValues.map((opacity, index) => {
        return opacity.on("change", () => {
        const minOpacity = Math.min(...sectionOpacityValues.map(o => o.get()));
        if (minOpacity < 0.1) {
            setIndex(index);
        }
        });
    });
    return () => unsubscribers.forEach(unsub => unsub());
}, [sectionOpacityValues]);

  // Animate logo Y and scale
  const logoY = useTransform(scrollYProgress, [0, .5], [window.innerWidth > 540 ? -210 : -200, -50]);

  // Fade out everything else
  const textOpacity = useTransform(scrollYProgress, [0, .04], [1, 0]);

  return (
    <div ref={containerRef} className="mb-30 z-[10] ">
    <motion.div className=" h-[80vh] relative mt-30 flex items-center justify-center flex-col text-center ">
      <motion.img
        className="w-32 flex justify-center flex-col items-center mb-6 z-[10] fixed"
        style={{ y: logoY, scale: logoOpacity, opacity: logoOpacity }}
        src="/DewList_Logo.png" alt="DewList Logo"
      />
      {sectionHeaders.map((text, i) => (
  text && (
    <motion.h2
      key={i}
      className="text-4xl max-[750px]:text-3xl max-[750px]:mt-55 max-[600px]:text-2xl max-[600px]:mt-50 max-[450px]:text-xl max-[450px]:mt-45 max-[380px]:text-lg max-[340px]:text-base max-[300px]:text-sm whitespace-pre-line font-semibold text-text-primary dark:text-text-darkprimary mt-60 transition fixed"
      style={{ opacity: sectionOpacityValues[i], y: logoY}}
    >
      {text}
    </motion.h2>
  )
))}


      <motion.h1 className="text-4xl md:text-6xl md:mt-10 font-bold text-[#4F5962] dark:text-white mb-2  transition" style={{ opacity: textOpacity }}>
        DewList
      </motion.h1>

      <motion.h2 className="text-2xl md:text-3xl font-semibold text-[#4F5962] dark:text-white mb-4 transition" style={{ opacity: textOpacity }}>
        One task at a time.
      </motion.h2>

      <motion.div className="text-lg md:text-xl text-[#91989E] dark:text-[#D4E3FF] mb-8 max-w-2xl transition max-[540px]:text-sm" style={{ opacity: textOpacity }}>
        {referrerName !== "" && (
          <div className="mb-2">
            {referrerName} thinks you'll love this. <i>We do too.</i>
          </div>
        )}
        A powerful, minimalist task app built<br /> for neurodivergent and overwhelmed minds.
      </motion.div>

      <motion.button
        onClick={() => {
          audio("open-modal", false);
          vibration("button-press");
          setShowModal(true);
        }}
        className="bg-[#4C6CA8] hover:bg-[#3A5D91] text-white px-8 py-4 rounded-2xl text-lg font-semibold transition cursor-pointer"
        style={{ opacity: textOpacity }}
      >
        {buttonText}
      </motion.button>

      <motion.div
        className="mt-6 text-[#4F5962] dark:text-white text-sm transition cursor-pointer hover:underline"
        style={{ opacity: textOpacity }}
        onPointerDown={() => {
          audio("button-press", false);
          vibration("button-press");
        }}
        onClick={() => {
          scrollTo(document.getElementById("productDemo"), {duration: 5, offset:0})
        }}
      >
        Watch a Demo
      </motion.div>
    </motion.div>
    </div>
  );
}
