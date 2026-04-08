import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function GlobalAnalytics() {
  const [globalData, setGlobalData] = useState(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    // Security Kick-Out
    if (!currentUser || currentUser.role !== 'supervisor') {
      navigate('/clubs');
      return;
    }

    api.get('/clubs/global/analytics')
      .then(res => setGlobalData(res.data))
      .catch(err => console.error("Error fetching global matrix:", err));
  }, []);

  if (!globalData) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Initializing Global Matrix...</div>;

  //Dynamic KPI calculations
  const totalUniversityRev = globalData.masterChart[11]?.ytdRevenue || 0;
  const totalUniversityExp = globalData.masterChart[11]?.ytdExpenses || 0;
  const universityNet = totalUniversityRev - totalUniversityExp;

  const generateGlobalReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(`University Global Financial Report`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); doc.text(`Total University Revenue: Rs. ${totalUniversityRev.toLocaleString()}`, 14, 40);
    doc.setTextColor(220, 38, 38); doc.text(`Total University Expenses: Rs. ${totalUniversityExp.toLocaleString()}`, 14, 50);
    doc.setTextColor(37, 99, 235); doc.text(`University Net Balance: Rs. ${universityNet.toLocaleString()}`, 14, 60);

   autoTable(doc, {
      head: [["Rank", "Club Name", "Total Revenue (Rs.)", "Total Expenses (Rs.)", "Net Balance (Rs.)", "Active Members"]],
      body: globalData.leaderboard.map((club, index) => {
        const netBalance = club.totalRevenue - club.totalExpenses;
        return [
          `#${index + 1}`, 
          club.name, 
          club.totalRevenue.toLocaleString(), 
          club.totalExpenses.toLocaleString(), 
          netBalance.toLocaleString(),
          club.memberCount
        ];
      }),
      startY: 75,
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`Global_University_Financial_Report.pdf`);
  };

  return (
    <div className="container">
      <div className="card" style={{ borderTop: '4px solid #10b981', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <button className="btn btn-outline" style={{ marginBottom: '15px', backgroundColor: 'var(--surface-color)' }} onClick={() => navigate('/clubs')}>
            &larr; Back to Directory
          </button>
          <h1 style={{ color: '#10b981', margin: '0 0 5px 0' }}>🌐 Global Matrix</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>University-wide aggregated financial and demographic data.</p>
        </div>
        <button className="btn btn-success" onClick={generateGlobalReport}>
          📥 Export Master Report
        </button>
      </div>

      {/* KPI WIDGETS*/}
      <div className="quick-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '20px', marginBottom: 0, border: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Total University Revenue</h4>
          <h2 style={{ margin: 0, color: 'var(--success)' }}>Rs. {totalUniversityRev.toLocaleString()}</h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px', marginBottom: 0, border: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Total University Expenses</h4>
          <h2 style={{ margin: 0, color: 'var(--danger)' }}>Rs. {totalUniversityExp.toLocaleString()}</h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px', marginBottom: 0, backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-color)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)' }}>Global Net Balance</h4>
          <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Rs. {universityNet.toLocaleString()}</h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '20px', marginBottom: 0, border: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Total Active Students</h4>
          <h2 style={{ margin: 0, color: 'var(--text-main)' }}>{globalData.totalUniversityMembers}</h2>
        </div>
      </div>

      {/* THE MAIN DASHBOARD SPLIT */}
      <div className="dashboard-grid-global">
        
        {/* MASTER CHART */}
        <div className="card" style={{ border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginTop: 0, color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '15px' }}>Global Trajectory (YTD)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={globalData.masterChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--success)" stopOpacity={0.5}/><stop offset="95%" stopColor="var(--success)" stopOpacity={0}/></linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--danger)" stopOpacity={0.5}/><stop offset="95%" stopColor="var(--danger)" stopOpacity={0}/></linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.85rem' }}/>
                <Area type="monotone" dataKey="ytdRevenue" name="Global Revenue" stroke="var(--success)" strokeWidth={3} fill="url(#gRev)" />
                <Area type="monotone" dataKey="ytdExpenses" name="Global Expenses" stroke="var(--danger)" strokeWidth={3} fill="url(#gExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className="card" style={{ border: '1px solid #f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.05)' }}>
          <h3 style={{ marginTop: 0, color: '#d97706', borderBottom: '1px solid rgba(245, 158, 11, 0.2)', paddingBottom: '15px' }}>🏆 Top Performing Clubs</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {globalData.leaderboard.map((club, index) => {
              const netBalance = club.totalRevenue - club.totalExpenses;
              
              return (
                <li key={club.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 0', borderBottom: index < 4 ? '1px solid rgba(245, 158, 11, 0.2)' : 'none', flexWrap: 'wrap' }}>
                  
                  //Rank badges
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: index === 0 ? '#f59e0b' : 'var(--bg-color)', color: index === 0 ? '#fff' : 'var(--text-muted)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {index + 1}
                  </div>
                  
                  //Club details
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '1.05rem' }}>{club.name}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{club.memberCount} Members</span>
                  </div>
                  
                  <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <strong style={{ display: 'block', color: 'var(--success)', fontSize: '0.9rem' }}>
                      + {club.totalRevenue.toLocaleString()}
                    </strong>
                    <strong style={{ display: 'block', color: 'var(--danger)', fontSize: '0.85rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px', marginBottom: '4px' }}>
                      - {club.totalExpenses.toLocaleString()}
                    </strong>
                    <strong style={{ display: 'block', color: netBalance >= 0 ? 'var(--primary-color)' : 'var(--danger)', fontSize: '1.05rem' }}>
                      {netBalance >= 0 ? 'Net: ' : 'Debt: '}{netBalance.toLocaleString()}
                    </strong>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

      </div>
    </div>
  );
}

export default GlobalAnalytics;