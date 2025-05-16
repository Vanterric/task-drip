import { Check, CheckCircle, ChevronDown, Moon, RefreshCw, Sun } from "lucide-react";
import { useContext, useRef, useState } from "react";
import { vibration } from "../../utilities/vibration";
import DewList_Logo from "../../assets/DewList_Logo.png";
import { ListTodo, Sparkles, Bot } from "lucide-react";
import { ThemeContext } from "../../context/ThemeContext";

export default function LoginPage() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
  {
    question: "Do I have to pay?",
    answer:
      "Not unless you want to. The free tier is surprisingly generous and sticks around forever. Go Pro if you want more features or just feel like buying me a fancy coffee.",
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


  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    vibration("button-press");

    try {
      const res = await fetch(`${BACKEND_URL}/auth/request-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAECE5] dark:bg-[#212732] px-6 py-20 transition overflow-x-hidden cursor-default">
      <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-[#D4E3FF] dark:bg-[#4C6CA8] opacity-30 blur-[100px] rounded-full z-[1]"></div>

      <button onClick={() => {vibration('button-press'); setIsDarkMode(!isDarkMode);}} className="p-2 rounded-full z-5 hover:bg-gray-200 dark:hover:bg-gray-800 transition cursor-pointer fixed bottom-4 left-4">
            {isDarkMode ? (
              <Sun className="w-10 h-10 text-white" />
            ) : (
              <Moon className="w-10 h-10 text-[#4F5962]" />
            )}
          </button>
      <div className="text-center flex items-center justify-center flex-col h-[80vh]">
        
        <img src={DewList_Logo} alt="DewList Logo" className="w-32 mb-6" />
        <h1 className="text-4xl md:text-6xl font-bold text-[#4F5962] dark:text-white mb-6 text-center transition">
          One task at a time.
        </h1>
        <p className="text-lg md:text-xl text-[#91989E] dark:text-[#D4E3FF] mb-8 text-center max-w-2xl transition">
          DewList helps ADHD brains focus by showing just one task at a time. No clutter. No chaos. Just clarity.
        </p>
        <button
          onClick={() => {
            vibration("button-press");
            setShowModal(true);
          }}
          className="bg-[#4C6CA8] hover:bg-[#3A5D91] text-white px-8 py-4 rounded-2xl text-lg font-semibold transition cursor-pointer"
        >
          Try it free
        </button>
      </div>

      <div className="w-full px-6 py-20 bg-white dark:bg-[#1C222C] transition flex flex-col md:flex-row items-center gap-10 max-w-6xl mx-auto">
  {/* Visual Mockup */}
  <div className="w-full md:w-1/2 flex justify-center">
  <div className="rounded-3xl border border-[#E0ECFC] dark:border-[#4F596240] shadow-xl p-6 bg-white dark:bg-[#4F5962] w-full max-w-md space-y-6 transition">
    <div className="text-center text-xl font-semibold text-[#4F5962] dark:text-white transition">
      Build landing page section 2.
    </div>

    <div className="flex gap-4 justify-center">
      <button
        className="group flex items-center gap-2 bg-[#4BAF8E] text-white px-5 py-3 rounded-xl shadow hover:bg-[#3B8F75] hover:scale-105 active:scale-100 transition-all duration-200 ease-in-out"
      >
        <CheckCircle className="w-5 h-5 text-white group-hover:scale-110 group-hover:rotate-[10deg] transition-transform" />
        Done
      </button>
      <button
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
  <div className="absolute top-[-100px] right-[0px] w-[300px] h-[300px] bg-[#D4E3FF] dark:bg-[#4C6CA8] opacity-30 blur-[100px] rounded-full z-[1]"></div>
  <h2 className="text-3xl font-bold text-[#4F5962] dark:text-white mb-6 transition">Why DewList works</h2>
  <ul className="space-y-6">
    <li className="flex items-start gap-3">
      <ListTodo className="w-15 h-15 text-[#4C6CA8] mt-1 mr-1" />
      <div>
        <p className="text-lg font-semibold text-[#4F5962] dark:text-white transition">Just one task, seriously.</p>
        <p className="text-[#91989E] dark:text-[#D4E3FF] transition">DewList keeps your mind clear by showing only your current task. You can’t overthink a list you can’t see.</p>
      </div>
    </li>
    <li className="flex items-start gap-3">
      <Sparkles className="w-15 h-15 text-[#4C6CA8] mt-1 mr-1" />
      <div>
        <p className="text-lg font-semibold text-[#4F5962] dark:text-white transition">ADHD-calibrated design.</p>
        <p className="text-[#91989E] dark:text-[#D4E3FF] transition">Minimal UI. Gentle colors. Subtle haptics. Everything is tuned to reduce overwhelm and help you finish what you start.</p>
      </div>
    </li>
    <li className="flex items-start gap-3">
      <Bot className="w-15 h-15 text-[#4C6CA8] mt-2 mr-1" />
      <div>
        <p className="text-lg font-semibold text-[#4F5962] dark:text-white transition">Built-in task helper.</p>
        <p className="text-[#91989E] dark:text-[#D4E3FF] transition">Write what you want to get done, and DewList gently breaks it into steps using AI. It’s like your to-do list finally gets you.</p>
      </div>
    </li>
  </ul>
</div>
</div>

<div className="w-full flex flex-col md:flex-row items-center justify-between gap-12 mt-50 max-w-6xl">
  
  <div className="w-full md:w-1/2 text-left">
  
    <h2 className="text-3xl font-bold text-[#4F5962] dark:text-white mb-6 transition">
      Built with you
    </h2>
    <p className="text-lg text-[#91989E] dark:text-[#D4E3FF] mb-4 transition">
      DewList isn’t bloated with features you’ll never use. We only build what you ask for—seriously.
    </p>
    <p className="text-lg text-[#91989E] dark:text-[#D4E3FF] mb-4 transition">
      Got an idea? Something not working? A random dopamine-fueled insight at 2 a.m.?
    </p>
    <p className="text-lg text-[#4C6CA8] dark:text-[#D4E3FF] font-semibold transition">
      Ask, and we shall dew.
    </p>
  </div>

  <div className="w-full md:w-1/2 flex justify-center">
    <div className="rounded-3xl border border-[#E0ECFC] dark:border-[#4F596240] bg-white dark:bg-[#2A313D] p-6 w-full max-w-md shadow-lg space-y-4 transition">
      <div className="bg-[#F6F8FA] dark:bg-[#4F5962] rounded-xl p-4 transition">
        <p className="text-sm text-[#4F5962] dark:text-white font-semibold transition">
          “Can you add a widget that shows task history?”
        </p>
        <p className="text-xs text-[#91989E] mt-1">— You, probably</p>
      </div>
      <div className="bg-[#FAECE5] dark:bg-[#3A3F4F] rounded-xl p-4 transition">
        <p className="text-sm text-[#4F5962] dark:text-white font-semibold transition">
          “Done. It’s live.”
        </p>
        <p className="text-xs text-[#91989E] mt-1 transition">— Us, like 3 days later</p>
      </div>
    </div>
  </div>
</div>

<div className="w-full py-20 px-4 md:px-10 bg-[#FAECE5] bg-white dark:bg-[#1C222C] max-w-6xl mt-50 relative transition">
  <div className="absolute bottom-[-200px] left-[-100px] w-[300px] h-[300px] bg-[#D4E3FF] dark:bg-[#4C6CA8] opacity-30 blur-[100px] rounded-full z-[1]"></div>
  <h2 className="text-3xl md:text-4xl font-bold text-center text-[#4F5962] dark:text-white mb-12 transition">
    What people are saying
  </h2>
  <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-3">
    {[
  {
    name: "Davie, 21",
    role: "CS Master's Student",
    quote: "Overall, it's clean. I love it. I love the glowing hover, amazing animations - small details like that make a difference."
  },
  /* {
    name: "Ruthie, 60",
    role: "Real Estate Agent",
    quote: "I asked for dark mode. I got dark mode (And it looks soooooo good). Talk about excellent customer service!"
  }, */
  {
    name: "Brandon, 25",
    role: "Marketing at DewList",
    quote: "Been Pro for months. Never used the AI. I’m too stubborn. But one task at a time? That’s the kind of micromanagement I can handle."
  },
  /* {
    name: "David, 57",
    role: "Healthcare Executive",
    quote: "For home-based tasks on mobile, DewList is the best. Very easy to use, and completing tasks feels rewarding. Keep it up!"
  }, */
  /* {
    name: "Sara, 28",
    role: "Designer",
    quote: "I love the simplicity. I can focus on one task at a time without getting overwhelmed. The design is clean and easy to use."
  }, */
  {
    name: "Derrick, 30",
    role: "Founder of DewList",
    quote: "I used DewList to build DewList! Super helpful. And my favorite feature? The haptics for sure. I’m a sucker for a good buzz."
  }     
    ].map(({ name, role, quote }, i) => (
      <div
        key={i}
        className="bg-white dark:bg-[#4F5962] border border-[#E0ECFC] dark:border-[#4F596240] rounded-3xl p-6 shadow-md flex flex-col justify-between transition"
      >
        <p className="text-[#4F5962] dark:text-[#D4E3FF] text-base leading-relaxed mb-4 transition">“{quote}”</p>
        <div className="text-sm text-[#91989E] dark:text-[#D4E3FF]/70 transition">
          — {name}, {role}
        </div>
      </div>
    ))}
  </div>
</div>


<div className="w-full max-w-6xl mx-auto mt-20 px-4">
  <h2 className="text-3xl md:text-5xl font-bold text-[#4F5962] dark:text-white mb-6 text-center transition">
    Pick your pace
  </h2>
  <p className="text-lg text-[#91989E] dark:text-[#D4E3FF] text-center max-w-2xl mx-auto mb-12 transition">
    DewList starts simple. If it helps, go Pro. If not, no stress.
  </p>

  <div className="flex flex-col md:flex-row gap-6 justify-center">
    {/* Free Tier */}
    <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-lg p-8 w-full max-w-sm border border-[#E0ECFC] dark:border-[#4F596240] flex flex-col justify-between transition">
      <div>
        <h3 className="text-3xl font-bold text-[#4F5962] dark:text-white mb-2 transition">Free</h3>
        <p className="text-xl font-extrabold text-[#4C6CA8] dark:text-[#90A9D6] mb-4 transition">Forever</p>
        <ul className="text-[#4F5962] dark:text-[#D4E3FF] space-y-2 text-left transition">
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> 5 tasks per list</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> 3 lists total</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> Sync across devices</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> No required upgrade</li>
        </ul>
      </div>

      <button
        onClick={() => {
          vibration("button-press");
          setShowModal(true);
        }}
        className="mt-6 bg-[#4C6CA8] hover:bg-[#3A5D91] text-white py-3 px-6 rounded-xl font-semibold transition cursor-pointer"
      >
        Try it Free
      </button>
    </div>

    {/* Pro Tier */}
    <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-lg p-8 w-full max-w-sm border border-[#E0ECFC] dark:border-[#4F596240] flex flex-col justify-between transition">
      <div>
        <h3 className="text-3xl font-bold text-yellow-500 dark:text-yellow-300 mb-2 transition">Pro</h3>
        <p className="text-xl font-extrabold text-[#4C6CA8] mb-4 dark:text-[#90A9D6] transition">$5/mo · $30/yr · $100 once</p>
        <ul className="text-[#4F5962] dark:text-[#D4E3FF] space-y-2 text-left transition">
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> Unlimited tasks</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> Unlimited lists</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> AI task breakdowns</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> Priority feature requests</li>
          <li className="flex items-center gap-2"><Check className="w-5 h-5" /> $100 forever option if you’re bold</li>
        </ul>
      </div>

      <button
        onClick={() => {
          vibration("button-press");
          setShowModal(true);
        }}
        className="mt-6 bg-[#4C6CA8] hover:bg-[#3A5D91] text-white py-3 px-6 rounded-xl font-semibold transition cursor-pointer"
      >
        Try it Free
      </button>
    </div>
  </div>

  <p className="mt-10 text-sm text-[#91989E] dark:text-[#D4E3FF] text-center transition">
    No trials. No weird timers. Just use it. Upgrade if it helps.
  </p>
</div>


<div className="w-full max-w-4xl mx-auto mt-32 px-4 relative">
  <div className="absolute bottom-[100px] right-[-500px] w-[300px] h-[300px] bg-[#D4E3FF] dark:bg-[#4C6CA8] opacity-30 blur-[100px] rounded-full z-[1]"></div>
      <h2 className="text-3xl md:text-5xl font-bold text-[#4F5962] dark:text-white mb-6 text-center transition">
        Questions?
      </h2>
      <p className="text-lg text-[#91989E] dark:text-[#D4E3FF] text-center mb-12 transition">
        You’re not the only one wondering. Here’s what people usually ask.
      </p>

      <div className="space-y-4">
        {faqs.map((faq, i) => {
          const contentRef = useRef(null);
          const isOpen = openIndex === i;

          return (
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
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                ref={contentRef}
                style={{
                  maxHeight: isOpen ? `${contentRef.current?.scrollHeight}px` : "0px",
                }}
                className="px-5 overflow-hidden transition-all duration-300 ease-in-out"
              >
                <div className="pb-4 text-[#91989E] dark:text-[#D4E3FF] text-sm leading-relaxed mt-3 transition">
                  {faq.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

<div className="text-center mt-32 pt-20 border-t border-[#4F596240] dark:border-white/10 px-6 transition relative">
<div className="absolute bottom-[-200px] left-[-800px] w-[300px] h-[300px] bg-[#D4E3FF] dark:bg-[#4C6CA8] opacity-30 blur-[100px] rounded-full z-[1]"></div>
  <h2 className="text-4xl md:text-5xl font-bold text-[#4F5962] dark:text-white mb-6 transition">
    Ready to Dew this?
  </h2>
  <p className="text-lg md:text-xl text-[#91989E] dark:text-[#D4E3FF] mb-10 max-w-2xl mx-auto transition">
    Start checking off tasks today.
  </p>
  <button
    onClick={() => {
      vibration("button-press");
      setShowModal(true);
    }}
    className="bg-[#4C6CA8] hover:bg-[#3A5D91] text-white px-10 py-4 rounded-2xl text-lg font-semibold transition cursor-pointer"
  >
    Try it Free
  </button>
</div>

<footer className="mt-10 translate-y-10 pt-20 text-center text-sm text-[#91989E] dark:text-[#D4E3FF] border-t border-[#4F596240] dark:border-white/10 flex flex-col items-center gap-4 transition">
  <img
    src={DewList_Logo}
    alt="DewList Logo"
    className="w-10 h-10 opacity-80"
  />
  <p className="max-w-md text-center text-base">
    <strong>DewList</strong> is a minimalist to-do app and powerful <strong>ADHD productivity tool</strong>. 
    Designed to reduce overwhelm, boost focus, and help neurodivergent users tackle one task at a time, without distractions or decision fatigue.
  
  </p>
  <p>
    <a
      href="https://docs.google.com/document/d/1GQj9gn08KF13Wp9hGQL5dqdGIScAZgcbqiUuOO7_qaw/edit?usp=sharing"
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-[#4F5962] dark:hover:text-white"
    >
      Privacy Policy
    </a>{" "}
    •{" "}
    <a
      href="https://docs.google.com/document/d/1lHYt0nikDrIXuEd7WNDzlv4GINUaVICziyxYykSXAfM/edit?usp=sharing"
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-[#4F5962] dark:hover:text-white"
    >
      Terms & Conditions
    </a>
  </p>
</footer>



      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-2xl p-6 md:p-10 max-w-lg w-full">
            <h2 className="text-2xl font-bold text-center text-[#4F5962] dark:text-white mb-4">
              Welcome to DewList
            </h2>
            <p className="text-center text-[#91989E] mb-6">
              We'll email you a magic login link. No passwords, no pressure.
            </p>

            {status === "success" ? (
              <div className="flex items-center justify-center gap-2 text-[#4BAF8E] font-medium text-center text-lg">
                <CheckCircle className="w-5 h-5" />
                Magic link sent! Check your inbox.
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
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="bg-[#4C6CA8] hover:bg-[#3A5D91] text-white py-3 rounded-2xl text-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {status === "loading" ? "Sending..." : "Send Magic Link"}
                </button>
                {status === "error" && (
                  <p className="text-[#DF7C52] text-sm text-center">{error}</p>
                )}
              </form>
            )}

            <p className="mt-6 text-xs text-[#91989E] text-center">
              By continuing, you agree to our <a className="underline text-[#4C6CA8] hover:text-[#3A5D91] dark:text-[#90A9D6] dark:hover:text-[#D4E3FF] transition" 
              target="_blank"
              rel="noopener noreferrer"
              href="https://docs.google.com/document/d/1GQj9gn08KF13Wp9hGQL5dqdGIScAZgcbqiUuOO7_qaw/edit?usp=sharing">
                Privacy Policy
              </a> and <a className="underline text-[#4C6CA8] hover:text-[#3A5D91] dark:text-[#90A9D6] dark:hover:text-[#D4E3FF] transition" 
              target="_blank"
              rel="noopener noreferrer"
              href="https://docs.google.com/document/d/1lHYt0nikDrIXuEd7WNDzlv4GINUaVICziyxYykSXAfM/edit?usp=sharing">
                Terms & Conditions
              </a>.
            </p>

            <button
              onClick={() => {
                vibration("button-press");
                setShowModal(false);
              }}
              className="mt-4 block mx-auto text-sm text-[#91989E] hover:text-[#4F5962] dark:hover:text-white cursor-pointer transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
