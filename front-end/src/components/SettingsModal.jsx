import { useContext, useEffect, useState } from "react";
import { vibration } from "../utilities/vibration";
import { useAuth } from "../context/AuthContext";
import { ThemeContext } from "../context/ThemeContext";
import { capitalizeFirst } from "../utilities/capitalizeFirst";
import Dropdown from "./Dropdown";
import { AnimatePresence, motion } from "framer-motion";
import { audio, isMuted, setIsMuted } from "../utilities/audio";
import { Switch } from "@headlessui/react";

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
  const [muteSelected, setMuteSelected] = useState(localStorage.getItem("isMuted") === "true");
    const [defaultView, setDefaultView] = useState(localStorage.getItem("defaultView") || "one-task"); // 'list' or 'one-task'
    const [defaultTaskState, setDefaultTaskState] = useState(localStorage.getItem("defaultTaskState") || "collapsed"); // 'collapsed' or 'expanded'
  const [notificationSettings, setNotificationSettings] = useState({
  pushLogin: user.pushForInactivity,
  emailLogin: user.emailForInactivity,
  pushReset: user.pushForReset,
  emailReset: user.emailForReset,
  pushDewDate: user.pushForDewDate,
  emailDewDate: user.emailForDewDate,
});

useEffect(() => {
  setMuteSelected(isMuted);
}, [isMuted]);




  const handleSave = async () => {
    setSaving(true);
    if (!email || !email.includes("@")) {
      setSaving(false);
      setStatus("error");
      setError("Please enter a valid email.");
      return;
    }
    if (muteSelected) {
      localStorage.setItem("isMuted", "true");
      setIsMuted(true);
    } else {
      localStorage.setItem("isMuted", "false");
      setIsMuted(false);
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

const defaultNotificationSettings = {
  pushLogin: user.pushForInactivity,
  emailLogin: user.emailForInactivity,
  pushReset: user.pushForReset,
  emailReset: user.emailForReset,
  pushDewDate: user.pushForDewDate,
  emailDewDate: user.emailForDewDate,
};

if (JSON.stringify(notificationSettings) !== JSON.stringify(defaultNotificationSettings)) {
  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/setNotificationPreferences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ 
      emailForInactivity: notificationSettings.emailLogin,
      emailForReset: notificationSettings.emailReset,
      emailForDewDate: notificationSettings.emailDewDate,
      pushForInactivity: notificationSettings.pushLogin,
      pushForReset: notificationSettings.pushReset,
      pushForDewDate: notificationSettings.pushDewDate
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    alert(`Error saving notification settings: ${error.error}`);
    return;
  }
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


const NotificationSettings = ({ settings, setSettings }) => {
  const toggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div>
      <table className="table-auto w-full border-collapse">
        <thead>
          <tr>
            <th className="w-1/3"></th>
            <th className="text-xs font-semibold text-text-info dark:text-text-darkinfo text-left px-5 pb-1 pt-3">Push</th>
            <th className="text-xs font-semibold text-text-info dark:text-text-darkinfo text-left px-5 pb-1 pt-3">Email</th>
          </tr>
        </thead>
        <tbody className="divide-y text-text-info dark:text-text-darkinfo">
          {[
            { label: "Log In Reminder", pushKey: "pushLogin", emailKey: "emailLogin" },
            { label: "List Reset", pushKey: "pushReset", emailKey: "emailReset" },
            { label: "Task DewDate", pushKey: "pushDewDate", emailKey: "emailDewDate" },
          ].map(({ label, pushKey, emailKey }) => (
            <tr key={label}>
              <td className="text-xs font-medium text-text-info dark:text-text-darkinfo px-4 py-3">{label}</td>
              {[pushKey, emailKey].map((key) => (
                <td key={key} className="px-4 py-3">
                  <button
                    onClick={() => {vibration('button-press'); audio('button-press', isMuted); toggle(key)}}
                    className={`relative w-11 h-6 cursor-pointer flex items-center rounded-full p-1 transition-colors duration-300 ${
                      settings[key] ? "bg-accent-primary dark:bg-accent-focusring" : "bg-text-info dark:bg-text-darkinfo"
                    }`}
                  >
                    <div
                      className={`bg-white dark:bg-text-primary w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        settings[key] ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <AnimatePresence>
      <motion.div layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-xl p-6 w-full max-w-md mx-4">
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
              className="mt-1 w-full px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
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
              className="mt-1 w-full px-4 py-3 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
            />
            {status === "error" && <p className="text-sm text-[#D66565] mt-1">{error}</p>}
            {status === "success" && <p className="text-sm text-green-500 mt-1">Password reset successfully!</p>}
            </div>
          </div>

          {/* Subscription */}
          <div>
            <p className="font-medium">Subscription: {user.proSubscriptionType ? capitalizeFirst(user.proSubscriptionType) : user?.tier !== 'free' ? `${capitalizeFirst(user?.tier)} Trial` : "Free Plan"}</p>
            <div className="flex gap-2 mt-2">
              {user?.tier !== 'free' ? user.proSubscriptionType !== 'lifetime' && user.proSubscriptionType !== null ? <button className="text-sm underline hover:opacity-70 cursor-pointer" onClick={() => {vibration('button-press'); handleManageSubscription()}}>
                Manage Subscription
              </button> : user.proSubscriptionType === 'lifetime' ? <p className="text-sm italic">Thanks for being a lifetime member!</p> : <p className="text-sm italic">Thanks for trying out DewList!</p> : <button className="text-sm underline hover:opacity-70 cursor-pointer" onClick={() => {vibration('button-press'); window.location.href = '/subscribe'}}>
                Upgrade
              </button>}
            </div>
          </div>
          
          {/*Notification Preferences*/}
          <div>
            <h3 className="font-medium">Notification Preferences</h3>
            <NotificationSettings settings={notificationSettings} setSettings={setNotificationSettings} />
          </div>

          {/*Default View (List or One-Task)*/}
          <div>
            <label className="font-medium">Default View</label>
            <Dropdown state={defaultView} setState={setDefaultView} options={[
              { option: "list", label: "List" },
              { option: "one-task", label: "One Task" }
            ]}/>
          </div>

          {/*Default Task State (Collapsed or Expanded)*/}
          <div>
            <label className="font-medium">Default Task State</label>
            <Dropdown state={defaultTaskState} setState={setDefaultTaskState} options={[
              { option: "collapsed", label: "Collapsed" },
              { option: "expanded", label: "Expanded" }
            ]}/>
          </div>

          {/* Theme dropdown */}
          <div>
            <label htmlFor="theme" className="font-medium">
              Theme
            </label>
            <Dropdown
              state={theme}
              setState={setTheme}
              options={[
                { option: "light", label: "Light" },
                { option: "dark", label: "Dark" },
                { option: "system", label: "System" }
              ]}
              />
          </div>
          {/*Mute Toggle*/}
          <div className="flex items-center gap-2 mt-2">
            <label className="font-medium">Mute Application Audio</label>
            <button
                    onClick={() => {vibration('button-press'); audio('button-press', isMuted);  setMuteSelected(!muteSelected)}}
                    className={`relative w-11 h-6 cursor-pointer flex items-center rounded-full p-1 transition-colors duration-300 ${
                      muteSelected ? "bg-accent-primary dark:bg-accent-focusring" : "bg-text-info dark:bg-text-darkinfo"
                    }`}
                  >
                    <div
                      className={`bg-white dark:bg-text-primary w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        muteSelected ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
          </div>
          <hr className="mt-5"/>
          <h2 className="text-lg font-bold mb-0 text-[#4F5962] dark:text-white cursor-default">Danger Zone</h2>
          
            {/*Delete Account*/}
            <div>
            <p className="text-sm text-[#D66565] hover:text-[#B94E4E] w-fit font-medium mt-2 transition cursor-pointer" onClick={()=>{audio('button-press', isMuted); window.location.href = `mailto:support@dewlist.app?subject=Account%20Deletion%20Request&body=Please%20delete%20my%20account%20with%20the%20email%20${user.email}.`}}>
              Delete Account
            </p>
            </div>
          {/* Support */}
          <div>
            <p className="text-xs mt-1">
              Have a question or need support? Email us at{" "}
              <a
                onPointerDown={() => {vibration("button-press"); audio("button-press", isMuted)}}
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
              audio('close-modal', isMuted);
              vibration("button-press");
              onClose();
            }}
            className="text-sm text-[#91989E] dark:hover:text-white hover:text-[#4F5962] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
          onPointerDown={() => {vibration("button-press"); audio("button-press", isMuted)}}
            onClick={handleSave}
            disabled={saving}
            className="bg-[#4C6CA8] text-white px-5 py-2 rounded-xl hover:bg-[#3A5D91] transition cursor-pointer"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>
      </AnimatePresence>
    </div>
  );
}
