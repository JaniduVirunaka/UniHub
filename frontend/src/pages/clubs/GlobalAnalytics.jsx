import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../config/api';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useCountUp } from '../../hooks/useCountUp';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../hooks/animationVariants';

function KpiCard({ label, value, color, icon: Icon }) {
  const { ref: countRef, displayValue } = useCountUp(value);
  const { ref, ...reveal } = useScrollReveal();
  return (
    <motion.div ref={ref} {...reveal}
      className="rounded-3xl p-5 shadow-xl bg-white/60 backdrop-blur-md border border-white/80 dark:bg-white/5 dark:backdrop-blur-xl dark:border-white/10"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
          <p ref={countRef} className={`mt-1 text-2xl font-extrabold ${color}`}>{displayValue}</p>
        </div>
        <div className={`rounded-2xl p-3 ${color.includes('emerald') ? 'bg-emerald-100 dark:bg-emerald-400/15' : color.includes('rose') ? 'bg-rose-100 dark:bg-rose-400/15' : color.includes('indigo') ? 'bg-indigo-100 dark:bg-indigo-400/15' : 'bg-slate-100 dark:bg-white/10'}`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </motion.div>
  );
}

function GlobalAnalytics() {
  const [globalData, setGlobalData] = useState(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'supervisor') { navigate('/clubs'); return; }
    api.get('/clubs/global/analytics').then(res => setGlobalData(res.data)).catch(console.error);
  }, []);

  if (!globalData) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner text="Initializing Global Matrix…" /></div>;

  const totalUniversityRev = globalData.masterChart[11]?.ytdRevenue || 0;
  const totalUniversityExp = globalData.masterChart[11]?.ytdExpenses || 0;
  const universityNet = totalUniversityRev - totalUniversityExp;

  const generateGlobalReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.setTextColor(40, 40, 40);
    doc.text('University Global Financial Report', 14, 20);
    doc.setFontSize(11); doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); doc.text(`Total Revenue: Rs. ${totalUniversityRev.toLocaleString()}`, 14, 40);
    doc.setTextColor(220, 38, 38);  doc.text(`Total Expenses: Rs. ${totalUniversityExp.toLocaleString()}`, 14, 50);
    doc.setTextColor(37, 99, 235);  doc.text(`Net Balance: Rs. ${universityNet.toLocaleString()}`, 14, 60);
    autoTable(doc, {
      head: [['Rank', 'Club Name', 'Revenue (Rs.)', 'Expenses (Rs.)', 'Net (Rs.)', 'Members']],
      body: globalData.leaderboard.map((club, i) => [`#${i + 1}`, club.name, club.totalRevenue.toLocaleString(), club.totalExpenses.toLocaleString(), (club.totalRevenue - club.totalExpenses).toLocaleString(), club.memberCount]),
      startY: 75,
      headStyles: { fillColor: [15, 23, 42] },
    });
    doc.save('Global_University_Financial_Report.pdf');
  };

  return (
    <PageWrapper
      title="Global Matrix"
      subtitle="University-wide aggregated financial and demographic data"
      rightContent={
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={15} />} onClick={() => navigate('/clubs')}>Back</Button>
          <Button variant="success" size="sm" leftIcon={<Download size={15} />} onClick={generateGlobalReport}>Export Report</Button>
        </div>
      }
    >
      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Revenue"   value={`Rs. ${totalUniversityRev.toLocaleString()}`} color="text-emerald-600 dark:text-emerald-400" icon={TrendingUp} />
        <KpiCard label="Total Expenses"  value={`Rs. ${totalUniversityExp.toLocaleString()}`} color="text-rose-600 dark:text-rose-400"       icon={TrendingDown} />
        <KpiCard label="Global Net"      value={`Rs. ${universityNet.toLocaleString()}`}       color="text-indigo-600 dark:text-indigo-400"   icon={DollarSign} />
        <KpiCard label="Active Students" value={String(globalData.totalUniversityMembers)}     color="text-slate-700 dark:text-slate-200"     icon={Users} />
      </div>

      {/* Chart + Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

        {/* Master chart */}
        <Card variant="glass" padding="md">
          <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Global Trajectory (YTD)</h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={globalData.masterChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9', fontSize: '0.85rem' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.85rem' }} />
                <Area type="monotone" dataKey="ytdRevenue"  name="Revenue"  stroke="#10b981" strokeWidth={2.5} fill="url(#gRev)" />
                <Area type="monotone" dataKey="ytdExpenses" name="Expenses" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Leaderboard */}
        <Card variant="glass" padding="md">
          <h3 className="mb-4 font-bold text-amber-600 dark:text-amber-400">Top Performing Clubs</h3>
          <motion.ul
            variants={staggerContainer(0.05)}
            initial="hidden"
            animate="visible"
            className="flex flex-col divide-y divide-slate-200/60 dark:divide-white/10"
          >
            {globalData.leaderboard.map((club, index) => {
              const net = club.totalRevenue - club.totalExpenses;
              return (
                <motion.li key={club.id} variants={staggerItem} className="flex items-center gap-3 py-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-amber-400 text-white' : index === 1 ? 'bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300'}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{club.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{club.memberCount} members</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">+{club.totalRevenue.toLocaleString()}</p>
                    <p className="font-semibold text-rose-600 dark:text-rose-400">−{club.totalExpenses.toLocaleString()}</p>
                    <p className={`font-bold ${net >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {net >= 0 ? '' : '−'}{Math.abs(net).toLocaleString()}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        </Card>

      </div>
    </PageWrapper>
  );
}

export default GlobalAnalytics;
