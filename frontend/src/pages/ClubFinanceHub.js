import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ClubNavigation from '../components/ClubNavigation';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
  const [expenseData, setExpenseData] = useState({ title: '', amount: '', description: '', date: '', receipt: null });

  const safeCategories = club?.paymentCategories?.length > 0 ? club.paymentCategories : ['Membership Fee'];
  const filteredLedger = club?.feeRecords?.filter(record => categoryFilter === 'All' ? true : record.category === categoryFilter).reverse() || [];

  const ytdRevenue = (analytics.chartData[11]?.ytdFees || 0) + (analytics.chartData[11]?.ytdSponsorships || 0);
  const ytdExpenses = analytics.chartData[11]?.ytdExpenses || 0;
  const ytdBalance = ytdRevenue - ytdExpenses;

  const currentMonthIndex = new Date().getMonth();
  const displayStats = chartView === 'YTD' 
    ? { label: 'YTD', rev: ytdRevenue, exp: ytdExpenses }
    : { 
        label: 'This Month', 
        rev: (analytics.chartData[currentMonthIndex]?.monthlyFees || 0) + (analytics.chartData[currentMonthIndex]?.monthlySponsorships || 0), 
        exp: analytics.chartData[currentMonthIndex]?.monthlyExpenses || 0 
      };
  const displayBalance = displayStats.rev - displayStats.exp;

  useEffect(() => {
    fetchClubData();
    fetchAnalytics();
  }, [id]);

  useEffect(() => {
    if (club && safeCategories.length > 0 && !safeCategories.includes(paymentData.category)) {
      setPaymentData(prev => ({ ...prev, category: safeCategories[0] }));
    }
  }, [club]); 

  const fetchClubData = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}`).then(res => setClub(res.data)).catch(err => console.log(err));
  };

  const fetchAnalytics = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}/analytics`).then(res => setAnalytics(res.data)).catch(err => console.error("Error fetching analytics:", err));
  };

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Financial Hub...</div>;

  const isSupervisor = currentUser?.role === 'supervisor';
  const isActualPresident = club.president?._id === currentUser?.id;
  const isVP = club.topBoard?.some(b => b.user?._id === currentUser?.id && b.role === 'Vice President');
  const isPresident = isActualPresident || isVP;
  const isTreasury = club.topBoard?.some(b => b.user?._id === currentUser?.id && ['Treasurer', 'Assistant Treasurer'].includes(b.role));
  
  const canViewAdminDashboard = isPresident || isTreasury || isSupervisor;
  const canManageData = isTreasury;

  let myRole = "General Member";
  if (isActualPresident) myRole = "President";
  else {
    const boardMatch = club.topBoard?.find(b => (b.user?._id || b.user) === currentUser?.id);
    if (boardMatch) myRole = boardMatch.role;
  }

  const handleSubmitPayment = (e) => {
    e.preventDefault(); 
    if (!paymentData.amount || paymentData.amount <= 0) return alert("Please enter a valid amount.");
    if (!paymentData.receipt) return alert("Please upload a screenshot of the bank transfer.");

    const data = new FormData();
    data.append('userId', currentUser?.id);
    data.append('amount', paymentData.amount);
    data.append('category', paymentData.category);
    data.append('receipt', paymentData.receipt);

    axios.post(`http://localhost:5000/api/clubs/${id}/fees/pay`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(res => {
        alert(res.data.message);
        setPaymentData({ category: safeCategories[0], amount: '', receipt: null }); 
        fetchClubData(); 
      }).catch(err => alert("Error processing payment."));
  };

  const handleVerifyPayment = (recordId) => {
    axios.put(`http://localhost:5000/api/clubs/${id}/fees/update`, {
      recordId: recordId, status: editForm.status, amountPaid: Number(editForm.amountPaid), requestorId: currentUser?.id
    }).then(res => { alert(res.data.message); setEditingId(null); fetchClubData(); fetchAnalytics(); })
      .catch(err => alert(err.response?.data?.message || "Error updating record."));
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if(!newCategory) return;
    axios.post(`http://localhost:5000/api/clubs/${id}/categories`, { newCategory, userId: currentUser?.id })
      .then(res => { setNewCategory(''); fetchClubData(); }).catch(err => alert(err.response?.data?.message || "Error adding category."));
  };

  const handleEditCategory = (oldCat) => {
    if (oldCat === 'Membership Fee') return alert("Cannot rename the default category.");
    const newCat = window.prompt("Enter new category name:", oldCat);
    if (newCat && newCat.trim() !== "" && newCat !== oldCat) {
      axios.put(`http://localhost:5000/api/clubs/${id}/categories`, { oldCategory: oldCat, newCategory: newCat, userId: currentUser?.id })
        .then(res => fetchClubData()).catch(err => alert(err.response?.data?.message || "Error renaming category."));
    }
  };

  const handleDeleteCategory = (catName) => {
    if(!window.confirm(`Delete the category "${catName}"?`)) return;
    axios.delete(`http://localhost:5000/api/clubs/${id}/categories/${catName}`, { data: { userId: currentUser?.id } })
      .then(res => fetchClubData()).catch(err => alert(err.response?.data?.message || "Error deleting category."));
  };

  const handleSubmitExpense = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('userId', currentUser?.id);
    data.append('title', expenseData.title);
    data.append('amount', expenseData.amount);
    data.append('description', expenseData.description || '');
    if (expenseData.receipt) data.append('receipt', expenseData.receipt);

    if (editingExpenseId) {
      axios.put(`http://localhost:5000/api/clubs/${id}/expenses/${editingExpenseId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(res => { alert(res.data.message); setEditingExpenseId(null); setShowExpenseForm(false); fetchAnalytics(); })
        .catch(err => alert("Error updating expense."));
    } else {
      axios.post(`http://localhost:5000/api/clubs/${id}/expenses`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then(res => { alert(res.data.message); setExpenseData({ title: '', amount: '', description: '', date: '', receipt: null }); setShowExpenseForm(false); fetchAnalytics(); })
        .catch(err => alert("Error logging expense."));
    }
  };

  const openEditForm = (exp) => {
    const formattedDate = new Date(exp.date).toISOString().split('T')[0];
    setExpenseData({ title: exp.title, amount: exp.amount, description: exp.description || '', date: formattedDate });
    setEditingExpenseId(exp._id);
    setShowExpenseForm(true); 
  };

  const handleDeleteExpense = (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    axios.delete(`http://localhost:5000/api/clubs/${id}/expenses/${expenseId}`, { data: { userId: currentUser?.id } })
      .then(res => fetchAnalytics()).catch(err => alert("Error deleting expense."));
  };

  const loadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null); 
    });
  };

  const generateFilteredLedgerPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(`${club.name} - Official Transaction Ledger`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Filter Applied: ${categoryFilter}`, 14, 34);

    const recordsWithImages = await Promise.all(
      filteredLedger.map(async (record) => {
        let imgData = null;
        if (record.receiptUrl) imgData = await loadImage(`http://localhost:5000${record.receiptUrl}`);
        return { ...record, imgData };
      })
    );

    const tableColumn = ["Member Name", "Category", "Status", "Amount", "Receipt"];
    const tableRows = recordsWithImages.map(record => [
      record.user?.name || 'Unknown User', record.category, record.status, `Rs. ${record.amountPaid.toLocaleString()}`, record.imgData ? "" : "No File" 
    ]);

    autoTable(doc, { 
      head: [tableColumn], body: tableRows, startY: 40, styles: { fontSize: 9, cellPadding: 3, minCellHeight: 15 }, 
      headStyles: { fillColor: [59, 130, 246] }, alternateRowStyles: { fillColor: [239, 246, 255] },
      didDrawCell: (data) => {
        if (data.row.section === 'body' && data.column.index === 4) {
          const record = recordsWithImages[data.row.index];
          if (record.imgData) doc.addImage(record.imgData, 'JPEG', data.cell.x + 2, data.cell.y + 2, 10, 10);
        }
      }
    });
    doc.save(`${club.name.replace(/\s+/g, '_')}_Filtered_Ledger.pdf`);
  };

  const generateExpensesPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(`${club.name} - Official Expense Report`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`YTD Total Active Expenses: Rs. ${ytdExpenses.toLocaleString()}`, 14, 34);

    const sortedExpenses = [...analytics.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    const expensesWithImages = await Promise.all(
      sortedExpenses.map(async (exp) => {
        let imgData = null;
        if (exp.receiptUrl) imgData = await loadImage(`http://localhost:5000${exp.receiptUrl}`);
        return { ...exp, imgData };
      })
    );

    const tableColumn = ["Date", "Expense Title", "Amount (Rs.)", "Audit Status", "Receipt"];
    const tableRows = expensesWithImages.map(exp => {
      let auditStatus = 'Active';
      if (exp.isDeleted) auditStatus = 'DELETED';
      else if (exp.isEdited) auditStatus = 'EDITED';
      return [ new Date(exp.date).toLocaleDateString(), exp.title, `Rs. ${exp.amount.toLocaleString()}`, auditStatus, exp.imgData ? "" : "No File" ];
    });

    autoTable(doc, { 
      head: [tableColumn], body: tableRows, startY: 40, styles: { minCellHeight: 15 }, headStyles: { fillColor: [220, 38, 38] },
      didDrawCell: (data) => {
        if (data.row.section === 'body' && data.column.index === 4) {
          const exp = expensesWithImages[data.row.index];
          if (exp.imgData) doc.addImage(exp.imgData, 'JPEG', data.cell.x + 2, data.cell.y + 2, 10, 10);
        }
      }
    }); 
    doc.save(`${club.name.replace(/\s+/g, '_')}_Expense_Report.pdf`);
  };

  const generateFinancialSummaryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22); doc.text(`${club.name} - Executive Financial Summary`, 14, 20); doc.setFontSize(11); doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.setFontSize(14); doc.setTextColor(16, 185, 129); doc.text(`YTD Total Revenue: Rs. ${ytdRevenue.toLocaleString()}`, 14, 45); 
    doc.setTextColor(220, 38, 38); doc.text(`YTD Total Expenses: Rs. ${ytdExpenses.toLocaleString()}`, 14, 55); 
    doc.setTextColor(37, 99, 235); doc.text(`Net Balance: Rs. ${ytdBalance.toLocaleString()}`, 14, 65);

    const tableColumn = ["Month", "Fees (Rs.)", "Sponsorships (Rs.)", "Expenses (Rs.)", "Net (Rs.)"];
    const tableRows = analytics.chartData.map(data => [
      data.name, data.monthlyFees.toLocaleString(), data.monthlySponsorships.toLocaleString(), data.monthlyExpenses.toLocaleString(),
      ((data.monthlyFees + data.monthlySponsorships) - data.monthlyExpenses).toLocaleString()
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 75, headStyles: { fillColor: [59, 130, 246] } });
    doc.save(`${club.name.replace(/\s+/g, '_')}_Financial_Summary.pdf`);
  };

  return (
    <div className="container" style={{ position: 'relative' }}>
      
      {/* RECEIPT IMAGE MODAL */}
      {receiptModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(5px)' }} onClick={() => setReceiptModal(null)}>
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <button className="btn btn-danger" style={{ position: 'absolute', top: '-40px', right: '-40px', borderRadius: '50%', padding: '10px 15px' }} onClick={() => setReceiptModal(null)}>X</button>
            <img src={`http://localhost:5000${receiptModal}`} alt="Bank Receipt" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '8px', border: '2px solid white' }} />
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="card" style={{ borderTop: '4px solid var(--primary-color)', paddingBottom: '20px' }}>
        <button className="btn btn-outline" style={{ marginBottom: '20px', backgroundColor: 'var(--surface-color)' }} onClick={() => navigate(`/clubs/${id}`)}>
          &larr; Back to Main Hub
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ color: 'var(--primary-color)', margin: '0 0 10px 0' }}>🏦 Unified Financial Hub</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.05rem' }}>Securely submit payments, verify bank transfers, and oversee club analytics.</p>
          </div>
        </div>
        <div style={{ marginTop: '20px' }}><ClubNavigation club={club} /></div>
      </div>

      {/* LAYOUT FIX: Responsive Split Grid */}
      <div className={(!isSupervisor && canViewAdminDashboard) ? "dashboard-grid-split" : ""} style={{ display: (!isSupervisor && canViewAdminDashboard) ? '' : 'grid', gap: '30px' }}>     
        
        {/* LEFT COLUMN: MEMBER PAYMENT SUBMISSION (Hidden for Supervisors) */}
        {!isSupervisor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="card" style={{ border: '1px solid var(--border-color)', padding: '25px', marginBottom: 0 }}>
              <h3 style={{ color: 'var(--text-main)', marginTop: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>Submit a Payment</h3>
              
              <div style={{ backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-color)', padding: '15px', borderRadius: 'var(--radius-md)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {currentUser?.name.charAt(0)}
                </div>
                <div>
                  <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '1.1rem' }}>{currentUser?.name}</strong>
                  <span style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{myRole}</span>
                </div>
              </div>

              <form onSubmit={handleSubmitPayment}>
                <div className="form-group">
                  <label style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '5px', display: 'block' }}>1. Select Payment Category</label>
                  <select className="form-control" value={paymentData.category} onChange={(e) => setPaymentData({...paymentData, category: e.target.value})} required>
                    {safeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '5px', display: 'block' }}>2. Transfer Amount (Rs.)</label>
                  <input type="number" className="form-control" placeholder="e.g. 1500" value={paymentData.amount} onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})} required min="1" />
                </div>

                <div className="form-group">
                  <label style={{ color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '5px', display: 'block' }}>3. Bank Screenshot / Receipt</label>
                  <input type="file" className="form-control" accept="image/*" onChange={(e) => setPaymentData({...paymentData, receipt: e.target.files[0]})} required />
                </div>

                <button type="submit" className="btn btn-success" style={{ width: '100%', fontSize: '1.05rem', padding: '12px' }}>Submit for Verification</button>
              </form>
            </div>

            <div className="card" style={{ border: '1px solid var(--border-color)', padding: '20px' }}>
              <h4 style={{ color: 'var(--text-main)', marginTop: 0, marginBottom: '15px' }}>My Recent Submissions</h4>
              {club.feeRecords?.filter(r => r.user?._id === currentUser?.id || r.user === currentUser?.id).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No payments logged yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {club.feeRecords?.filter(r => r.user?._id === currentUser?.id || r.user === currentUser?.id).reverse().slice(0, 5).map(record => (
                    <div key={record._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)' }}>{record.category}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rs. {record.amountPaid.toLocaleString()}</span>
                      </div>
                      <span className="badge" style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: record.status === 'Paid' ? 'var(--success-bg)' : record.status === 'Rejected' ? 'var(--danger-bg)' : 'var(--warning-bg)', color: record.status === 'Paid' ? 'var(--success)' : record.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)' }}>
                        {record.status === 'Pending Verification' ? 'Pending' : record.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* RIGHT COLUMN: ADMIN FINANCIAL DASHBOARD */}
        {canViewAdminDashboard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* --- 1. DYNAMIC STATS & CHARTS --- */}
            <div className="card" style={{ border: '1px solid var(--border-color)', padding: '20px', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>📊 Financial Breakdown</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select className="form-control" style={{ width: 'auto', margin: 0, fontWeight: 'bold', padding: '6px 12px' }} value={chartView} onChange={(e) => setChartView(e.target.value)}>
                    <option value="YTD">Year-to-Date (Cumulative)</option>
                    <option value="Monthly">Month-by-Month (Isolated)</option>
                  </select>
                  <button className="btn btn-outline" style={{ padding: '6px 15px', margin: 0 }} onClick={generateFinancialSummaryPDF}>📥 Export Summary PDF</button>
                </div>
              </div>

              <div className="quick-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', textAlign: 'center', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h5 style={{ margin: '0 0 5px 0', color: 'var(--text-secondary)' }}>{displayStats.label} Revenue</h5>
                  <h3 style={{ margin: 0, color: 'var(--success)' }}>Rs. {displayStats.rev.toLocaleString()}</h3>
                </div>
                <div style={{ padding: '15px', textAlign: 'center', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h5 style={{ margin: '0 0 5px 0', color: 'var(--text-secondary)' }}>{displayStats.label} Expenses</h5>
                  <h3 style={{ margin: 0, color: 'var(--danger)' }}>Rs. {displayStats.exp.toLocaleString()}</h3>
                </div>
                <div style={{ padding: '15px', textAlign: 'center', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-color)' }}>
                  <h5 style={{ margin: '0 0 5px 0', color: 'var(--text-secondary)' }}>{displayStats.label} Net Balance</h5>
                  <h3 style={{ margin: 0, color: 'var(--primary-color)' }}>Rs. {displayBalance.toLocaleString()}</h3>
                </div>
              </div>

              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartView === 'YTD' ? (
                    <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--success)" stopOpacity={0.7}/><stop offset="95%" stopColor="var(--success)" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorSpons" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.7}/><stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/></linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--danger)" stopOpacity={0.7}/><stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/></linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.85rem' }}/>
                      <Area type="monotone" dataKey="ytdSponsorships" stackId="1" name="Corporate Sponsorships" stroke="var(--primary-color)" fill="url(#colorSpons)" />
                      <Area type="monotone" dataKey="ytdFees" stackId="1" name="Member Fees" stroke="var(--success)" fill="url(#colorFees)" />
                      <Area type="monotone" dataKey="ytdExpenses" name="Total Expenses" stroke="var(--danger)" strokeWidth={2} fill="none" />
                    </AreaChart>
                  ) : (
                    <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} />
                      <Tooltip cursor={{ fill: 'var(--bg-color)' }} contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.85rem' }}/>
                      <Bar dataKey="monthlyFees" stackId="a" name="Member Fees" fill="var(--success)" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="monthlySponsorships" stackId="a" name="Corporate Sponsorships" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="monthlyExpenses" name="Expenses" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* --- 2. MASTER TRANSACTION LEDGER --- */}
            <div className="card" style={{ border: '1px solid var(--border-color)', padding: '20px', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h3 style={{ color: 'var(--text-main)', margin: 0 }}>📖 Filterable Transaction Ledger</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select className="form-control" style={{ padding: '6px 12px', width: 'auto', margin: 0, fontWeight: 'bold' }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="All">View All Categories</option>
                    {safeCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <button className="btn btn-outline" style={{ padding: '6px 15px', margin: 0 }} onClick={generateFilteredLedgerPDF}>📥 Export Filtered PDF</button>
                </div>
              </div>

              {filteredLedger.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>No transactions found for this category.</p>
              ) : (
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Member Name</th>
                        <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Category</th>
                        <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Status</th>
                        <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Amount (Rs.)</th>
                        <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Receipt</th>
                        {canManageData && <th style={{ padding: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Verify</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLedger.map(record => {
                        const isEditing = editingId === record._id;
                        return (
                          <tr key={record._id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: record.status === 'Pending Verification' ? 'var(--primary-light)' : 'transparent' }}>
                            <td style={{ padding: '12px' }}>
                              <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.95rem' }}>{record.user?.name || 'Unknown User'}</strong>
                              <small style={{ color: 'var(--text-muted)' }}>{new Date(record.lastUpdated).toLocaleDateString()}</small>
                            </td>
                            <td style={{ padding: '12px', color: 'var(--text-secondary)', fontWeight: 'bold', fontSize: '0.9rem' }}>{record.category}</td>
                            <td style={{ padding: '12px' }}>
                              {isEditing ? (
                                <select className="form-control" value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} style={{ margin: 0, padding: '4px' }}>
                                  <option value="Pending Verification">Pending Verification</option>
                                  <option value="Paid">Accepted (Paid)</option>
                                  <option value="Rejected">Rejected / Invalid</option>
                                </select>
                              ) : (
                                <span className="badge" style={{ backgroundColor: record.status === 'Paid' ? 'var(--success-bg)' : record.status === 'Rejected' ? 'var(--danger-bg)' : 'var(--warning-bg)', color: record.status === 'Paid' ? 'var(--success)' : record.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)' }}>
                                  {record.status === 'Pending Verification' ? '⏳ Verification' : record.status}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {isEditing ? (
                                <input type="number" className="form-control" value={editForm.amountPaid} onChange={(e) => setEditForm({...editForm, amountPaid: e.target.value})} style={{ margin: 0, padding: '4px', width: '80px' }} />
                              ) : (
                                <strong style={{ color: record.amountPaid > 0 ? 'var(--success)' : 'var(--text-main)' }}>{record.amountPaid.toLocaleString()}</strong>
                              )}
                            </td>
                            <td style={{ padding: '12px' }}>
                              {record.receiptUrl ? (
                                <img src={`http://localhost:5000${record.receiptUrl}`} alt="Receipt" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-color)' }} onClick={() => setReceiptModal(record.receiptUrl)} />
                              ) : ( <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>No File</span> )}
                            </td>
                            {canManageData && (
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: '0.8rem', margin: 0 }} onClick={() => handleVerifyPayment(record._id)}>Save</button>
                                    <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.8rem', margin: 0, backgroundColor: 'var(--surface-color)' }} onClick={() => setEditingId(null)}>Cancel</button>
                                  </div>
                                ) : (
                                  <button className="btn btn-edit" style={{ padding: '4px 10px', fontSize: '0.85rem', margin: 0 }} onClick={() => { setEditingId(record._id); setEditForm({ status: record.status, amountPaid: record.amountPaid }); }}>
                                    ✏️ Verify
                                  </button>
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
            </div>

           {/* --- 3. CATEGORIES & EXPENSES --- */}
            <div className={canManageData ? "dashboard-grid-half" : ""} style={{ display: canManageData ? '' : 'grid', gap: '20px' }}>  
              {canManageData && (
                <div className="card" style={{ padding: '20px', border: '1px solid var(--primary-color)', backgroundColor: 'var(--primary-light)', marginBottom: 0 }}>
                  <h4 style={{ color: 'var(--primary-color)', marginTop: 0, borderBottom: '1px solid rgba(0, 240, 255, 0.2)', paddingBottom: '10px' }}>⚙️ Payment Categories</h4>
                  <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input type="text" className="form-control" placeholder="New Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} required style={{ margin: 0 }} />
                    <button type="submit" className="btn btn-success" style={{ margin: 0, padding: '8px 15px' }}>Add</button>
                  </form>
                  <ul style={{ padding: 0, listStyle: 'none', margin: 0 }}>
                    {safeCategories.map(cat => (
                      <li key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '4px', marginBottom: '5px', fontSize: '0.9rem' }}>
                        <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{cat}</span>
                        {cat !== 'Membership Fee' && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleEditCategory(cat)}>✏️</button>
                            <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleDeleteCategory(cat)}>X</button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="card" style={{ padding: '20px', border: '1px solid var(--danger)', backgroundColor: 'var(--danger-bg)', marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 0, 60, 0.2)', paddingBottom: '10px', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                  <h4 style={{ color: 'var(--danger)', margin: 0 }}>💸 Club Expenses</h4>
                  <button className="btn btn-outline" style={{ margin: 0, padding: '4px 10px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={generateExpensesPDF}>📥 Export PDF</button>
                </div>
                
                {canManageData && (
                  !showExpenseForm ? (
                    <button className="btn btn-danger" style={{ width: '100%', marginBottom: '15px' }} onClick={() => setShowExpenseForm(true)}>+ Log New Expense</button>
                  ) : (
                    <form onSubmit={handleSubmitExpense} style={{ marginBottom: '15px', backgroundColor: 'var(--surface-color)', padding: '15px', borderRadius: 'var(--radius-md)' }}>
                      <input type="text" className="form-control" placeholder="Expense Title" value={expenseData.title} onChange={(e) => setExpenseData({...expenseData, title: e.target.value})} required style={{ marginBottom: '10px' }}/>
                      <input type="number" className="form-control" placeholder="Amount (Rs.)" value={expenseData.amount} onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})} required style={{ marginBottom: '10px' }}/>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px', fontWeight: 'bold' }}>Upload Invoice/Receipt (Optional)</label>
                      <input type="file" className="form-control" accept="image/*,application/pdf" onChange={(e) => setExpenseData({...expenseData, receipt: e.target.files[0]})} style={{ marginBottom: '10px' }}/>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn btn-danger" style={{ flex: 1, padding: '8px' }}>Save</button>
                        <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '8px' }} onClick={() => { setShowExpenseForm(false); setEditingExpenseId(null); setExpenseData({ title: '', amount: '', description: '', date: '', receipt: null }); }}>Cancel</button>
                      </div>
                    </form>
                  )
                )}

                <ul style={{ padding: 0, listStyle: 'none', margin: 0, maxHeight: '250px', overflowY: 'auto' }}>
                  {analytics.expenses?.filter(e => !e.isDeleted).length === 0 && <li style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No active expenses recorded yet.</li>}
                  {analytics.expenses?.filter(e => !e.isDeleted).map(exp => (
                    <li key={exp._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '4px', marginBottom: '5px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {exp.receiptUrl && (
                          <img src={`http://localhost:5000${exp.receiptUrl}`} alt="Receipt" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-color)' }} onClick={() => setReceiptModal(exp.receiptUrl)} />
                        )}
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text-main)' }}>{exp.title} {exp.isEdited && <span style={{ fontSize: '0.65rem', color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: '2px 4px', borderRadius: '4px', marginLeft: '5px' }}>EDITED</span>}</strong>
                          <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>Rs. {exp.amount.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {canManageData && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '1rem' }} onClick={() => openEditForm(exp)}>✏️</button>
                          <button type="button" style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem' }} onClick={() => handleDeleteExpense(exp._id)}>🗑️</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClubFinanceHub;