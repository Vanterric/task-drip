import { useState } from "react";
import { vibration } from "../utilities/vibration";

export default function ResetScheduleModal({ onClose, onSubmit = () => {}, taskList, handleClearResetSchedule }) {
  const [number, setNumber] = useState(taskList.resetSchedule?.number || 1);
  const [cadence, setCadence] = useState(taskList.resetSchedule?.cadence || "days");
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [startDate, setStartDate] = useState(taskList.resetSchedule?.startDate ? new Date(taskList.resetSchedule.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const start = taskList.resetSchedule?.startDate
  ? new Date(taskList.resetSchedule.startDate)
  : null;

const initialResetTime = start
  ? start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) // "06:00"
  : "00:00";

const [resetTime, setResetTime] = useState(initialResetTime);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4 text-[#4F5962] dark:text-white cursor-default flex items-center gap-2">
          Set Reset Schedule
          <span className="text-yellow-500 dark:text-yellow-300 border text-xs py-[2px] px-2 rounded-full">Pro</span>
        </h2>
        <p className="text-sm text-[#4F5962] dark:text-white mb-4 cursor-default">
          Want a fresh start? Choose how often to reset tasks in <strong>{taskList.name}</strong>. They’ll be marked incomplete again, on your schedule
        </p>

        <form onSubmit={(e)=>{e.preventDefault(); 
        const [year, month, day] = startDate.split('-').map(Number);
        const [hours, minutes] = resetTime.split(':').map(Number);
        const localStart = new Date(year, month - 1, day, hours, minutes);
        onSubmit(
            taskList._id,
            isNotificationsEnabled,
            {
            number: number,
            cadence: cadence,
            startDate: localStart.toISOString(),
            lastReset: new Date().toISOString()
            },
            taskList.name
        )}} 
            className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-[#4F5962] dark:text-white text-sm">
            <span>Reset this list every</span>

            <select
              value={number}
              onChange={(e) => setNumber(Number(e.target.value))}
              className="px-2 py-1 border border-[#4F596254] dark:border-white rounded-lg bg-transparent focus:outline-none"
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1} className="text-[#4F5962]">
                  {i + 1}
                </option>
              ))}
            </select>

            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value)}
              className="px-2 py-1 border border-[#4F596254] dark:border-white rounded-lg bg-transparent focus:outline-none"
            >
              {["days", "weeks", "months", "years"].map((unit) => (
                <option key={unit} value={unit} className="text-[#4F5962]">
                  {unit}
                </option>
              ))}
            </select>
          </div>
          {cadence === "days" && (
  <div className="flex flex-col gap-1">
    <label htmlFor="reset-time" className="text-sm text-[#4F5962] dark:text-white cursor-default">
      Reset time
    </label>
    <input
      type="time"
      id="reset-time"
      value={resetTime}
      onChange={(e) => setResetTime(e.target.value)}
      className="px-4 py-2 border border-[#4F596254] dark:border-white rounded-xl bg-transparent text-[#4F5962] dark:text-white"
    />
  </div>
)}


          <div className="flex flex-col gap-1">
            <label htmlFor="start-date" className="text-sm text-[#4F5962] dark:text-white cursor-default">
              Starting on
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2 border border-[#4F596254] dark:border-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#90A9D6] bg-transparent text-[#4F5962] dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="get-notifications" className="text-sm text-[#4F5962] dark:text-white cursor-default">
              Get notifications when tasks are reset?
            </label>
            <p className="text-xs text-[#91989E] dark:text-[#B0B0B0]">
              You’ll receive a notification on this device when tasks are reset, so you can stay on top of your schedule.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                id="get-notifications"
                checked={isNotificationsEnabled}
                onChange={(e) => {
                  vibration('button-press');
                  setIsNotificationsEnabled(e.target.checked);
                }}
                className="cursor-pointer appearance-none w-5 h-5 rounded-sm border border-[#4F5962] bg-white checked:bg-[#4C6CA8] checked:border-[#4C6CA8] focus:outline-none focus:ring-2 focus:ring-[#90A9D6] transition-all duration-150 relative"
              />
              <label htmlFor="get-notifications" className="text-sm text-[#4F5962] dark:text-white cursor-pointer">
                Yes, notify me on this device.
              </label>
              </div>
              <span onClick={() => handleClearResetSchedule(taskList._id)} className="text-xs text-accent-destructive hover:text-accent-destructivehover w-fit mt-3 cursor-pointer transition">
                Clear Reset Schedule
              </span>
          </div>

          <div className="flex gap-4 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                vibration('button-press');
                onClose();
              }}
              className="text-sm text-[#91989E] dark:hover:text-white hover:text-[#4F5962] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#4C6CA8] text-white px-5 py-2 rounded-xl hover:bg-[#3A5D91] transition cursor-pointer"
            >
              Set Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
