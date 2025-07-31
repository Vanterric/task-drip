import { useState, useRef, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { audio } from '../utilities/audio';
import { useAuth } from '../context/AuthContext';

export default function Dropdown({ state, setState, options, multiple = false, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const {isMuted} = useAuth();
  const inputRef = useRef(null);

  const normalizedOptions = typeof options[0] === 'object'
    ? options.map((opt) => ({
        option: opt.option,
        group: opt.group ?? null,
        label: opt.label ?? opt.option,
      }))
    : options.map((opt) => ({ option: opt, group: null, label: opt }));

  const groupedOptions = normalizedOptions.reduce((acc, opt) => {
    const group = opt.group || 'default';
    if (!acc[group]) acc[group] = [];
    acc[group].push(opt);
    return acc;
  }, {});

  const toggleValue = (val) => {
    audio('button-press', isMuted);
    if (multiple) {
      setState((prev) =>
        prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
      );
    } else {
      setState(val);
      setIsOpen(false);
    }
  };

  const isSelected = (val) => {
    return multiple ? state.includes(val) : state === val;
  };

  const filteredGroups = Object.entries(groupedOptions).reduce((acc, [group, items]) => {
    const filtered = items.filter((item) =>
      item.label.toLowerCase().includes(query.toLowerCase())
    );
    if (filtered.length) acc[group] = filtered;
    return acc;
  }, {});

  const getDisplay = () => {
    if (multiple) {
      return normalizedOptions
        .filter((opt) => state.includes(opt.option))
        .map((opt) => opt.label)
        .join(', ');
    }
    const match = normalizedOptions.find((opt) => opt.option === state);
    return match?.label || '';
  };

  const toggleGroup = (group) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [group]: !prev[group]
    }));
  };
  
  return (
    <div className="w-full max-w-md relative">
      <div className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          onChange={(e) => setQuery(e.target.value)}
          value={query || getDisplay()}
          placeholder="Select option..."
          className="mt-1 w-full disabled:opacity-50 pl-4 pr-7 py-3 border border-[#4F596254] dark:border-white rounded-xl bg-white dark:bg-[#4F5962] focus:outline-none focus:ring-2 focus:ring-[#90A9D6] text-[#4F5962] dark:text-white"
          disabled={disabled}
        />
        <div
          onPointerDown={() => { isOpen ? audio('button-press', isMuted) : audio('open-modal', isMuted); }}
          onClick={() => {!disabled && setIsOpen((prev) => !prev)}}
          className="absolute inset-y-0 right-0 flex items-center pr-3 pt-1 cursor-pointer"
        >
          <ChevronDown
            className={`w-4 h-4 text-text-info dark:text-text-darkinfo transition-transform duration-200 ${
              isOpen ? 'rotate-0' : 'rotate-[-90deg]'
            }`}
          />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-background-card dark:bg-background-darkcard shadow-lg"
          >
            {Object.entries(filteredGroups).map(([group, items]) => (
              <Fragment key={group}>
                {group !== 'default' && (
                  <div
                    className="flex items-center justify-between px-4 py-1 text-xs text-text-darkprimary uppercase bg-accent-primary cursor-pointer"
                    onClick={() => toggleGroup(group)}
                  >
                    <span>{group}</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${
                        collapsedGroups[group] ? 'rotate-[-90deg]' : 'rotate-0'
                      }`}
                    />
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {!collapsedGroups[group] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {items.map((item) => (
                        <li
                          key={item.option}
                          onClick={() => toggleValue(item.option)}
                          className={`flex items-center gap-2 px-4 py-2 cursor-pointer text-text-primary dark:text-text-darkprimary hover:bg-accent-focusring`}
                        >
                          {multiple && (
                            <input
                              type="checkbox"
                              readOnly
                              checked={isSelected(item.option)}
                              className="disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer appearance-none flex-shrink-0 w-4 h-4 rounded-sm border border-[#4F5962] bg-white checked:bg-[#4C6CA8] checked:border-[#4C6CA8] focus:outline-none focus:ring-2 focus:ring-[#90A9D6] transition-all duration-150 relative"
                            />
                          )}
                          {item.label}
                        </li>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Fragment>
            ))}
            {Object.keys(filteredGroups).length === 0 && (
              <div className="px-4 py-2 text-text-info dark:text-text-darkinfo">
                No results
              </div>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}