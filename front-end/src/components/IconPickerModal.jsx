import React, { useState, useMemo, lazy, Suspense, useRef, useEffect } from "react";
import iconsWithTags from "../assets/lucide-icons-with-tags.json";
import { FixedSizeGrid as Grid } from 'react-window';
import * as LucideIcons from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { audio } from "../utilities/audio";
import { useAuth } from "../context/AuthContext";


const IconPickerModal = ({ onSubmit, listId, listName, currentIcon = "clipboard-check", onClose }) => {
  const [selectedIcon, setSelectedIcon] = useState(currentIcon);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const modalRef = useRef(null);
    const [modalWidth, setModalWidth] = useState(360); // fallback default
    const { isMuted } = useAuth();
    const lazyIconCache = {};


useEffect(() => {
  const updateWidth = () => {
    if (modalRef.current) {
      setModalWidth(modalRef.current.clientWidth - 32); // minus padding
    }
  };

  updateWidth(); // Initial measurement
  window.addEventListener("resize", updateWidth); // Optional: responsive support

  return () => window.removeEventListener("resize", updateWidth);
}, []);




useEffect(() => {
  const timeout = setTimeout(() => {
    setDebouncedSearch(search);
  }, 200);

  return () => clearTimeout(timeout);
}, [search]);


  const iconNames = Object.keys(iconsWithTags); // get all icon names from the icons object

const normalize = (str) =>
  str.toLowerCase().replace(/[-_\s]/g, "");

const normalizedIconMap = useMemo(() => {
  const map = new Map();
  for (const name of iconNames) {
    const normalized = normalize(name);
    if (!map.has(normalized)) {
      map.set(normalized, name); // store only first match
    }
  }
  return map;
}, [iconNames]);

const filteredIcons = useMemo(() => {
  const normalizedQuery = normalize(debouncedSearch);
  const result = [];

  for (const iconName of iconNames) {
    const normName = normalize(iconName);
    const tags = iconsWithTags[iconName]?.tags || [];
    const tagMatches = tags.some(tag => normalize(tag).includes(normalizedQuery));
    const nameMatches = normName.includes(normalizedQuery);

    if (nameMatches || tagMatches) {
      result.push(iconName);
    }
  }

  return result;
}, [debouncedSearch, iconNames]);



const { columnCount, rowCount } = useMemo(() => {
  const columnCount = Math.max(1, Math.floor(modalWidth / 65));
  const rowCount = Math.ceil(filteredIcons.length / columnCount);
  return { columnCount, rowCount };
}, [modalWidth, filteredIcons.length]);

    const kebabToPascalCase = (str) => {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

const getIcon = (iconName) => {
  const pascal = kebabToPascalCase(iconName);
  return LucideIcons[pascal] || LucideIcons.HelpCircle;
};


  const IconItem = React.memo(({ iconName }) => {
  const IconComponent = getIcon(iconName);
  const isSelected = selectedIcon === iconName;

  return (
    <div
      onClick={() => {setSelectedIcon(iconName); audio('button-press', isMuted);}}
      className={`flex items-center justify-center w-12 h-12 rounded-xl cursor-pointer transition 
        ${isSelected
          ? "bg-gray-200 dark:bg-[#3A3F45]"
          : "hover:bg-gray-100 dark:hover:bg-[#555C63]"}`}
    >
      <IconComponent size={20} />
    </div>
  );
});


  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit( listId, selectedIcon );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
      <AnimatePresence>
      <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
        ref={modalRef} className="bg-white dark:bg-[#4F5962] rounded-3xl shadow-xl p-6 w-full max-w-xl max-h-[90vh] overflow-hidden mx-4">
        <h2 className="text-xl font-bold mb-1 text-[#4F5962] dark:text-white cursor-default">
          Pick an Icon
        </h2>
        <p className="text-sm text-[#91989E] dark:text-white mb-4">
          Choose an icon for your list <span className="font-bold">{listName}</span>
        </p>
        <input
          type="text"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-[#4F596254] dark:border-white rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#90A9D6]"
        />

        <div className="rounded-md  mb-4">
  <Grid
    columnCount = {columnCount}
    columnWidth={65}
    height={300}
    rowCount={rowCount}
    rowHeight={70}
    width={modalWidth} 
  >
    {({ columnIndex, rowIndex, style }) => {
  const index = rowIndex * columnCount + columnIndex;
  if (index >= filteredIcons.length) return null;

  const iconName = filteredIcons[index];
  return (
    <div style={style} className="flex items-center justify-center w-full h-full">
      <IconItem iconName={iconName} />
    </div>
  );
}}

  </Grid>
</div>


        <div className="flex gap-4 justify-end mt-6">
          <button
            type="button"
            onClick={() => { audio('close-modal', isMuted); onClose(); }}
            className="text-sm text-[#91989E] dark:hover:text-white hover:text-[#4F5962] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onPointerDown={() => audio('button-press', isMuted)}
            onClick={handleSubmit}
            className="bg-[#4C6CA8] text-white px-5 py-2 rounded-xl hover:bg-[#3A5D91] transition cursor-pointer"
          >
            Save Icon
          </button>
        </div>
      </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default IconPickerModal;
