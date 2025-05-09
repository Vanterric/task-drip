import { useState } from "react";
import { vibration } from "../utilities/vibration";
import { ChevronDown } from "lucide-react";

export default function FeedbackModal({ onClose }) {
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState("Feature Request");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    vibration("button-press");

    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/sendFeedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          type: feedbackType,
          message: feedbackText,
        }),
      });

      onClose();
    } catch (err) {
      console.error("Feedback submission failed", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-[#4F5962] dark:text-white cursor-default">
          Got something to share?
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative">
          <ChevronDown className="absolute right-4 top-3 text-[#4F5962] dark:text-white pointer-events-none" />
          <select
            value={feedbackType}
            onChange={(e) => setFeedbackType(e.target.value)}
            className="appearance-none w-full px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6] bg-white dark:bg-[#4F5962] text-[#4F5962] dark:text-white cursor-pointer"
          >
            <option>Feature Request</option>
            <option>Bug Report</option>
            <option>Kudos</option>
            <option>Press</option>
            <option>Other</option>
          </select>
          
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Tell us what’s on your mind..."
            className="w-full px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6] h-28 resize-none bg-white dark:bg-[#4F5962] text-[#4F5962] dark:text-white"
          />

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => {
                vibration("button-press");
                onClose();
              }}
              className="text-sm text-[#91989E] dark:hover:text-white hover:text-[#4F5962] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#4C6CA8] text-white px-5 py-2 rounded-xl hover:bg-[#3A5D91] transition cursor-pointer"
            >
              {submitting ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
