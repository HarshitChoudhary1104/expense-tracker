// client/src/App.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  PlusCircle, Trash2, TrendingUp, DollarSign,
  Filter, AlertTriangle, LayoutDashboard, Target, Activity, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORY_COLORS = {
  Food:          '#818cf8', // indigo-400
  Travel:        '#22d3ee', // cyan-400
  Bills:         '#fbbf24', // amber-400
  Shopping:      '#f472b6', // pink-400
  Health:        '#34d399', // emerald-400
  Entertainment: '#a78bfa', // violet-400
  Education:     '#60a5fa', // blue-400
  Other:         '#94a3b8', // slate-400
};

const CATEGORIES = Object.keys(CATEGORY_COLORS);

// ── Sub-components ──────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, colorClass, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -5 }}
      className="glass-card rounded-2xl p-5 flex items-center gap-4"
    >
      <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20 backdrop-blur-md`}>
        <Icon size={24} className="text-white drop-shadow-md" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-white">{value}</p>
      </div>
    </motion.div>
  );
}

function AddExpenseForm({ onAdd }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [form, setForm] = useState({
    amount: '', category: 'Food', date: today, note: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.amount || Number(form.amount) <= 0)
      return setError('Enter a valid amount.');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/expenses`, {
        ...form, amount: parseFloat(form.amount)
      });
      onAdd(data);
      setForm({ amount: '', category: 'Food', date: today, note: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
        <div className="bg-indigo-500/20 p-2 rounded-lg text-indigo-400 text-lg">
          <PlusCircle size={20} />
        </div>
        Add New Expense 
      </h2>

      {error && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} 
          className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium">
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Amount (₹)</label>
            <input
              type="number" name="amount" value={form.amount} onChange={handleChange}
              placeholder="0.00" step="0.01" min="0" required
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Category</label>
            <select
              name="category" value={form.category} onChange={handleChange}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all appearance-none"
            >
              {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Date</label>
          <input
            type="date" name="date" value={form.date} onChange={handleChange} required
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Note (optional)</label>
          <input
            type="text" name="note" value={form.note} onChange={handleChange}
            placeholder="e.g. Dinner with team" maxLength={120}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit" disabled={loading}
          className="w-full py-3 mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 text-white rounded-xl text-sm font-semibold tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Adding Expense...' : 'Record Expense'}
        </motion.button>
      </form>
    </motion.div>
  );
}

function ExpenseList({ expenses, onDelete }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden h-full flex flex-col"
    >
      <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center backdrop-blur-md bg-slate-900/40">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity size={20} className="text-emerald-400" />
          Recent Transactions
        </h2>
        <span className="text-xs font-semibold px-3 py-1 bg-white/5 rounded-full text-slate-400 border border-white/5">
          {expenses.length} Records
        </span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-[400px]">
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/50 flex flex-col items-center justify-center">
              <span className="text-2xl">💸</span>
            </div>
            <p className="text-sm font-medium">No expenses found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            <AnimatePresence>
              {expenses.map((exp, i) => (
                <motion.li 
                  key={exp.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner"
                      style={{ background: `${CATEGORY_COLORS[exp.category] || '#94a3b8'}20` }}
                    >
                       <div 
                         className="w-3 h-3 rounded-full" 
                         style={{ backgroundColor: CATEGORY_COLORS[exp.category] || '#94a3b8' }} 
                       />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {exp.note || exp.category}
                      </p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {exp.category} <span className="mx-1.5 opacity-50">&bull;</span> {format(parseISO(exp.date), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold tracking-tight text-white">
                      ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => onDelete(exp.id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all focus:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </motion.div>
  );
}

function BudgetForm({ onBudgetSet }) {
  const [cat, setCat] = useState('Food');
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!limit) return;
    setLoading(true);
    try {
      await axios.post(`${API}/budgets`, { category: cat, monthly_limit: parseFloat(limit) });
      onBudgetSet();
      setLimit('');
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500 opacity-10 blur-3xl rounded-full"></div>
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 relative z-10">
        <Target size={16} className="text-pink-400" />
        Set Monthly Budget
      </h3>
      <form onSubmit={handleSubmit} className="flex gap-3 items-end relative z-10">
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Category</label>
          <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500 appearance-none">
            {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
          </select>
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Limit (₹)</label>
          <input type="number" value={limit} onChange={e=>setLimit(e.target.value)} placeholder="0" className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500" required/>
        </div>
        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-500/25 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50">
          Set
        </button>
      </form>
    </div>
  )
}

function SmartInsightsCard({ insights }) {
  if (!insights) return null;
  const { alerts, stats, byCategory } = insights;
  
  const advice = useMemo(() => {
    let tips = [];
    if(stats?.total_spent === 0) {
      tips.push("Welcome! Start logging expenses to see your smart insights.");
      return tips;
    }

    if(alerts?.some(a => a.over_budget)) {
      tips.push("⚠️ You have exceeded budgets for certain categories. Look to cut back over the next week.");
    } else if (alerts?.some(a => a.percentage >= 80)) {
      tips.push("⚠️ You're nearing your budget limits. Slow your spending pace.");
    }

    if(byCategory?.length > 0) {
      const topCat = byCategory[0];
      const percentage = Math.round((topCat.total / stats.total_spent) * 100);
      tips.push(`💡 **${topCat.category}** is your primary sink, taking up **${percentage}%** of your total spend.`);
      
      if(percentage > 40 && !alerts?.find(a => a.category === topCat.category)) {
        tips.push(`🎯 Consider setting a budget for **${topCat.category}** using the tool below to control costs.`);
      }
    }
    
    if(stats?.avg_transaction > 1500) {
      tips.push("Your average transaction is quite high. Make sure large purchases are planned!");
    }

    if(tips.length === 0) tips.push("Your spending looks well distributed right now. Keep it up!");
    return tips;
  }, [insights]);

  return (
    <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500 opacity-10 blur-3xl rounded-full"></div>
      <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 relative z-10">
        <Zap size={16} className="text-yellow-400 fill-yellow-400" />
        Smart Recommendations
      </h3>
      <ul className="space-y-3 relative z-10">
        {advice.map((tip, i) => (
          <motion.li 
            initial={{opacity:0, x:10}} animate={{opacity:1, x:0}} transition={{delay: 0.1*(i+1)}}
            key={i} className="text-sm text-slate-300 bg-slate-900/30 p-4 rounded-xl border border-white/5 leading-relaxed shadow-sm"
            dangerouslySetInnerHTML={{ __html: tip.replace(/\*\*(.*?)\*\*/g, '<span class="text-white font-semibold">$1</span>') }}
          />
        ))}
      </ul>
    </div>
  )
}

function InsightsDashboard({ insights, refresh }) {
  if (!insights) return (
    <div className="flex justify-center py-20 text-indigo-400">
      <div className="animate-spin w-8 h-8 border-4 border-current border-t-transparent rounded-full" />
    </div>
  );
  
  const { byCategory, monthly, alerts } = insights;

  const donutData = {
    labels: byCategory.map(c => c.category),
    datasets: [{
      data: byCategory.map(c => c.total),
      backgroundColor: byCategory.map(c => CATEGORY_COLORS[c.category] || '#6b7280'),
      borderWidth: 0,
      hoverOffset: 6
    }]
  };

  const barData = {
    labels: monthly.map(m => m.month),
    datasets: [{
      label: 'Monthly Spend (₹)',
      data: monthly.map(m => m.total),
      backgroundColor: '#818cf8',
      borderRadius: 6,
      barThickness: 20
    }]
  };

  const fmt = n => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div className="lg:col-span-2 space-y-6">
        {/* Alerts Strip */}
        <AnimatePresence>
          {alerts?.length > 0 && (
            <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1,y:0}} className="glass-card !border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500 opacity-10 blur-3xl rounded-full"></div>
              <p className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-4 relative z-10">
                <AlertTriangle size={18} /> Budget Monitor Alerts
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {alerts.map(a => (
                  <div key={a.category} className="bg-slate-900/50 p-4 rounded-xl border border-amber-500/20 shadow-sm">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2.5">
                      <span className="text-slate-300">{a.category}</span>
                      <span className={a.over_budget ? 'text-red-400' : 'text-amber-400'}>
                        {a.percentage}% of ₹{fmt(a.limit)} {a.over_budget && '(Over)'}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} animate={{ width: `${Math.min(a.percentage, 100)}%` }} transition={{duration:1}}
                        className={`h-full rounded-full ${a.over_budget ? 'bg-red-500' : 'bg-amber-500'}`} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-300 mb-6">Expense Distribution</h3>
            {byCategory.length > 0 ? (
              <div className="max-w-[220px] mx-auto pb-4">
                <Doughnut data={donutData} options={{
                  plugins: { legend: { display: false } }, cutout: '75%', color: '#fff'
                }} />
              </div>
            ) : <p className="text-center text-slate-500 text-sm mt-10">No data</p>}
          </div>

          <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
            <h3 className="text-sm font-bold text-slate-300 mb-6">Monthly Trend</h3>
            {monthly.length > 0 ? (
              <div className="pt-2">
                <Bar data={barData} options={{
                  plugins: { legend: { display: false } },
                  scales: { 
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 10 } } }, 
                    x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 10 } } } 
                  }
                }} />
              </div>
            ) : <p className="text-center text-slate-500 text-sm mt-10">No data</p>}
          </div>
        </div>

      </div>

      <div className="lg:col-span-1 space-y-6">
        <SmartInsightsCard insights={insights} />
        <BudgetForm onBudgetSet={refresh} />
      </div>

    </motion.div>
  );
}

// ── Main App ────────────────────────────────────────────────────

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [insights, setInsights] = useState(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [activeTab, setActiveTab] = useState('expenses');
  const [filters, setFilters] = useState({ search: '', category: '', from: '', to: '' });

  const fetchExpenses = useCallback(async () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    try {
      const { data } = await axios.get(`${API}/expenses`, { params });
      setExpenses(data.expenses);
      setTotalAmount(data.total_amount);
    } catch(err) { console.error(err) }
  }, [filters]);

  const fetchInsights = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/insights`);
      setInsights(data);
    } catch(err) { console.error(err) }
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  const handleAdd = (expense) => {
    setExpenses(prev => [expense, ...prev]);
    setTotalAmount(prev => prev + expense.amount);
    fetchInsights();
  };

  const handleDelete = async (id) => {
    const expense = expenses.find(e => e.id === id);
    try {
      await axios.delete(`${API}/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e.id !== id));
      if (expense) setTotalAmount(prev => prev - expense.amount);
      fetchInsights();
    } catch(err) { console.error(err) }
  };

  const fmt = n => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-[#0b0c10] text-slate-200 selection:bg-indigo-500/30 overflow-x-hidden pb-20">
      
      {/* Premium Header background blob */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-2xl bg-[#0b0c10]/60 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1,x:0}} className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <LayoutDashboard size={22} className="fill-white/20" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">S<span className="text-gradient">ET</span></h1>
          </motion.div>
          <motion.div initial={{opacity:0, x:20}} animate={{opacity:1,x:0}} className="flex items-center gap-2 glass-card px-5 py-2.5 rounded-full hidden sm:flex border-white/10 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Global Balance</span>
            <span className="text-sm font-bold text-white ml-2 tracking-tight">₹{fmt(totalAmount)}</span>
          </motion.div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={DollarSign} label="Total Spent" colorClass="bg-indigo-500" value={`₹${fmt(totalAmount)}`} delay={0.1} />
          <StatCard icon={TrendingUp} label="Transactions" colorClass="bg-emerald-500" value={expenses.length} delay={0.2} />
          <StatCard icon={Filter} label="Categories" colorClass="bg-violet-500" value={insights?.byCategory?.length || 0} delay={0.3} />
          <StatCard icon={Activity} label="Avg Transaction" colorClass="bg-pink-500" value={expenses.length ? `₹${fmt(totalAmount / expenses.length)}` : '—'} delay={0.4} />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 glass-card p-1.5 rounded-2xl w-fit mx-auto sm:mx-0 shadow-sm">
          {['expenses', 'insights'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all relative
                ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {activeTab === tab && (
                <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl" />
              )}
              <span className="relative z-10">{tab} Dashboard</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'expenses' ? (
            <motion.div 
              key="expenses"
              initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Add / Filter */}
              <div className="lg:col-span-4 flex flex-col gap-6">
                <AddExpenseForm onAdd={handleAdd} />
                
                {/* Search & Filter */}
                <div className="glass-card rounded-2xl p-6">
                  <h2 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
                    <Filter size={16} className="text-violet-400" /> Filter Records
                  </h2>
                  <div className="space-y-4">
                    <input type="text" placeholder="Search notes..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm focus:border-violet-500 transition-all font-medium text-white placeholder:text-slate-600" />
                    <select value={filters.category} onChange={e => setFilters(p => ({ ...p, category: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm focus:border-violet-500 transition-all appearance-none font-medium text-white">
                      <option value="" className="bg-slate-800">All categories</option>
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" value={filters.from} onChange={e => setFilters(p => ({ ...p, from: e.target.value }))} className="px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-[13px] [color-scheme:dark] flex-1 text-slate-300" />
                      <input type="date" value={filters.to} onChange={e => setFilters(p => ({ ...p, to: e.target.value }))} className="px-3 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-[13px] [color-scheme:dark] flex-1 text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: List */}
              <div className="lg:col-span-8">
                <ExpenseList expenses={expenses} onDelete={handleDelete} />
              </div>
            </motion.div>
          ) : (
            <motion.div key="insights" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-20}}>
              <InsightsDashboard insights={insights} refresh={fetchInsights} />
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}
