import { CheckCircle } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAECE5] px-4 py-10 md:px-10">
      <div className="w-full h-full max-w-4xl bg-white rounded-3xl shadow-lg p-6 md:p-16 flex flex-col justify-center">
        <h1 className="text-3xl md:text-5xl font-bold text-[#4F5962] mb-4 text-center">
          Welcome to DewList
        </h1>
        <p className="text-base md:text-lg text-[#91989E] mb-10 leading-relaxed text-center max-w-2xl mx-auto">
          One task at a time. Built for ADHD brains. We'll email you a magic login link—
          no passwords, no pressure.
        </p>

        {status === "success" ? (
          <div className="flex items-center justify-center gap-2 text-[#4BAF8E] font-medium text-center text-lg">
          <CheckCircle className="w-5 h-5" />
          Magic link sent! Check your inbox.
        </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
            <div className="w-full flex justify-center">
            <input
              type="email"
              className="w-full max-w-lg rounded-2xl border border-[#4F596254] px-5 py-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#90A9D6] transition"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            </div>
            <div className="w-full flex justify-center">
            <button
              type="submit"
              className={`cursor-pointer w-full max-w-lg bg-[#4C6CA8] hover:bg-[#3A5D91] text-white text-lg font-semibold py-4 rounded-2xl transition-all duration-200 ${
                status === "loading" ? "opacity-50 cursor-not-allowed" : ""
              }`}
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Send Magic Link"}
            </button>
            </div>
            {status === "error" && (
              <p className="text-[#DF7C52] text-sm mt-1 text-center">{error}</p>
            )}
          </form>
        )}

        <div className="mt-10 text-xs text-[#91989E] text-center max-w-md mx-auto">
          By continuing, you agree to our <a style={{textDecoration:'underline', color: '#4C6CA8'}} target="_blank" href="https://docs.google.com/document/d/1GQj9gn08KF13Wp9hGQL5dqdGIScAZgcbqiUuOO7_qaw/edit?usp=sharing">Privacy Policy</a> and <a style={{textDecoration:'underline', color: '#4C6CA8'}} target="_blank" href="https://docs.google.com/document/d/1lHYt0nikDrIXuEd7WNDzlv4GINUaVICziyxYykSXAfM/edit?usp=sharing">Terms & Conditions</a>.
          <br/>
          <br/>
          You’ll stay logged in on this device after clicking your email link.
        </div>
      </div>
    </div>
  );
}
