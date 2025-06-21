import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';


const DAY_MS = 24 * 60 * 60 * 1000;
const SYNTHESIZED_DAYS = 90;

// Parse date string to number of days since epoch (UTC midnight)
const parseDateToDays = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return Math.floor(d.getTime() / DAY_MS);
};

// Custom tooltip showing conference info
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const conf = payload[0].payload;
  const myDate = (d) => new Date(d).toLocaleDateString()
  const daysLeft = (d) => Math.max(0, Math.floor((new Date(d) - new Date()) / DAY_MS));

  return (
    <div style={{ background: '#fff', border: '1px solid #ccc', padding: 10 }}>
      <strong>{conf.name}</strong>
      <div>
        Deadline: {myDate(conf.deadline)} ({daysLeft(conf.deadline)} days)<br/>
        Notification: {conf.isSynthesized ? 'TBD' : `${myDate(conf.notification_date)} (${daysLeft(conf.notification_date)} days)`}
      </div>
    </div>
  );
};


export default function Graph({ conferences }) {
  // Filter conferences having both required dates
  const nowDay = Math.floor(Date.now() / DAY_MS); // today in days since epoch

  const events = conferences
    .filter(c => c.deadline)
    .filter(c => {
      const deadlineDay = Math.floor(new Date(c.deadline).getTime() / DAY_MS);
      return deadlineDay >= nowDay; // keep only upcoming deadlines (today or in the future)
    })
    .map((c, idx) => {
      const start = parseDateToDays(c.deadline);
      // const end = parseDateToDays(c.notification_date);
      if (start === null) return null;
      let notificationTs;
      let isSynthesized = false;
      if (c.notification_date) {
        const notif = parseDateToDays(c.notification_date);
        if (notif === null) return null;
        notificationTs = notif;
      } else {
        // synthesize notification_date = deadline + 90 days
        notificationTs = start + SYNTHESIZED_DAYS;
        isSynthesized = true;
      }
      if (notificationTs < start) return null;

      return {
        name: c.name + (c.year ? ` ${c.year}` : ''),
        start,
        length: notificationTs - start,
        deadline: c.deadline,
        notification_date: new Date((notificationTs) * DAY_MS).toISOString(),
        isSynthesized,
        yIndex: idx,
      };
    })
    .filter(Boolean);

  if (!events.length) {
    return <p>No conferences with notification dates to display.</p>;
  }

  // Calculate earliest start date
  const now = new Date();
  const todayUTCmidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const todayInDays = Math.floor(todayUTCmidnight / DAY_MS);

  // const minStart = Math.min(...events.map(e => e.start));
  const minStart = todayInDays;
  const maxEnd = Math.max(...events.map(e => e.start + e.length));

  // Normalize starts relative to earliest date
  const data = events.map(e => ({
    ...e,
    normStart: e.start - minStart,
  }));

  // Define x-axis domain with little padding (5 days)
  const domainStart = 0;
  const domainEnd = maxEnd - minStart + 5;

  const colors = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7f50',
    '#6a5acd',
    '#2196f3',
    '#ffb300',
    '#00bfa5',
    '#f06292',
    '#ffa726',
  ];

  return (
    <ResponsiveContainer width="100%" height={50 + data.length * 60}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 50, right: 0, left: 0, bottom: 20 }} 
        // barCategoryGap={50}
      >
        <defs>
          <pattern id="dashedPattern" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect x="0" y="0" width="4" height="1" fill="#888" />
          </pattern>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          type="number"
          domain={[domainStart, domainEnd]}
          tickFormatter={tick => {
            const realDate = new Date((minStart + tick) * DAY_MS);
            return realDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          }}
          tickCount={10}
          interval="preserveStartEnd"
          // label={{ value: 'Date', position: 'insideBottom', offset: -10 }}
          />
        <YAxis
          type="category"
          dataKey="name"
          width={120} // increased left width for long labels
          interval={0}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 16, fontWeight: 'bold', wordBreak: 'break-word' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="normStart"
          stackId="a"
          fill="transparent"
          isAnimationActive={false}
          legendType="none"
          barSize={30}
        />
        <Bar
          radius={[4, 4, 4, 4]} // rounded corners: top-left, top-right, bottom-right, bottom-left
          stroke="#555" // subtle border color
          strokeWidth={1}
          dataKey="length"
          stackId="a"
          isAnimationActive={false}
          minPointSize={5}
          // barSize={18}
        >
          {data.map((entry, index) => (
            // <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              // stroke={entry.isSynthesized ? '#555' : undefined}
              // strokeWidth={entry.isSynthesized ? 2 : 1}
              fillOpacity={entry.isSynthesized ? 0.4 : 1}
              // fill dashed pattern if synthesized
              {...(entry.isSynthesized ? { fill: "url(#dashedPattern)" } : {})}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
