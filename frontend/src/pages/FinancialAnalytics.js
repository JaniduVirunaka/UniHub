import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ClubNavigation from '../components/ClubNavigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function FinancialAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [analytics, setAnalytics] = useState({ chartData: [], expenses: [] });
  
  // Expense Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', amount: '', description: '', date: '' });

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchClubData();
    fetchAnalytics();
  }, [id]);

  const fetchClubData = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}`)
      .then(res => setClub(res.data))
      .catch(err => console.log(err));
  };

  const fetchAnalytics = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}/analytics`)
      .then(res => setAnalytics(res.data))
      .catch(err => console.error("Error fetching analytics:", err));
  };

  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Financial Data...</div>;

  // --- STRICT ACCESS CONTROL ---
  const isSupervisor = currentUser?.role === 'supervisor';
  const isPresident = club.president?._id === currentUser?.id;
  const isVP = club.topBoard?.some(b => b.user?._id === currentUser?.id && b.role === 'Vice President');
  const isTreasury = club.topBoard?.some(b => b.user?._id === currentUser?.id && ['Treasurer', 'Assistant Treasurer'].includes(b.role));

  const canViewDashboard = isPresident || isVP || isTreasury || isSupervisor;
  
  // ONLY TREASURY CAN ADD/EDIT/DELETE
  const canManageExpenses = isTreasury;

  if (!canViewDashboard) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '50px' }}>
        <h2>Access Denied</h2>
        <p>You do not have clearance to view club financials.</p>
        <button className="btn btn-outline" onClick={() => navigate(`/clubs/${id}`)}>Return</button>
      </div>
    );
  }

  // --- EXPENSE ACTIONS ---
  const handleSubmitExpense = (e) => {
    e.preventDefault();
    const payload = { ...formData, userId: currentUser?.id };

    if (editingId) {
      axios.put(`http://localhost:5000/api/clubs/${id}/expenses/${editingId}`, payload)
        .then(res => { alert(res.data.message); resetForm(); fetchAnalytics(); })
        .catch(err => alert("Error updating expense."));
    } else {
      axios.post(`http://localhost:5000/api/clubs/${id}/expenses`, payload)
        .then(res => { alert(res.data.message); resetForm(); fetchAnalytics(); })
        .catch(err => alert("Error logging expense."));
    }
  };

  const handleDeleteExpense = (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense record?")) return;
    axios.delete(`http://localhost:5000/api/clubs/${id}/expenses/${expenseId}`, { data: { userId: currentUser?.id } })
      .then(res => fetchAnalytics())
      .catch(err => alert("Error deleting expense."));
  };

  const resetForm = () => {
    setFormData({ title: '', amount: '', description: '', date: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const openEditForm = (exp) => {
    const formattedDate = new Date(exp.date).toISOString().split('T')[0];
    setFormData({ title: exp.title, amount: exp.amount, description: exp.description, date: formattedDate });
    setEditingId(exp._id);
    setShowForm(true);
  };

  // Quick Stats Calculation
  const totalRevenue = analytics.chartData[11]?.ytdRevenue || 0;
  const totalExpenses = analytics.chartData[11]?.ytdExpenses || 0;
  const currentBalance = totalRevenue - totalExpenses;

  return (
    <div className="container">
      <div className="card" style={{ borderTop: '4px solid var(--primary-color)', paddingBottom: 0 }}>
        <button className="btn btn-outline" style={{ marginBottom: '20px' }} onClick={() => navigate(`/clubs/${id}`)}>
          &larr; Back to Main Hub
        </button>
        <h1 style={{ color: 'var(--primary-color)', margin: '0 0 10px 0' }}>📈 Executive Financial Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Comprehensive oversight of {club.name}'s revenue, expenses, and net balance.</p>
        <ClubNavigation club={club} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center', marginBottom: 0, border: '1px solid var(--success)' }}>
          <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>YTD Revenue</h4>
          <h2 style={{ margin: '10px 0 0 0', color: 'var(--success)' }}>Rs. {totalRevenue.toLocaleString()}</h2>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center', marginBottom: 0, border: '1px solid var(--danger)' }}>
          <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>YTD Expenses</h4>
          <h2 style={{ margin: '10px 0 0 0', color: 'var(--danger)' }}>Rs. {totalExpenses.toLocaleString()}</h2>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center', marginBottom: 0, border: '1px solid var(--primary-color)', backgroundColor: 'var(--primary-light)' }}>
          <h4 style={{ margin: 0, color: 'var(--text-secondary)' }}>Net Balance</h4>
          <h2 style={{ margin: '10px 0 0 0', color: 'var(--primary-color)' }}>Rs. {currentBalance.toLocaleString()}</h2>
        </div>
      </div>

      {/* --- THE CHART --- */}
      <div className="card" style={{ border: '1px solid var(--border-color)', padding: '20px' }}>
        <h3 style={{ color: 'var(--text-main)', marginTop: 0, marginBottom: '20px' }}>📊 Revenue vs Expenses Trajectory</h3>
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--success)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                itemStyle={{ fontWeight: 'bold' }}
                formatter={(value, name) => [`Rs. ${value.toLocaleString()}`, name]}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}/>
              <Area type="monotone" dataKey="ytdRevenue" name="Cumulative Revenue" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              <Area type="monotone" dataKey="ytdExpenses" name="Cumulative Expenses" stroke="var(--danger)" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- EXPENSE MANAGEMENT TABLE --- */}
      <div className="card" style={{ border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
          <h3 style={{ color: 'var(--text-main)', margin: 0 }}>💸 Expense Ledger</h3>
          {canManageExpenses && !showForm && (
            <button className="btn btn-success" style={{ padding: '8px 15px', fontSize: '0.9rem' }} onClick={() => setShowForm(true)}>
              + Log New Expense
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ backgroundColor: 'var(--bg-color)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary-color)', marginBottom: '20px' }}>
            <h4 style={{ color: 'var(--primary-color)', margin: '0 0 15px 0' }}>{editingId ? '✏️ Edit Expense Record' : '📝 Log New Expense'}</h4>
            <form onSubmit={handleSubmitExpense}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <input type="text" className="form-control" placeholder="Expense Title (e.g. Venue Rental)" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required style={{ margin: 0 }}/>
                <input type="number" className="form-control" placeholder="Amount (Rs.)" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} required style={{ margin: 0 }}/>
                <input type="date" className="form-control" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} required style={{ margin: 0 }}/>
              </div>
              <textarea className="form-control" placeholder="Notes or Invoice References..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} style={{ marginBottom: '15px', minHeight: '60px' }}/>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }}>Save Record</button>
                <button type="button" className="btn btn-outline" style={{ flex: 1, backgroundColor: 'var(--surface-color)' }} onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {analytics.expenses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No expenses recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Description</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Amount</th>
                  {canManageExpenses && <th style={{ padding: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {[...analytics.expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).map(exp => (
                  <tr key={exp._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px', color: 'var(--text-main)' }}>{new Date(exp.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                      <strong style={{ display: 'block', color: 'var(--text-main)' }}>{exp.title}</strong>
                      <small style={{ color: 'var(--text-muted)' }}>{exp.description}</small>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--danger)', fontWeight: 'bold' }}>Rs. {exp.amount.toLocaleString()}</td>
                    {canManageExpenses && (
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-edit" style={{ padding: '4px 10px', fontSize: '0.8rem', margin: 0 }} onClick={() => openEditForm(exp)}>✏️</button>
                          <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem', margin: 0 }} onClick={() => handleDeleteExpense(exp._id)}>🗑️</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancialAnalytics;