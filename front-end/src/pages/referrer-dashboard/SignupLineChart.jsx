import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  startOfWeek,
  startOfMonth,
  isAfter,
  subDays,
  startOfDay,
  differenceInCalendarDays,
  differenceInMonths,
} from 'date-fns';
import {audio} from '../../utilities/audio';

const timeRanges = {
  week: 7,
  month: 30,
  year: 365,
};

const getDaysBetween = (start, end) => {
  return Math.max(0, differenceInCalendarDays(end, start));
};

const SignupLineChart = ({ users }) => {
  const [range, setRange] = useState('week');

  const now = new Date();
  const hardcodedStart = new Date('2025-04-01');

  const startDate = useMemo(() => {
    if (range === 'year') {
      return startOfMonth(subDays(now, 365));
    }
    return isFinite(timeRanges[range])
      ? subDays(now, timeRanges[range])
      : startOfMonth(hardcodedStart);
  }, [range]);

  const daysToRender = useMemo(() => {
    return isFinite(timeRanges[range])
      ? timeRanges[range]
      : getDaysBetween(startDate, now);
  }, [range, startDate]);

  const filteredData = useMemo(() => {
  const signupsMap = {};

  users.forEach(user => {
  const date = new Date(user.createdAt);
  if (date >= startDate && date <= now) {
    let key;

    if (range === 'week') {
      key = date.toISOString().split('T')[0]; // UTC day
    } else if (range === 'month') {
      const monday = startOfWeek(date, { weekStartsOn: 1 });
      key = monday.toISOString().split('T')[0]; // UTC week start
    } else {
      const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        key = `${year}-${month}`;
    }

    signupsMap[key] = (signupsMap[key] || 0) + 1;
  }
});


  const data = [];

  if (range === 'week') {
    for (let i = 0; i <= daysToRender; i++) {
      const day = addDays(startDate, i);
      const key = format(day, 'yyyy-MM-dd');
      data.push({ date: key, signups: signupsMap[key] || 0 });
    }
  } else if (range === 'month') {
    const totalWeeks = Math.ceil(daysToRender / 7);
    for (let i = 0; i <= totalWeeks; i++) {
      const weekStart = startOfWeek(addWeeks(startDate, i), { weekStartsOn: 1 });
      const key = format(weekStart, 'yyyy-MM-dd');
      data.push({ date: key, signups: signupsMap[key] || 0 });
    }
  } else {
    const firstMonth = startOfMonth(startDate);
const totalMonths = differenceInMonths(now, firstMonth) + 1;

for (let i = 0; i < totalMonths; i++) {
  const monthStart = addMonths(firstMonth, i);
  const year = monthStart.getUTCFullYear();
  const month = String(monthStart.getUTCMonth() + 1).padStart(2, '0');
  const key = `${year}-${month}`;
  data.push({ date: key, signups: signupsMap[key] || 0 });
}

  }

  return data;
}, [users, range, startDate, now, daysToRender]);


  return (
    <div className="w-full">
      <div className="flex justify-end mb-4 mt-4 gap-2">
        {['week', 'month', 'year', 'all'].map(option => (
          <button
            key={option}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition cursor-pointer ${
              range === option
                ? 'bg-accent-primary text-white'
                : 'bg-background-darkcard text-text-darkprimary hover:bg-accent-primaryhover'
            }`}
            onClick={() => {audio("button-press", false); setRange(option)}}
          >
            {option === 'all' ? 'All Time' : `Last ${option.charAt(0).toUpperCase() + option.slice(1)}`}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%"  height={300}>
        <LineChart data={filteredData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
        height={80}
          angle={30}
          textAnchor='start'
  dataKey="date"
  tickFormatter={(str) => {
  if (range === 'week' || range === 'month') {
    // str is expected to be 'yyyy-MM-dd'
    const isValidDay = /^\d{4}-\d{2}-\d{2}$/.test(str);
    const date = isValidDay ? new Date(`${str}T12:00:00`) : new Date(str);
    return format(date, range === 'week' ? 'MM/dd' : "'Week of' MMM d");
  }

  // str is expected to be 'yyyy-MM' for year and all-time
  const isValidMonth = /^\d{4}-\d{2}$/.test(str);
  const safeDate = isValidMonth ? new Date(`${str}-01T12:00:00`) : new Date(str);
  return format(safeDate, 'MMM yyyy');
}}

  minTickGap={20}
  interval = {1}
/>

          <YAxis allowDecimals={false} width={20} />
          <Tooltip
            labelFormatter={(label) => {
              if (range === 'week' || range === 'month') {
                return format(new Date(label), 'MMMM d, yyyy');
              }
              const safeDate = label.length === 7 ? `${label}-01` : label;
              return format(new Date(safeDate), 'MMMM yyyy');
            }}
          />
          <Line type="monotone" dataKey="signups" stroke="#4E81AF" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SignupLineChart;
