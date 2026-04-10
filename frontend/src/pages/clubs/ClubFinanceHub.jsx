import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ArrowLeft, Download, TrendingUp, TrendingDown, Wallet, PenLine, Trash2, Plus, X, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../config/api';
import ClubNavigation from '../../components/ClubNavigation';
import PageWrapper from '../../components/PageWrapper';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/StatusBadge';
import FormInput from '../../components/FormInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AnimatePresence, motion } from 'framer-motion';
import { scaleUp } from '../../hooks/animationVariants';

const inputCls = 'w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-white/10 dark:bg-slate-950/40 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500';

const tooltipStyle = { backgroundColor: 'rgba(15,23,42,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f1f5f9', fontSize: '0.85rem' };

function ClubFinanceHub() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [analytics, setAnalytics] = useState({ chartData: [], expenses: [] });
  const [chartView, setChartView] = useState('YTD');
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const [paymentData, setPaymentData] = useState({ category: 'Membership Fee', amount: '', receipt: null });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'Pending Verification', amountPaid: 0 });
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [receiptModal, setReceiptModal] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseData, setExpenseData] = useState({ title: '', amount: '', description: '', receipt: null });

  const safeCategories = club?.paymentCategories?.length > 0 ? club.paymentCategories : ['Membership Fee'];
  const filteredLedger = club?.feeRecords?.filter(r => categoryFilter === 'All' ? true : r.category === categoryFilter).reverse() || [];

  const ytdRevenue  = (analytics.chartData[11]?.ytdFees || 0) + (analytics.chartData[11]?.ytdSponsorships || 0);
  const ytdExpenses = analytics.chartData[11]?.ytdExpenses || 0;
  const ytdBalance  = ytdRevenue - ytdExpenses;
  const currentMonthIndex = new Date().getMonth();
  const displayStats = chartView === 'YTD'
    ? { label: 'YTD', rev: ytdRevenue, exp: ytdExpenses }
    : { label: 'This Month', rev: (analytics.chartData[currentMonthIndex]?.monthlyFees || 0) + (analytics.chartData[currentMonthIndex]?.monthlySponsorships || 0), exp: analytics.chartData[currentMonthIndex]?.monthlyExpenses || 0 };
  const displayBalance = displayStats.rev - displayStats.exp;

  useEffect(() => { fetchClubData(); fetchAnalytics(); }, [id]);
  useEffect(() => {
    if (club && safeCategories.length > 0 && !safeCategories.includes(paymentData.category)) {
      setPaymentData(p => ({ ...p, category: safeCategories[0] }));
    }
  }, [club]);

  const fetchClubData   = () => api.get(`/clubs/${id}`).then(r => setClub(r.data)).catch(console.error);
  const fetchAnalytics  = () => api.get(`/clubs/${id}/analytics`).then(r => setAnalytics(r.data)).catch(console.error);

  if (!club) return <div className="flex min-h-[60vh] items-center justify-center"><LoadingSpinner text="Loading Financial Hub…" /></div>;

  const isSupervisor     = currentUser?.role === 'supervisor';
  const isActualPresident = club.president?._id === currentUser?.id;
  const isVP             = club.topBoard?.some(b => b.user?._id === currentUser?.id && b.role === 'Vice President');
  const isPresident      = isActualPresident || isVP;
  const isTreasury       = club.topBoard?.some(b => b.user?._id === currentUser?.id && ['Treasurer', 'Assistant Treasurer'].includes(b.role));
  const canViewAdminDashboard = isPresident || isTreasury || isSupervisor;
  const canManageData    = isTreasury;

  let myRole = 'General Member';
  if (isActualPresident) myRole = 'President';
  else {
    const m = club.topBoard?.find(b => (b.user?._id || b.user) === currentUser?.id);
    if (m) myRole = m.role;
  }

  const handleSubmitPayment = (e) => {
    e.preventDefault();
    if (!paymentData.amount || paymentData.amount <= 0) return alert('Enter a valid amount.');
    if (!paymentData.receipt) return alert('Upload a receipt.');
    const data = new FormData();
    data.append('userId', currentUser?.id);
    data.append('amount', paymentData.amount);
    data.append('category', paymentData.category);
    data.append('receipt', paymentData.receipt);
    api.post(`/clubs/${id}/fees/pay`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => { alert(r.data.message); setPaymentData({ category: safeCategories[0], amount: '', receipt: null }); fetchClubData(); })
      .catch(() => alert('Error processing payment.'));
  };

  const handleVerifyPayment = (recordId) => {
    api.put(`/clubs/${id}/fees/update`, { recordId, status: editForm.status, amountPaid: Number(editForm.amountPaid), requestorId: currentUser?.id })
      .then(r => { alert(r.data.message); setEditingId(null); fetchClubData(); fetchAnalytics(); })
      .catch(err => alert(err.response?.data?.message || 'Error updating record.'));
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCategory) return;
    api.post(`/clubs/${id}/categories`, { newCategory, userId: currentUser?.id })
      .then(() => { setNewCategory(''); fetchClubData(); }).catch(err => alert(err.response?.data?.message || 'Error.'));
  };

  const handleEditCategory = (oldCat) => {
    if (oldCat === 'Membership Fee') return alert('Cannot rename default category.');
    const newCat = window.prompt('Enter new category name:', oldCat);
    if (newCat && newCat.trim() && newCat !== oldCat) {
      api.put(`/clubs/${id}/categories`, { oldCategory: oldCat, newCategory: newCat, userId: currentUser?.id })
        .then(() => fetchClubData()).catch(err => alert(err.response?.data?.message || 'Error.'));
    }
  };

  const handleDeleteCategory = (catName) => {
    if (!window.confirm(`Delete "${catName}"?`)) return;
    api.delete(`/clubs/${id}/categories/${catName}`, { data: { userId: currentUser?.id } })
      .then(() => fetchClubData()).catch(err => alert(err.response?.data?.message || 'Error.'));
  };

  const handleSubmitExpense = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('userId', currentUser?.id);
    ['title', 'amount', 'description'].forEach(k => data.append(k, expenseData[k] || ''));
    if (expenseData.receipt) data.append('receipt', expenseData.receipt);
    const req = editingExpenseId
      ? api.put(`/clubs/${id}/expenses/${editingExpenseId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      : api.post(`/clubs/${id}/expenses`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    req.then(r => { alert(r.data.message); setEditingExpenseId(null); setShowExpenseForm(false); setExpenseData({ title: '', amount: '', description: '', receipt: null }); fetchAnalytics(); })
       .catch(() => alert('Error saving expense.'));
  };

  const loadImage = (url) => new Promise(resolve => {
    const img = new Image(); img.crossOrigin = 'Anonymous'; img.src = url;
    img.onload = () => resolve(img); img.onerror = () => resolve(null);
  });

  const generateFilteredLedgerPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text(`${club.name} — Transaction Ledger`, 14, 20);
    doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleDateString()} | Filter: ${categoryFilter}`, 14, 28);
    const records = await Promise.all(filteredLedger.map(async r => ({ ...r, imgData: r.receiptUrl ? await loadImage(`http://localhost:5000${r.receiptUrl}`) : null })));
    autoTable(doc, {
      head: [['Member', 'Category', 'Status', 'Amount (Rs.)', 'Receipt']],
      body: records.map(r => [r.user?.name || 'Unknown', r.category, r.status, r.amountPaid.toLocaleString(), r.imgData ? '' : 'No File']),
      startY: 35, headStyles: { fillColor: [79, 70, 229] },
      didDrawCell: d => { if (d.row.section === 'body' && d.column.index === 4) { const r = records[d.row.index]; if (r.imgData) doc.addImage(r.imgData, 'JPEG', d.cell.x + 2, d.cell.y + 2, 10, 10); } },
    });
    doc.save(`${club.name.replace(/\s+/g, '_')}_Ledger.pdf`);
  };

  const generateExpensesPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text(`${club.name} — Expense Report`, 14, 20);
    doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleDateString()} | YTD Expenses: Rs. ${ytdExpenses.toLocaleString()}`, 14, 28);
    const exps = await Promise.all([...analytics.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).map(async e => ({ ...e, imgData: e.receiptUrl ? await loadImage(`http://localhost:5000${e.receiptUrl}`) : null })));
    autoTable(doc, {
      head: [['Date', 'Title', 'Amount (Rs.)', 'Status', 'Receipt']],
      body: exps.map(e => [new Date(e.date).toLocaleDateString(), e.title, e.amount.toLocaleString(), e.isDeleted ? 'DELETED' : e.isEdited ? 'EDITED' : 'Active', e.imgData ? '' : 'No File']),
      startY: 35, headStyles: { fillColor: [220, 38, 38] },
      didDrawCell: d => { if (d.row.section === 'body' && d.column.index === 4) { const e = exps[d.row.index]; if (e.imgData) doc.addImage(e.imgData, 'JPEG', d.cell.x + 2, d.cell.y + 2, 10, 10); } },
    });
    doc.save(`${club.name.replace(/\s+/g, '_')}_Expenses.pdf`);
  };

  const generateFinancialSummaryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20); doc.text(`${club.name} — Financial Summary`, 14, 20); doc.setFontSize(11); doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.setFontSize(13); doc.setTextColor(16, 185, 129); doc.text(`YTD Revenue: Rs. ${ytdRevenue.toLocaleString()}`, 14, 40);
    doc.setTextColor(220, 38, 38); doc.text(`YTD Expenses: Rs. ${ytdExpenses.toLocaleString()}`, 14, 49);
    doc.setTextColor(37, 99, 235); doc.text(`Net Balance: Rs. ${ytdBalance.toLocaleString()}`, 14, 58);
    autoTable(doc, { head: [['Month', 'Fees (Rs.)', 'Sponsorships (Rs.)', 'Expenses (Rs.)', 'Net (Rs.)']], body: analytics.chartData.map(d => [d.name, d.monthlyFees.toLocaleString(), d.monthlySponsorships.toLocaleString(), d.monthlyExpenses.toLocaleString(), ((d.monthlyFees + d.monthlySponsorships) - d.monthlyExpenses).toLocaleString()]), startY: 66, headStyles: { fillColor: [59, 130, 246] } });
    doc.save(`${club.name.replace(/\s+/g, '_')}_Summary.pdf`);
  };

  const statusBadge = (status) => {
    const map = { 'Paid': 'APPROVED', 'Rejected': 'REJECTED', 'Pending Verification': 'PENDING' };
    return <StatusBadge status={map[status] || 'PENDING'} />;
  };

  return (
    <PageWrapper
      title="Financial Hub"
      subtitle={`${club.name} — payments, ledger, and analytics`}
      rightContent={
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={15} />} onClick={() => navigate(`/clubs/${id}`)}>
          Back to Hub
        </Button>
      }
    >
      {/* Receipt modal */}
      <AnimatePresence>
        {receiptModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setReceiptModal(null)}
          >
            <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <Button variant="danger" size="sm" className="absolute -top-10 right-0" leftIcon={<X size={14} />} onClick={() => setReceiptModal(null)}>Close</Button>
              <img src={`http://localhost:5000${receiptModal}`} alt="Receipt" className="w-full rounded-2xl border-2 border-white/20 shadow-2xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ClubNavigation club={club} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">

        {/* LEFT: Member payment form */}
        {!isSupervisor && (
          <div className="flex flex-col gap-4">
            <Card variant="glass" padding="md">
              <h3 className="mb-4 font-bold text-slate-900 dark:text-white">Submit a Payment</h3>

              {/* User badge */}
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-indigo-50 p-3 dark:bg-indigo-400/10">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white">
                  {currentUser?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{currentUser?.name}</p>
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">{myRole}</p>
                </div>
              </div>

              <form onSubmit={handleSubmitPayment} className="flex flex-col gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Category</label>
                  <select className={inputCls} value={paymentData.category} onChange={e => setPaymentData(p => ({ ...p, category: e.target.value }))} required>
                    {safeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <FormInput label="Amount (Rs.)" type="number" value={paymentData.amount} onChange={e => setPaymentData(p => ({ ...p, amount: e.target.value }))} required min="1" />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Bank Receipt</label>
                  <input type="file" accept="image/*" onChange={e => setPaymentData(p => ({ ...p, receipt: e.target.files[0] }))} required
                    className="w-full text-sm text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/40 dark:file:text-emerald-300"
                  />
                </div>
                <Button type="submit" variant="success" className="w-full">Submit for Verification</Button>
              </form>
            </Card>

            {/* My recent submissions */}
            <Card variant="glass" padding="md">
              <h4 className="mb-3 font-bold text-slate-900 dark:text-white">My Submissions</h4>
              {(() => {
                const myRecords = club.feeRecords?.filter(r => r.user?._id === currentUser?.id || r.user === currentUser?.id).reverse().slice(0, 5) || [];
                if (myRecords.length === 0) return <p className="text-sm italic text-slate-400">No payments yet.</p>;
                return (
                  <ul className="flex flex-col gap-2">
                    {myRecords.map(r => (
                      <li key={r._id} className="flex items-center justify-between rounded-2xl bg-slate-50/60 px-3 py-2.5 dark:bg-white/5">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.category}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Rs. {r.amountPaid.toLocaleString()}</p>
                        </div>
                        {statusBadge(r.status)}
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </Card>
          </div>
        )}

        {/* RIGHT: Admin dashboard */}
        {canViewAdminDashboard && (
          <div className="flex flex-col gap-6">

            {/* KPI + chart toggle */}
            <Card variant="glass" padding="md">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold text-slate-900 dark:text-white">Financial Breakdown</h3>
                <div className="flex gap-2">
                  <select className={`${inputCls} w-auto`} value={chartView} onChange={e => setChartView(e.target.value)}>
                    <option value="YTD">Year-to-Date</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                  <Button variant="ghost" size="sm" leftIcon={<Download size={14} />} onClick={generateFinancialSummaryPDF}>PDF</Button>
                </div>
              </div>

              {/* Mini KPIs */}
              <div className="mb-5 grid grid-cols-3 gap-3">
                {[
                  { label: `${displayStats.label} Revenue`,  value: `Rs. ${displayStats.rev.toLocaleString()}`,    color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: `${displayStats.label} Expenses`, value: `Rs. ${displayStats.exp.toLocaleString()}`,    color: 'text-rose-600 dark:text-rose-400' },
                  { label: 'Net Balance',                    value: `Rs. ${displayBalance.toLocaleString()}`,       color: 'text-indigo-600 dark:text-indigo-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-2xl bg-slate-50/60 p-3 text-center dark:bg-white/5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                    <p className={`mt-1 text-base font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === 'YTD' ? (
                    <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="cFees" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.5} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                        <linearGradient id="cSpons" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                        <linearGradient id="cExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.5} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '0.8rem' }} />
                      <Area type="monotone" dataKey="ytdSponsorships" stackId="1" name="Sponsorships" stroke="#6366f1" fill="url(#cSpons)" />
                      <Area type="monotone" dataKey="ytdFees" stackId="1" name="Fees" stroke="#10b981" fill="url(#cFees)" />
                      <Area type="monotone" dataKey="ytdExpenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fill="none" />
                    </AreaChart>
                  ) : (
                    <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.2)" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '0.8rem' }} />
                      <Bar dataKey="monthlyFees" stackId="a" name="Fees" fill="#10b981" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="monthlySponsorships" stackId="a" name="Sponsorships" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="monthlyExpenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Transaction ledger */}
            <Card variant="glass" padding="none" className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/60 p-4 dark:border-white/10">
                <h3 className="font-bold text-slate-900 dark:text-white">Transaction Ledger</h3>
                <div className="flex gap-2">
                  <select className={`${inputCls} w-auto`} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                    <option value="All">All Categories</option>
                    {safeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <Button variant="ghost" size="sm" leftIcon={<Download size={14} />} onClick={generateFilteredLedgerPDF}>Export</Button>
                </div>
              </div>

              {filteredLedger.length === 0 ? (
                <p className="p-6 text-center text-sm italic text-slate-400">No transactions for this category.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/60 text-left dark:bg-white/5">
                        {['Member', 'Category', 'Status', 'Amount (Rs.)', 'Receipt', canManageData && 'Verify'].filter(Boolean).map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {filteredLedger.map(record => {
                        const isEditing = editingId === record._id;
                        return (
                          <tr key={record._id} className="hover:bg-slate-50/40 dark:hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-slate-900 dark:text-white">{record.user?.name || 'Unknown'}</p>
                              <p className="text-xs text-slate-400">{new Date(record.lastUpdated).toLocaleDateString()}</p>
                            </td>
                            <td className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{record.category}</td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <select className={inputCls} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                                  <option value="Pending Verification">Pending</option>
                                  <option value="Paid">Accepted</option>
                                  <option value="Rejected">Rejected</option>
                                </select>
                              ) : statusBadge(record.status)}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input type="number" className={`${inputCls} w-24`} value={editForm.amountPaid} onChange={e => setEditForm(f => ({ ...f, amountPaid: e.target.value }))} />
                              ) : (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{record.amountPaid.toLocaleString()}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {record.receiptUrl
                                ? <button type="button" onClick={() => setReceiptModal(record.receiptUrl)} aria-label="View receipt" className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 hover:opacity-80 transition"><img src={`http://localhost:5000${record.receiptUrl}`} alt="Receipt" className="h-full w-full object-cover" /></button>
                                : <span className="text-xs italic text-slate-400">No file</span>
                              }
                            </td>
                            {canManageData && (
                              <td className="px-4 py-3">
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    <Button size="xs" variant="success" onClick={() => handleVerifyPayment(record._id)}>Save</Button>
                                    <Button size="xs" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                  </div>
                                ) : (
                                  <Button size="xs" variant="ghost" leftIcon={<PenLine size={12} />} onClick={() => { setEditingId(record._id); setEditForm({ status: record.status, amountPaid: record.amountPaid }); }}>Verify</Button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Categories + Expenses */}
            <div className={`grid gap-4 ${canManageData ? 'md:grid-cols-2' : ''}`}>
              {canManageData && (
                <Card variant="glass" padding="md">
                  <h4 className="mb-3 font-bold text-indigo-600 dark:text-indigo-400">Payment Categories</h4>
                  <form onSubmit={handleAddCategory} className="mb-3 flex gap-2">
                    <input type="text" className={`${inputCls} flex-1`} placeholder="New category…" value={newCategory} onChange={e => setNewCategory(e.target.value)} required />
                    <Button type="submit" size="sm" variant="success" leftIcon={<Plus size={14} />}>Add</Button>
                  </form>
                  <ul className="flex flex-col gap-1.5">
                    {safeCategories.map(cat => (
                      <li key={cat} className="flex items-center justify-between rounded-xl bg-slate-50/60 px-3 py-2 text-sm dark:bg-white/5">
                        <span className="font-medium text-slate-900 dark:text-white">{cat}</span>
                        {cat !== 'Membership Fee' && (
                          <div className="flex gap-1">
                            <Button size="xs" variant="ghost" leftIcon={<PenLine size={12} />} onClick={() => handleEditCategory(cat)} aria-label={`Rename ${cat}`} />
                            <Button size="xs" variant="danger" leftIcon={<Trash2 size={12} />} onClick={() => handleDeleteCategory(cat)} aria-label={`Delete ${cat}`} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Card variant="glass" padding="md">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-bold text-rose-600 dark:text-rose-400">Club Expenses</h4>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" leftIcon={<Download size={14} />} onClick={generateExpensesPDF}>PDF</Button>
                    {canManageData && (
                      <Button size="sm" variant="danger" leftIcon={showExpenseForm ? <X size={14} /> : <Plus size={14} />} onClick={() => { setShowExpenseForm(p => !p); setEditingExpenseId(null); }}>
                        {showExpenseForm ? 'Cancel' : 'Log'}
                      </Button>
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {showExpenseForm && canManageData && (
                    <motion.form variants={scaleUp} initial="hidden" animate="visible" exit="exit" onSubmit={handleSubmitExpense} className="mb-4 flex flex-col gap-3 rounded-2xl bg-slate-50/60 p-4 dark:bg-white/5">
                      <FormInput label="Title" value={expenseData.title} onChange={e => setExpenseData(f => ({ ...f, title: e.target.value }))} required />
                      <FormInput label="Amount (Rs.)" type="number" value={expenseData.amount} onChange={e => setExpenseData(f => ({ ...f, amount: e.target.value }))} required />
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">Receipt (optional)</label>
                        <input type="file" accept="image/*,application/pdf" onChange={e => setExpenseData(f => ({ ...f, receipt: e.target.files[0] }))}
                          className="w-full text-sm text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-rose-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-rose-700 hover:file:bg-rose-100 dark:file:bg-rose-900/40 dark:file:text-rose-300"
                        />
                      </div>
                      <Button type="submit" variant="danger" className="w-full">{editingExpenseId ? 'Save Changes' : 'Log Expense'}</Button>
                    </motion.form>
                  )}
                </AnimatePresence>

                <ul className="flex max-h-60 flex-col gap-1.5 overflow-y-auto">
                  {analytics.expenses?.filter(e => !e.isDeleted).length === 0 && <li className="text-sm italic text-slate-400">No expenses yet.</li>}
                  {analytics.expenses?.filter(e => !e.isDeleted).map(exp => (
                    <li key={exp._id} className="flex items-center gap-3 rounded-xl bg-slate-50/60 px-3 py-2.5 dark:bg-white/5">
                      {exp.receiptUrl && (
                        <button type="button" onClick={() => setReceiptModal(exp.receiptUrl)} aria-label="View receipt" className="shrink-0">
                          <img src={`http://localhost:5000${exp.receiptUrl}`} alt="Receipt" className="h-10 w-10 rounded-lg object-cover" />
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {exp.title}{exp.isEdited && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-600 dark:bg-amber-400/15 dark:text-amber-300">EDITED</span>}
                        </p>
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Rs. {exp.amount.toLocaleString()}</p>
                      </div>
                      {canManageData && (
                        <div className="flex gap-1 shrink-0">
                          <Button size="xs" variant="ghost" leftIcon={<PenLine size={12} />} aria-label="Edit" onClick={() => { setExpenseData({ title: exp.title, amount: exp.amount, description: exp.description || '', receipt: null }); setEditingExpenseId(exp._id); setShowExpenseForm(true); }} />
                          <Button size="xs" variant="danger" leftIcon={<Trash2 size={12} />} aria-label="Delete" onClick={() => { if (window.confirm('Delete this expense?')) api.delete(`/clubs/${id}/expenses/${exp._id}`, { data: { userId: currentUser?.id } }).then(() => fetchAnalytics()).catch(() => alert('Error.')); }} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

          </div>
        )}
      </div>
    </PageWrapper>
  );
}

export default ClubFinanceHub;
