import DewListIcon from "../assets/DewList_Icon.png";

export default function TaskDripBadge() {
  return (
    <div className="relative group w-28 h-28 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-[inset_2px_2px_8px_rgba(255,255,255,0.3),_0_4px_12px_rgba(0,0,0,0.2)] border-[6px] border-yellow-200 animate-medal-in transform transition-transform duration-300 ">
  
      {/* Droplet center */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <img src={DewListIcon} alt="DewList Logo" className="w-10 h-10"  />
      </div>

      {/* Sparkle flare */}
      <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white opacity-0 animate-real-sparkle blur-sm pointer-events-none" />

      
    </div>
  );
}
