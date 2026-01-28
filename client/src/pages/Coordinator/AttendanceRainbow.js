import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const GAUGE_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

export const AttendanceRainbow = ({ value, title, subtitle }) => {
  const data = [ { value: 20 }, { value: 20 }, { value: 20 }, { value: 20 }, { value: 20 } ];
  const percentage = parseFloat(value) || 0;

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col items-center">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{subtitle}</p>
      <h4 className="text-sm font-bold text-slate-700 mb-2">{title}</h4>
      
      <div className="relative w-full h-32">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {/* Background Rainbow Track */}
            <Pie
              data={data} cx="50%" cy="80%" startAngle={180} endAngle={0}
              innerRadius="60%" outerRadius="85%" paddingAngle={2} dataKey="value"
            >
              {data.map((_, i) => <Cell key={i} fill={GAUGE_COLORS[i]} opacity={0.15} />)}
            </Pie>
            {/* Actual Progress Fill */}
            <Pie
              data={[{ value: percentage }, { value: 100 - percentage }]}
              cx="50%" cy="80%" startAngle={180} endAngle={180 - (percentage * 1.8)}
              innerRadius="60%" outerRadius="95%" stroke="none" dataKey="value"
            >
              <Cell fill={percentage > 80 ? '#22c55e' : percentage > 50 ? '#eab308' : '#ef4444'} />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-end justify-center pb-4">
          <span className="text-2xl font-black text-slate-800">{Math.round(percentage)}%</span>
        </div>
      </div>
    </div>
  );
};