import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { CheckCircle } from "lucide-react";

export default function UnlockPage() {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();


  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");

    if (!token) {
      setStatus("error");
      return;
    }

    const validateToken = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/validate?token=${token}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Invalid login link");

        // Save token + user info in localStorage or context
        setToken(data.token);
        setUser(data.user);

        setStatus("success");

        // Brief delay before redirect
        setTimeout(() => {
          navigate("/app");
        }, 1000);
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    };

    validateToken();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#F6F8FA] text-[#4F5962] dark:bg-[#212732] dark:text-white">
      <div className="max-w-md text-center">
        {status === "loading" && <p className="text-xl font-semibold cursor-default">Validating your link...</p>}
        {status === "success" && <p className="flex items-center justify-center gap-2 text-xl text-[#4BAF8E] font-semibold cursor-default"> <CheckCircle className="w-5 h-5" /> You're in! Redirecting...</p>}
        {status === "error" && (
          <>
            <p className="text-xl text-[#DF7C52] font-semibold cursor-default">⚠️ Link invalid or expired.</p>
            <p className="text-sm mt-2 text-[#91989E] cursor-default">Try requesting a new login link.</p>
          </>     
        )}
      </div>
    </div>
  );
}
