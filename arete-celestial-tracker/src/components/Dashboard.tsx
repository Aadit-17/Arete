import React from 'react';
import { motion } from 'motion/react';
import { LiquidGlass } from './CelestialUI';
import { cn } from '@/lib/utils';
import { 
  LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar,
  Cell, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, 
  Zap, 
  Droplets, 
  Moon, 
  BookOpen, 
  Code2,
  Calendar,
  ChevronRight
} from 'lucide-react';

const activityData = [
  { name: 'Mon', value: 65 },
  { name: 'Tue', value: 85 },
  { name: 'Wed', value: 75 },
  { name: 'Thu', value: 95 },
  { name: 'Fri', value: 80 },
  { name: 'Sat', value: 60 },
  { name: 'Sun', value: 70 },
];

const sleepData = [
  { name: 'M', hours: 7.5 },
  { name: 'T', hours: 6.8 },
  { name: 'W', hours: 8.2 },
  { name: 'T', hours: 7.1 },
  { name: 'F', hours: 6.5 },
  { name: 'S', hours: 9.0 },
  { name: 'S', hours: 8.5 },
];

const productivityData = [
  { name: 'Coding', value: 45, color: '#22d3ee' },
  { name: 'Reading', value: 25, color: '#818cf8' },
  { name: 'Workout', value: 20, color: '#34d399' },
  { name: 'Other', value: 10, color: '#94a3b8' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="liquid-glass p-3 border border-white/10 text-xs shadow-2xl">
        <p className="text-zinc-400 mb-1">{label}</p>
        <p className="text-cyan-300 font-bold">{payload[0].value}% Output</p>
      </div>
    );
  }
  return null;
};

export const Dashboard: React.FC = () => {
  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-screen custom-scrollbar">
      {/* Header Section */}
      <header className="flex justify-between items-end mb-12">
        <div>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-headline font-bold text-white tracking-tight"
          >
            Celestial Dashboard
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-sm font-label tracking-widest uppercase mt-2 opacity-60"
          >
            Tracking Cycle: April 2026 • Phase 04
          </motion.p>
        </div>
        <div className="flex gap-4">
          <LiquidGlass className="px-4 py-2 flex items-center gap-3 border border-white/5">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-label text-white/80">Today, April 11</span>
          </LiquidGlass>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Productivity', value: '92%', icon: Zap, color: 'text-yellow-400', trend: '+5.2%' },
          { label: 'Hydration', value: '2.4L', icon: Droplets, color: 'text-cyan-400', trend: 'Target Met' },
          { label: 'Sleep Quality', value: '84/100', icon: Moon, color: 'text-indigo-400', trend: '-2.1%' },
          { label: 'Reading', value: '42pg', icon: BookOpen, color: 'text-emerald-400', trend: '+12pg' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <LiquidGlass className="p-6 border border-white/5 hover:border-white/10 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-lg bg-white/5", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-label text-zinc-500 tracking-wider uppercase">{stat.trend}</span>
              </div>
              <h3 className="text-zinc-400 text-xs font-label tracking-widest uppercase mb-1">{stat.label}</h3>
              <p className="text-2xl font-headline font-bold text-white">{stat.value}</p>
            </LiquidGlass>
          </motion.div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Output Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <LiquidGlass className="p-8 h-[400px] border border-white/5 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-headline font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                Energy Output Analysis
              </h3>
              <div className="flex gap-2">
                {['7D', '30D', '90D'].map(t => (
                  <button key={t} className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-label tracking-widest transition-all",
                    t === '7D' ? "bg-cyan-400 text-black" : "bg-white/5 text-zinc-500 hover:bg-white/10"
                  )}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'DM Serif Display' }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#22d3ee" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </LiquidGlass>
        </motion.div>

        {/* Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <LiquidGlass className="p-8 h-[400px] border border-white/5 flex flex-col">
            <h3 className="text-lg font-headline font-bold text-white mb-8 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-400" />
              Focus Distribution
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productivityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {productivityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full space-y-3 mt-6">
                {productivityData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-label text-zinc-400 tracking-wide">{item.name}</span>
                    </div>
                    <span className="text-xs font-headline font-bold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </LiquidGlass>
        </motion.div>
      </div>

      {/* Bottom Row: Recent Logs & Sleep */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        {/* Recent Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <LiquidGlass className="p-8 border border-white/5">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-headline font-bold text-white">Recent Logs</h3>
              <button className="text-xs font-label text-cyan-400 tracking-widest uppercase hover:text-cyan-300 transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { date: 'April 10', title: 'Deep Work: Celestial Engine', type: 'Coding', score: 94 },
                { date: 'April 09', title: 'Morning Run & Meditation', type: 'Workout', score: 88 },
                { date: 'April 08', title: 'Philosophy of Aether', type: 'Reading', score: 76 },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 font-bold text-xs">
                      {log.date.split(' ')[1]}
                    </div>
                    <div>
                      <h4 className="text-sm font-headline font-bold text-white group-hover:text-cyan-300 transition-colors">{log.title}</h4>
                      <p className="text-[10px] font-label text-zinc-500 tracking-widest uppercase mt-1">{log.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-headline font-bold text-white">{log.score}</p>
                    <p className="text-[10px] font-label text-zinc-500 tracking-widest uppercase">Score</p>
                  </div>
                </div>
              ))}
            </div>
          </LiquidGlass>
        </motion.div>

        {/* Sleep Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <LiquidGlass className="p-8 border border-white/5 h-full">
            <h3 className="text-lg font-headline font-bold text-white mb-8 flex items-center gap-2">
              <Moon className="w-5 h-5 text-indigo-400" />
              Sleep Architecture
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'DM Serif Display' }}
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="liquid-glass p-2 border border-white/10 text-[10px] text-cyan-300 font-bold">
                            {payload[0].value} Hours
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="hours" 
                    fill="#818cf8" 
                    radius={[4, 4, 0, 0]} 
                    barSize={20}
                  >
                    {sleepData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hours > 8 ? '#818cf8' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-headline font-bold text-white">7.8h</p>
                <p className="text-[10px] font-label text-zinc-500 tracking-widest uppercase">Avg Duration</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-headline font-bold text-white">11:24</p>
                <p className="text-[10px] font-label text-zinc-500 tracking-widest uppercase">Bedtime</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-headline font-bold text-white">82%</p>
                <p className="text-[10px] font-label text-zinc-500 tracking-widest uppercase">Efficiency</p>
              </div>
            </div>
          </LiquidGlass>
        </motion.div>
      </div>
    </div>
  );
};
