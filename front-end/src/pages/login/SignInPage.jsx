import { Check, CheckCircle, ChevronDown, Moon, RefreshCw, Sun } from "lucide-react";
import { use, useContext, useEffect, useRef, useState } from "react";
import { vibration } from "../../utilities/vibration";
import { audio } from "../../utilities/audio";
const DewList_Logo = "DewList_Logo.png";
import { ListTodo, Sparkles, Bot } from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";
import { testimonials } from "./testimonials";
import { mapRefferer } from "./referrerMap";
import { FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';
import SupademoEmbed from "../../components/SupaDemoEmbed";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { DotLoader } from "../../components/DotLoader";
import { AnimatePresence, motion } from "framer-motion";
import { Reveal } from "../../components/Reveal";
import Hero from "../../components/Hero";


export default function SigninPage() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const [openIndex, setOpenIndex] = useState(null);
  const referrer = localStorage.getItem("dewlist_ref") || "";
  const [referrerName, setReferrerName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedMagicLinkAuth, setSelectedMagicLinkAuth] = useState(false);
  const [showPasswordIncorrect, setShowPasswordIncorrect] = useState(false);
  const { setToken, setUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [passwordConfirm, setPasswordConfirm] = useState(""); // not actually meant to confirm password. Used as bot bait
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);
  const section3Ref = useRef(null);
  const section4Ref = useRef(null);
  const section5Ref = useRef(null);
  const section6Ref = useRef(null);

  const faqs = [
  {
    question: "Do I have to pay?",
    answer:
      "Nope. DewList is free forever with 1 list and 5 tasks. Want the focus view? That's $4/mo. Want AI and unlimited everything? Pro is $8/mo. Every new account starts with 3 days of full Pro access.",
  },
  {
    question: "What’s the catch?",
    answer:
      "No catch. No dark patterns. No guilt. DewList is built to help your brain focus, not hijack it with dopamine traps. Use it, love it, or leave it—zero pressure.",
  },
  {
    question: "Does the AI write my whole task list?",
    answer:
      "Only if you want it to. You can go full control freak or full ‘please help me I’m drowning.’ Either way, DewList has your back. The AI just turns vague goals into doable steps. I find it works really well if you give it a little context.",
  },
  {
    question: "Can I use it on my phone?",
    answer:
      "Absolutely. Just install it straight from your mobile browser. It’s designed to feel like a real app. You do need to stay logged in though...no offline mode (yet).",
  },
  {
  question: "What happens if I accidentally delete a task?",
  answer:
    "It’s gone. Poof. But hey, if enough people ask, I’ll build a safety net. Until then... deep breaths.",
},
{
  question: "Is this built by a big company?",
  answer:
    "Nope. Just one human with too many tabs open trying to build something that actually helps. Every feature is handcrafted with love, caffeine, and mild existential dread.",
}
,
];

useEffect(() => {
  setReferrerName(referrer === "" ? "" : mapRefferer(referrer));
}, [referrer])

useEffect(() => {
    if (!isAuthenticated) return;
    navigate("/app");
}, [isAuthenticated])


  const toggle = (i) => {
    if(openIndex === i) {
      audio("button-press", false);
    }
    else {
      audio("open-modal", false);
    }
    setOpenIndex(openIndex === i ? null : i);
    
  };

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(passwordConfirm !== ""){
      return setError("Please do not fill in the password confirmation field. It is not used for anything and is just there to catch bots.");
    }
    setStatus("loading");
    vibration("button-press");
    if(email.trim() !== "" && selectedMagicLinkAuth === true){
    try {
      const res = await fetch(`${BACKEND_URL}/auth/request-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, referrer }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError("Unable to connect to server.");
    }}
    else if(email.trim() !== "" && password.trim() !== "" && selectedMagicLinkAuth === false){
      try {
        const res = await fetch(`${BACKEND_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, referrer }),
        });
  
        const data = await res.json();
        if (res.ok) {
          setToken(data.token);
          setUser(data.user);
          navigate("/app");
        } else {
          setStatus("error");
          setError(data.error || "Something went wrong.");
          if(data.error === "Incorrect password"){
            setError("Incorrect password. \nTry again or login with magic link!");
          }
          else if(data.error === "No password set"){
            setError("No password set. \nTry logging in with magic link! \n\n You can always set your password \nin the settings menu once you're logged in.");
            setStatus("error");
          }
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setError("Unable to connect to server.");
        
      }
    }
    else{
      setStatus("error");
      setError("Please fill in all fields.");
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAECE5]  dark:bg-[#212732] px-6 max-[540px]:px-4 pb-20 transition overflow-x-hidden cursor-default">
      <div className="fixed top-[-100px] left-[-100px] pointer-events-none z-0">
        <div className="absolute w-[300px] h-[300px] max-w-[50vw] max-h-[50vw] bg-[#D4E3FF] dark:bg-[#4C6CA8] opacity-30 blur-[100px] rounded-full z-[1]"/>
        <div className="absolute w-[250px] h-[250px] max-w-[50vw] max-h-[50vw] border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite]"/>
        <div className="absolute w-[250px] h-[250px] max-w-[50vw] max-h-[50vw] border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite] [animation-delay:1.33s]"/>
        <div className="absolute w-[250px] h-[250px] max-w-[50vw] max-h-[50vw] border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite] [animation-delay:2.66s]"/>
      </div>
      <div className="fixed bottom-[100px] right-[100px] translate-x-[-50%] translate-y-[-50%] pointer-events-none z-0">
        <div className="absolute w-[300px] h-[300px] max-w-[50vw] max-h-[50vw] bg-[#D4E3FF] dark:bg-[#4C6CA8] opacity-30 blur-[100px] rounded-full z-[1]"/>
        <div className="absolute w-[250px] h-[250px] max-w-[50vw] max-h-[50vw] border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite]"/>
        <div className="absolute w-[250px] h-[250px] max-w-[50vw] max-h-[50vw] border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite] [animation-delay:1.33s]"/>
        <div className="absolute w-[250px] h-[250px] max-w-[50vw] max-h-[50vw] border border-[#D4E3FF] dark:border-[#4C6CA8] rounded-full opacity-0 animate-[rippleWave_4s_linear_infinite] [animation-delay:2.66s]"/>
      </div>


      <button onClick={() => {vibration('button-press'); audio('button-press', false); setIsDarkMode(!isDarkMode);}} className="p-2 rounded-full z-20 hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer fixed bottom-4 left-4">
            {isDarkMode ? (
              <Sun className="w-10 h-10 text-white" />
            ) : (
              <Moon className="w-10 h-10 text-[#4F5962]" />
            )}
          </button>
      <Hero buttonText={"Login"} referrerName={referrerName} setShowModal={setShowModal} sectionRefs={[section1Ref, section2Ref, section3Ref, section4Ref, section5Ref, section6Ref]}/>

     
<Reveal className="z-10">
      <div ref={section1Ref}  className="w-full px-6 z-[10] py-20 bg-white/50 dark:bg-black/20 transition flex flex-col md:flex-row items-center gap-10 max-w-6xl mx-auto rounded-3xl backdrop-blur-xs shadow-lg">
  {/* Visual Mockup */}
  <div  className="w-full md:w-1/2 flex justify-center z-[20]">
  <div className="rounded-3xl border border-[#E0ECFC] dark:border-[#4F596240] shadow-xl p-6 bg-white dark:bg-[#4F5962] w-full max-w-md space-y-6 transition">
    <div className="text-center text-xl font-semibold text-[#4F5962] dark:text-white transition">
      Build landing page section 2.
    </div>

    <div className="flex gap-4 justify-center">
      <button
      onClick={()=>{vibration('button-press'); audio('button-press', false);}}
        className="group flex items-center gap-2 bg-[#4BAF8E] text-white px-5 py-3 rounded-xl shadow hover:bg-[#3B8F75] hover:scale-105 active:scale-100 transition-all duration-200 ease-in-out"
      >
        <CheckCircle className="w-5 h-5 text-white group-hover:scale-110 group-hover:rotate-[10deg] transition-transform" />
        Done
      </button>
      <button
      onClick={()=>{vibration('button-press'); audio('button-press', false);}}
        className="group flex items-center gap-2 bg-[#4C6CA8] text-white px-5 py-3 rounded-xl shadow hover:bg-[#3A5D91] hover:scale-105 active:scale-100 transition-all duration-200 ease-in-out"
      >
        <RefreshCw className="w-5 h-5 text-white group-hover:rotate-180 transition-transform" />
        Skip
      </button>
    </div>

    <div className="h-3 bg-[#D4E3FF] dark:bg-[#4C6CA8] rounded-full overflow-hidden transition">
      <div className="w-2/5 h-full bg-[#4BAF8E] transition-all duration-500 rounded-full" />
    </div>
  </div>
</div>


  {/* Feature List */}
  <div className="w-full md:w-1/2 text-left relative">
  <Reveal >
  <h2 className="text-3xl font-bold text-[#4F5962] dark:text-white mb-6 transition">Why DewList works</h2>
  </Reveal>
  <ul className="space-y-6">
    <Reveal margin="-150px">
    <li className="flex items-start gap-3 justify-start ">
      <ListTodo className="w-15 min-w-8 h-auto text-[#4C6CA8] mt-1 " />
      <div>
        <p className="text-lg font-semibold text-[#4F5962] dark:text-white transition">Just one task, seriously.</p>
        <p className="text-[#91989E] dark:text-[#D4E3FF] transition">DewList keeps your mind clear by showing only your current task. You can’t overthink a list you can’t see.</p>
      </div>
    </li>
    </Reveal>
    <Reveal margin="-150px">
    <li className="flex items-start gap-3">
      <Sparkles className="w-15 min-w-8 h-auto mt-2 text-[#4C6CA8]" />
      <div>
        <p className="text-lg font-semibold text-[#4F5962] dark:text-white transition">ADHD-calibrated design.</p>
        <p className="text-[#91989E] dark:text-[#D4E3FF] transition">Minimal UI. Gentle colors. Subtle haptics. Everything is tuned to reduce overwhelm and help you finish what you start.</p>
      </div>
    </li>
    </Reveal>
    <Reveal margin="-150px">
    <li className="flex items-start gap-3 justify-start">
      <Bot className="w-15 min-w-8 h-auto text-[#4C6CA8] mt-2" />
      <div>
        <p className="text-lg font-semibold text-[#4F5962] dark:text-white transition">Built-in task helper.</p>
        <p className="text-[#91989E] dark:text-[#D4E3FF] transition">Write what you want to get done, and DewList gently breaks it into steps using AI. It’s like your to-do list finally gets you.</p>
      </div>
    </li>
    </Reveal>
  </ul>
</div>
</div>
</Reveal>

<div className="h-[100vh] relative"/>

<Reveal className="z-10">
<div ref={section2Ref} className="w-full py-2 flex flex-col md:flex-row items-center justify-between gap-12 max-w-6xl">
  <div className="w-full md:w-1/2 text-left">
  <Reveal>
    <h2 className="text-3xl font-bold text-[#4F5962] dark:text-white mb-6 transition">
      Built with you
    </h2>
    </Reveal>
    <Reveal margin="-150px">
    <p className="text-lg text-[#91989E] dark:text-[#D4E3FF] mb-4 transition">
      DewList isn’t bloated with features you’ll never use. We only build what you ask for—seriously.
    </p>
    <p className="text-lg text-[#91989E] dark:text-[#D4E3FF] mb-4 transition">
      Got an idea? Something not working? A random dopamine-fueled insight at 2 a.m.?
    </p>
    <p className="text-lg text-[#4C6CA8] dark:text-[#D4E3FF] font-semibold transition">
      Ask, and we shall dew.
    </p>
    </Reveal>
  </div>
  <Reveal margin="-150px" className="w-full md:w-1/2">
  <div className=" flex justify-center">
    <div className="rounded-3xl border border-[#E0ECFC] dark:border-[#4F596240] bg-white/50 dark:bg-black/20 backdrop-blur-xs p-6 w-full max-w-md shadow-lg space-y-4 transition">
      <div className="bg-[#F6F8FA] dark:bg-[#4F5962] rounded-xl p-4 transition shadow-lg">
        <p className="text-sm text-[#4F5962] dark:text-white font-semibold transition">
          “Can you add a widget that shows task history?”
        </p>
        <p className="text-xs text-[#91989E] mt-1">— You, probably</p>
      </div>
      <div className="bg-[#FAECE5] dark:bg-[#3A3F4F] rounded-xl p-4 transition shadow-lg">
        <p className="text-sm text-[#4F5962] dark:text-white font-semibold transition">
          “Done. It’s live.”
        </p>
        <p className="text-xs text-[#91989E] mt-1 transition">— Us, like 3 days later</p>
      </div>
    </div>
  </div>
  </Reveal>
</div>
</Reveal>

<div className="h-[100vh]"/>

<Reveal className="z-10">
<div ref={section3Ref} className="w-full py-20 px-4 md:px-10 bg-[#FAECE5] bg-white/50 dark:bg-black/20 max-w-6xl relative transition rounded-3xl shadow-lg backdrop-blur-xs">
  <Reveal margin="-150px">
  <h2 className="text-3xl md:text-4xl font-bold text-center text-[#4F5962] dark:text-white mb-12 transition">
    What people are saying
  </h2>
  </Reveal>
  <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-3">
    {testimonials.map(({ name, role, quote }, i) => (
      <Reveal delay={i * 0.1} margin="-200px" key={i}>
      <div
        key={i}
        className="bg-white dark:bg-[#4F5962] border border-[#E0ECFC] dark:border-[#4F596240] rounded-3xl p-6 shadow-md flex flex-col justify-between transition"
      >
        <p className="text-[#4F5962] dark:text-[#D4E3FF] text-base leading-relaxed mb-4 transition">“{quote}”</p>
        <div className="text-sm text-[#91989E] dark:text-[#D4E3FF]/70 transition">
          — {name}, {role}
        </div>
      </div>
      </Reveal>
    ))}
  </div>
</div>
</Reveal>

<div className="h-[100vh]"/>

<Reveal className="z-10 w-full max-w-6xl mx-auto px-4">
<div ref={section4Ref} className="">
  <Reveal >
  <h2 className="text-3xl md:text-5xl font-bold text-[#4F5962] dark:text-white mb-6 text-center transition">
    Pick your pace
  </h2>
  </Reveal>
  <Reveal margin="-150px">
  <p className="text-lg text-[#91989E] dark:text-[#D4E3FF] text-center max-w-2xl mx-auto mb-12 transition">
    Three tiers. One mission. Find your focus.
  </p>
  </Reveal>

  <div className="flex flex-col md:flex-row gap-6 justify-center">
    {/* Free Tier */}
    <Reveal margin="-200px" className="w-full max-w-sm">
    <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-lg p-8 border border-[#E0ECFC] dark:border-[#4F596240] flex flex-col justify-between transition">
      <div>
        <h3 className="text-3xl font-bold text-[#4F5962] dark:text-white mb-2 transition">Free</h3>
        <p className="text-xl font-extrabold text-[#4C6CA8] dark:text-[#90A9D6] mb-4 transition">Forever</p>
        <ul className="text-[#4F5962] dark:text-[#D4E3FF] space-y-2 text-left transition">
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> 1 task list</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> 5 tasks per list</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> Sync across devices</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> 3-day Pro trial included</li>
        </ul>
      </div>

      <button
        onClick={() => {
          audio("open-modal", false);
          vibration("button-press");
          setShowModal(true);
        }}
        className="mt-6 bg-[#4C6CA8] hover:bg-[#3A5D91] text-white py-3 px-6 rounded-xl font-semibold transition cursor-pointer"
      >
        Login
      </button>
    </div>
    </Reveal>

    {/* Focus Tier */}
    <Reveal margin="-200px" className="w-full max-w-sm">
    <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-lg p-8 border border-[#E0ECFC] dark:border-[#4F596240] flex flex-col justify-between transition">
      <div>
        <h3 className="text-3xl font-bold text-[#4C6CA8] dark:text-[#90A9D6] mb-2 transition">Focus</h3>
        <p className="text-xl font-extrabold text-[#4C6CA8] dark:text-[#90A9D6] mb-4 transition">$4/mo · $36/yr</p>
        <ul className="text-[#4F5962] dark:text-[#D4E3FF] space-y-2 text-left transition">
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> 3 task lists</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> 5 tasks per list</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> One-task-at-a-time view</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> The core ADHD-friendly experience</li>
        </ul>
      </div>

      <button
        onClick={() => {
          audio("open-modal", false);
          vibration("button-press");
          setShowModal(true);
        }}
        className="mt-6 bg-[#4C6CA8] hover:bg-[#3A5D91] text-white py-3 px-6 rounded-xl font-semibold transition cursor-pointer"
      >
        Login
      </button>
    </div>
    </Reveal>

    {/* Pro Tier */}
    <Reveal margin="-200px" className="w-full max-w-sm">
    <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-lg p-8 border-2 border-yellow-500 dark:border-yellow-300 flex flex-col justify-between transition relative">
      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">BEST VALUE</span>
      <div>
        <h3 className="text-3xl font-bold text-yellow-500 dark:text-yellow-300 mb-2 transition">Pro</h3>
        <p className="text-xl font-extrabold text-[#4C6CA8] mb-4 dark:text-[#90A9D6] transition">$8/mo · $72/yr · $150 once</p>
        <ul className="text-[#4F5962] dark:text-[#D4E3FF] space-y-2 text-left transition">
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> Unlimited tasks & lists</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> One-task-at-a-time view</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> AI-powered task creation</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> AI task polishing & breakdowns</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> Voice-to-task input</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> Scheduled list resets</li>
        </ul>
      </div>

      <button
        onClick={() => {
          audio("open-modal", false);
          vibration("button-press");
          setShowModal(true);
        }}
        className="mt-6 bg-[#4C6CA8] hover:bg-[#3A5D91] text-white py-3 px-6 rounded-xl font-semibold transition cursor-pointer"
      >
        Login
      </button>
    </div>
    </Reveal>
  </div>
  <Reveal margin="-150px">
  <p className="mt-10 text-sm text-[#91989E] dark:text-[#D4E3FF] text-center transition">
    Every new account gets 3 days of full Pro access. No credit card required.
  </p>
  </Reveal>
</div>
</Reveal>

<div className="h-[100vh]"/>

<div ref={section5Ref} className="w-full z-10 max-w-6xl mx-auto mt-20 px-4" id="productDemo">
  <div className="mt-5">
    <SupademoEmbed />
  </div>
</div>

<div className="h-[100vh]"/>

<div className="z-10" ref={section6Ref}>
<div className="w-full max-w-4xl mx-auto px-4 relative">
  <Reveal>
      <h2 className="text-3xl md:text-5xl font-bold text-[#4F5962] dark:text-white mb-6 text-center transition">
        Questions?
      </h2>
  </Reveal>
  <Reveal margin="-150px">
      <p className="text-lg text-[#91989E] dark:text-[#D4E3FF] text-center mb-12 transition">
        You’re not the only one wondering. Here’s what people usually ask.
      </p>
  </Reveal>
      <div className="space-y-4">
        {faqs.map((faq, i) => {
          const contentRef = useRef(null);
          const isOpen = openIndex === i;

          return (
            <Reveal key={i}>
            <div
              key={i}
              className="border border-[#E0ECFC] dark:border-[#4F596240] rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex justify-between items-center px-5 py-4 bg-white dark:bg-[#2A313D] text-left text-[#4F5962] dark:text-white font-semibold transition"
              >
                {faq.question}
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 cursor-pointer ${
                    isOpen ? "" : "rotate-[-90deg]"
                  }`}
                />
              </button>

              <div
                ref={contentRef}
                style={{
                  maxHeight: isOpen ? `${contentRef.current?.scrollHeight}px` : "0px",
                }}
                className="px-5 overflow-hidden transition-all duration-300 ease-in-out backdrop-blur-xs bg-white/50 dark:bg-black/20"
              >
                <div className="pb-4 text-[#91989E] dark:text-[#D4E3FF] text-sm leading-relaxed mt-3 transition">
                  {faq.answer}
                </div>
              </div>
            </div>
            </Reveal>
          );
        })}
      </div>
    </div>
<Reveal className="h-[100vh] flex flex-col justify-center items-center" margin={"-" + (window.innerHeight/3) + 'px'} yOffset={0} delay={.5}>
<div className="text-center mt-32 pb-20 pt-20 border-t border-b border-[#4F596240] dark:border-white/10 px-6 transition relative">
  <h2 className="text-4xl md:text-5xl font-bold text-[#4F5962] dark:text-white mb-6 transition">
    Ready to Dew this?
  </h2>
  <p className="text-lg md:text-xl text-[#91989E] dark:text-[#D4E3FF] mb-10 max-w-2xl mx-auto transition">
    Start checking off tasks today.
  </p>
  <button
    onClick={() => {
      audio("open-modal", false);
      vibration("button-press");
      setShowModal(true);
    }}
    className="bg-[#4C6CA8] hover:bg-[#3A5D91] text-white px-10 py-4 rounded-2xl text-lg font-semibold transition cursor-pointer"
  >
    Login
  </button>
</div>
</Reveal>
<footer className=" translate-y-10 text-center text-sm text-[#91989E] dark:text-[#D4E3FF]  flex flex-col items-center gap-4 transition">
  <img
    src={DewList_Logo}
    alt="DewList Logo"
    className="w-10 h-10 opacity-80"
  />
  <p className="max-w-md text-center text-base">
    <strong>DewList</strong> is a minimalist to-do app and powerful <strong>ADHD productivity tool</strong>. 
    Designed to reduce overwhelm, boost focus, and help neurodivergent users tackle one task at a time, without distractions or decision fatigue.
  
  </p>
  <div className="flex gap-4 mt-0">
    <FaInstagram className="w-6 h-6 text-[#4F5962] dark:text-white cursor-pointer hover:opacity-80 transition" onClick={()=>{audio('open-modal', false); window.open('https://instagram.com/dewlist.app', '_blank')}} />
    <FaFacebook className="w-6 h-6 text-[#4F5962] dark:text-white cursor-pointer hover:opacity-80 transition" onClick={()=>{audio('open-modal', false); window.open('https://www.facebook.com/dewlistapp', '_blank')}} />
    <FaLinkedin className="w-6 h-6 text-[#4F5962] dark:text-white cursor-pointer hover:opacity-80 transition" onClick={()=>{audio('open-modal', false); window.open('https://www.linkedin.com/company/dewlist', '_blank')}} />
  </div>
  
  <p>
    <a
      onPointerDown={()=>{audio('open-modal', false); vibration('button-press')}}
      href="https://docs.google.com/document/d/1GQj9gn08KF13Wp9hGQL5dqdGIScAZgcbqiUuOO7_qaw/edit?usp=sharing"
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-[#4F5962] dark:hover:text-white"
    >
      Privacy Policy
    </a>{" "}
    •{" "}
    <a
      onPointerDown={()=>{audio('open-modal', false); vibration('button-press')}}
      href="https://docs.google.com/document/d/1lHYt0nikDrIXuEd7WNDzlv4GINUaVICziyxYykSXAfM/edit?usp=sharing"
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-[#4F5962] dark:hover:text-white"
    >
      Terms & Conditions
    </a>
  </p>
</footer>
</div>


      {showModal && (
        
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <AnimatePresence mode="wait" >
          <motion.div 
          layout
      key="modal"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-2xl p-6 md:p-10 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-center text-[#4F5962] dark:text-white mb-4">
              Welcome Back!
            </h2>
            <p className="text-center text-[#91989E] mb-6">
              Log in with a password or a magic link.
            </p>
            {showPasswordIncorrect && (
              <p className="text-center text-[#D66565] mb-6">
                Incorrect password. <br /> Try again or login with magic link!
              </p>
            )}
            {status === "success" ? (
  <div className="flex flex-col items-center justify-center gap-2 text-[#4BAF8E] font-medium text-center text-2xl">
    <div className="flex items-center gap-2">
    <CheckCircle className="w-6 h-6" />
    Magic link sent!
    </div> 
    <span className="text-[12.5px]">
      Check your inbox (and spam, just in case)
    </span>
  </div>
) : (
  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
    <input
      type="email"
      placeholder="you@email.com"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      required
      className="w-full rounded-2xl border border-[#4F596254] dark:border-white text-[#4F5962] dark:text-white px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
    />
    <AnimatePresence mode="wait" initial={false}>
    {!selectedMagicLinkAuth && (
      <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden">
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full rounded-2xl border border-[#4F596254] dark:border-white text-[#4F5962] dark:text-white px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
      />
      </motion.div>
    )}
    </AnimatePresence>
    {
      // This input is bot bait and not actually used for confirming password
    }
    <input
      name="passwordConfirm"
      type="password"
      value={passwordConfirm}
      onChange={(e) => setPasswordConfirm(e.target.value)}
      className="w-full rounded-2xl border border-[#4F596254] dark:border-white text-[#4F5962] dark:text-white px-5 py-4 text-lg focus:outline-none hidden focus:ring-2 focus:ring-[#90A9D6]"
    />

    <button
      type="submit"
      onPointerDown={() => {
        audio("button-press", false);
        vibration("button-press");
      }}
      disabled={status === "loading"}
      className="bg-[#4C6CA8] hover:bg-[#3A5D91] text-white py-3 rounded-2xl text-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
    >
      {status === "loading"
        ? selectedMagicLinkAuth
          ? <span className="flex justify-center items-center gap-1">Sending <span className="mt-2"><DotLoader/></span></span>
          : <span className="flex justify-center items-center gap-1">Logging In <span className="mt-2"><DotLoader/></span></span>
        : selectedMagicLinkAuth
        ? "Send Magic Link"
        : "Login"}
    </button>

    {status === "error" && (
      <p className="text-[#D66565] text-sm text-center whitespace-pre-line">{error}</p>
    )}

    <button
      type="button"
      onClick={() => {
        audio("button-press", false);
        vibration("button-press");
        setSelectedMagicLinkAuth(!selectedMagicLinkAuth);
      }}
      className="text-sm text-[#4C6CA8] hover:text-[#3A5D91] dark:text-[#90A9D6] dark:hover:text-[#D4E3FF] transition underline text-center cursor-pointer"
    >
      {selectedMagicLinkAuth
        ? "Use password instead"
        : "Login with magic link instead"}
    </button>
  </form>
)}


            <p className="mt-6 text-xs text-[#91989E] text-center">
              By continuing, you agree to our <a className="underline text-[#4C6CA8] hover:text-[#3A5D91] dark:text-[#90A9D6] dark:hover:text-[#D4E3FF] transition" 
              onPointerDown={()=>{audio('open-modal', false); vibration('button-press')}}
              target="_blank"
              rel="noopener noreferrer"
              href="https://docs.google.com/document/d/1GQj9gn08KF13Wp9hGQL5dqdGIScAZgcbqiUuOO7_qaw/edit?usp=sharing">
                Privacy Policy
              </a> and <a className="underline text-[#4C6CA8] hover:text-[#3A5D91] dark:text-[#90A9D6] dark:hover:text-[#D4E3FF] transition" 
              onPointerDown={()=>{audio('open-modal', false); vibration('button-press')}}
              target="_blank"
              rel="noopener noreferrer"
              href="https://docs.google.com/document/d/1lHYt0nikDrIXuEd7WNDzlv4GINUaVICziyxYykSXAfM/edit?usp=sharing">
                Terms & Conditions
              </a>.
            </p>

            <button
              onClick={() => {
                audio("close-modal", false);
                vibration("button-press");
                setShowModal(false);
              }}
              className="mt-4 block mx-auto text-sm text-[#91989E] hover:text-[#4F5962] dark:hover:text-white cursor-pointer transition"
            >
              Cancel
            </button>
          </motion.div>
          </AnimatePresence>
        </div>
        
      )}
    </div>
  );
}
