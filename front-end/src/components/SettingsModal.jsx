import { useContext, useState } from "react";
import { vibration } from "../utilities/vibration";
import { useAuth } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { capitalizeFirst } from "../utilities/capitalizeFirst";

export default function SettingsModal({ isOpen, onClose }) {
  
  const [saving, setSaving] = useState(false);
  const {user} = useAuth();
  const { isDarkMode, setIsDarkMode } = useContext(ThemeContext);
  const { token } = useAuth();
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const [email, setEmail] = useState(user.email);
    const [theme, setTheme] = useState(isDarkMode ? "dark" : "light"); // 'light', 'dark', or 'system'
    const [resetPassword, setResetPassword] = useState("");
  const [status, setStatus] = useState("idle"); // 'idle', 'loading', 'success', 'error'
  const [error, setError] = useState("");
    const [defaultView, setDefaultView] = useState(localStorage.getItem("defaultView") || "one-task"); // 'list' or 'one-task'
    const [defaultTaskState, setDefaultTaskState] = useState(localStorage.getItem("defaultTaskState") || "collapsed"); // 'collapsed' or 'expanded'
  


  const handleSave = async () => {
    vibration("button-press");
    setSaving(true);
    if (!email || !email.includes("@")) {
      setSaving(false);
      setStatus("error");
      setError("Please enter a valid email.");
      return;
    }
    theme === "system" ? setIsDarkMode(systemTheme === "dark") : setIsDarkMode(theme === "dark");
    defaultView && localStorage.setItem("defaultView", defaultView);
    defaultTaskState && localStorage.setItem("defaultTaskState", defaultTaskState);
    if(email !== user.email){
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/changeEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ newEmail: email, userId: user.id }),
    });
    if (!res.ok) {
      setSaving(false);
        const error = await res.json();
        alert(`Error saving settings: ${error.error}`);
        return;
    }
  }
    if(resetPassword.trim()!==""){
      await handleResetPassword();
    }
    else{
      setStatus("idle");
      setError("");
    }
    setSaving(false);
    onClose();
  };

  const handleResetPassword = async () => {
  if (!resetPassword || resetPassword.trim().length < 6) {
    setError("Password must be at least 6 characters.");
    return;
  }

  try {
    setStatus("loading");
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/auth/resetPassword`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ password:resetPassword }),
    });

    const data = await res.json();

    if (res.ok) {
      setStatus("success");
      // Optional: show success toast, redirect, or close modal
    } else {
      setStatus("error");
      setError(data.error || "Something went wrong.");
    }
  } catch (err) {
    console.error(err);
    setStatus("error");
    setError("Unable to connect to the server.");
  }
};


  const handleManageSubscription = async () => {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/create-customer-portal-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ userId: user.id }),
  });

  const { url } = await res.json();
  window.location.href = url;
};


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-[#4F5962] dark:text-white cursor-default">
          Settings
        </h2>

        <div className="flex flex-col gap-4 text-[#4F5962] dark:text-white text-sm max-h-[50vh] overflow-y-auto">

          {/* Email */}
          <div>
            <label className="font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
            />
          </div>
          {/*Reset Password*/}
          <div>
            <label className="font-medium" htmlFor="reset-password">Set New Password</label>
            <div>
            <input
              id="reset-password"
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              className="mt-1 w-full px-4 py-2 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
            />
            {status === "error" && <p className="text-sm text-[#D66565] mt-1">{error}</p>}
            {status === "success" && <p className="text-sm text-green-500 mt-1">Password reset successfully!</p>}
            </div>
          </div>

          {/* Subscription */}
          <div>
            <p className="font-medium">Subscription: {user.proSubscriptionType ? capitalizeFirst(user.proSubscriptionType) : user.isPro ? "One Month Pro Free" : "Free Plan"}</p>
            <div className="flex gap-2 mt-2">
              {user.isPro ? user.proSubscriptionType !== 'lifetime' && user.proSubscriptionType !== null ? <button className="text-sm underline hover:opacity-70 cursor-pointer" onClick={() => {vibration('button-press'); handleManageSubscription()}}>
                Manage Subscription
              </button> : user.proSubscriptionType === 'lifetime' ? <p className="text-sm italic">Thanks for being a lifetime member!</p> : <p className="text-sm italic">Thanks for trying out DewList!</p> : <button className="text-sm underline hover:opacity-70 cursor-pointer" onClick={() => {vibration('button-press'); window.location.href = '/subscribe'}}>
                Upgrade
              </button>}
            </div>
          </div>

          {/*Default View (List or One-Task)*/}
          <div>
            <label className="font-medium">Default View</label>
            <select
              value={defaultView}
              onChange={(e) => {
                vibration("button-press");
                setDefaultView(e.target.value);
              }}
              className="mt-1 w-full px-4 py-2 border border-[#4F596254] dark:border-white rounded-xl bg-white dark:bg-[#4F5962] focus:outline-none focus:ring-2 focus:ring-[#90A9D6] text-[#4F5962] dark:text-white"
            >
              <option value="list">List</option>
              <option value="one-task">One Task</option>
            </select>
          </div>

          {/*Default Task State (Collapsed or Expanded)*/}
          <div>
            <label className="font-medium">Default Task State</label>
            <select
              value={defaultTaskState}
              onChange={(e) => {
                vibration("button-press");
                setDefaultTaskState(e.target.value);
              }}
              className="mt-1 w-full px-4 py-2 border border-[#4F596254] dark:border-white rounded-xl bg-white dark:bg-[#4F5962] focus:outline-none focus:ring-2 focus:ring-[#90A9D6] text-[#4F5962] dark:text-white"
            >
              <option value="collapsed">Collapsed</option>
              <option value="expanded">Expanded</option>
            </select>
          </div>

          {/* Theme dropdown */}
          <div>
            <label htmlFor="theme" className="font-medium">
              Theme
            </label>
            <select
              id="theme"
              value={theme}
              onChange={(e) => {
                vibration("button-press");
                setTheme(e.target.value);
              }}
              className="mt-1 w-full px-4 py-2 border border-[#4F596254] dark:border-white rounded-xl bg-white dark:bg-[#4F5962] focus:outline-none focus:ring-2 focus:ring-[#90A9D6] text-[#4F5962] dark:text-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <hr className="mt-5"/>
          <h2 className="text-lg font-bold mb-0 text-[#4F5962] dark:text-white cursor-default">Danger Zone</h2>
          
            {/*Delete Account*/}
            <div>
            <p className="text-sm text-[#D66565] hover:text-[#B94E4E] w-fit font-medium mt-2 transition cursor-pointer" onClick={()=>{window.location.href = `mailto:support@dewlist.app?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20account%20with%20the%20email%20${user.email}.`}}>
              Delete Account
            </p>
            </div>
          {/* Support */}
          <div>
            <p className="text-xs mt-1">
              Have a question or need support? Email us at{" "}
              <a
                href="mailto:support@dewlist.app"
                className="underline hover:opacity-70"
              >
                support@dewlist.app
              </a>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-5 items-center mt-6">
          <button
            onClick={() => {
              vibration("button-press");
              onClose();
            }}
            className="text-sm text-[#91989E] dark:hover:text-white hover:text-[#4F5962] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#4C6CA8] text-white px-5 py-2 rounded-xl hover:bg-[#3A5D91] transition cursor-pointer"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
