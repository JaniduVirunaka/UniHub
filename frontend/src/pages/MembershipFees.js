import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ClubNavigation from '../components/ClubNavigation';

// --- NEW: Import Recharts for the Analytics Dashboard ---
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function MembershipFees() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  
  //Set state for Analytics data
  const [analytics, setAnalytics] = useState({ chartData: [], targets: { overallTarget: 0 } });
  // States for inline editing the ledger (Treasury)
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'Pending', amountPaid: 0 });

  // State for the student's payment input
  const [paymentAmount, setPaymentAmount] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchClubData();
    fetchAnalytics(); // Grab the chart data when the page loads!
  }, [id]);

  const fetchClubData = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}`)
      .then(res => setClub(res.data))
      .catch(err => console.log(err));
  };

  // --- NEW: Fetch the aggregated data from our new backend route ---
  const fetchAnalytics = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}/analytics`)
      .then(res => setAnalytics(res.data))
      .catch(err => console.error("Error fetching analytics:", err));
  };

  // 1. EARLY RETURN: Stop here if the data hasn't loaded yet!
  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Treasury Ledger...</div>;

 // 2. BUILD THE MASTER MEMBER LIST (Sorted: ExCo alphabetically, then Normal alphabetically)
  let excoMembers = [];
  let normalMembers = [];
  const excoIds = new Set();

  if (club.president) {
    excoIds.add(club.president._id);
    excoMembers.push(club.president);
  }

  if (club.topBoard) {
    club.topBoard.forEach(b => {
      if (b.user && !excoIds.has(b.user._id)) {
        excoIds.add(b.user._id);
        excoMembers.push(b.user);
      }
    });
  }

  if (club.members) {
    club.members.forEach(m => {
      if (!excoIds.has(m._id)) {
        normalMembers.push(m);
      }
    });
  }

  const sortByName = (a, b) => (a.name || '').localeCompare(b.name || '');
  excoMembers.sort(sortByName);
  normalMembers.sort(sortByName);

  const allMembers = [...excoMembers, ...normalMembers];

  // 3. STRICT TREASURY ACCESS CONTROL
  const isSupervisor = currentUser?.role === 'supervisor';
  const isActualPresident = club.president?._id === currentUser?.id;
  const isVP = club.topBoard?.some(b => b.user?._id === currentUser?.id && b.role === 'Vice President');
  const isPresident = isActualPresident || isVP;
  const isTreasury = club.topBoard?.some(b => b.user?._id === currentUser?.id && ['Treasurer', 'Assistant Treasurer'].includes(b.role));
  
  const canManageFees = isPresident || isTreasury;
  const canViewLedger = canManageFees || isSupervisor;
  
  // 4. ACTIONS 
  const handleSubmitPayment = (e) => {
    e.preventDefault(); 
    if (!paymentAmount || paymentAmount <= 0) return alert("Please enter a valid amount.");
    if (!window.confirm(`Are you sure you want to log a payment of Rs. ${paymentAmount} for verification?`)) return;
    
    axios.post(`http://localhost:5000/api/clubs/${id}/fees/pay`, {
      userId: currentUser?.id,
      amount: Number(paymentAmount)
    })
    .then(res => {
      alert(res.data.message);
      setPaymentAmount(''); 
      fetchClubData(); 
    })
    .catch(err => alert("Error processing payment."));
  };

  const handleUpdateFee = (studentId) => {
    axios.put(`http://localhost:5000/api/clubs/${id}/fees/update`, {
      studentId,
      status: editForm.status,
      amountPaid: Number(editForm.amountPaid),
      requestorId: currentUser?.id
    })
    .then(res => {
      alert(res.data.message);
      setEditingId(null);
      fetchClubData(); 
      fetchAnalytics(); // Refresh the chart if a fee is approved!
    })
    .catch(err => alert(err.response?.data?.message || "Error updating fee record."));
  };

 const generateLedgerPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(`${club.name} - Official Treasury Ledger`, 14, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    const totalCollectedPDF = club.feeRecords?.filter(r => r.status === 'Paid').reduce((sum, record) => sum + record.amountPaid, 0) || 0;
    doc.text(`Total Verified Funds: Rs. ${totalCollectedPDF.toLocaleString()}`, 14, 34);

    const tableColumn = ["Member Name", "Email", "Status", "Amount Paid", "Last Updated"];
    const tableRows = [];

    allMembers.forEach(member => {
      const record = club.feeRecords?.find(f => f.user === member._id) || { status: 'Pending', amountPaid: 0, lastUpdated: 'N/A' };
      const dateStr = record.lastUpdated !== 'N/A' ? new Date(record.lastUpdated).toLocaleDateString() : 'N/A';
      
      let roleTag = "";
      if (club.president?._id === member._id) {
        roleTag = " (President)";
      } else {
        const boardMatch = club.topBoard?.find(b => (b.user?._id || b.user) === member._id);
        if (boardMatch) {
          roleTag = ` (${boardMatch.role})`;
        }
      }
      
      tableRows.push([
        `${member.name}${roleTag}`,
        member.email,
        record.status,
        `Rs. ${record.amountPaid.toLocaleString()}`,
        dateStr
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129] }, 
      alternateRowStyles: { fillColor: [236, 253, 245] }
    });

    doc.save(`${club.name.replace(/\s+/g, '_')}_Treasury_Ledger.pdf`);
  };

  // 5. RENDER VARIABLES
  const myRecord = club.feeRecords?.find(f => f.user === currentUser?.id);
  const myStatus = myRecord ? myRecord.status : 'Pending';
  const myAmount = myRecord ? myRecord.amountPaid : 0;
  
  const totalCollected = club.feeRecords?.filter(r => r.status === 'Paid').reduce((sum, record) => sum + record.amountPaid, 0) || 0;

  return (
    <div className="container">
      <button className="btn btn-outline" style={{ marginBottom: '20px', backgroundColor: 'var(--surface-color)' }} onClick={() => navigate(`/clubs/${id}`)}>
        &larr; Back to {club.name} Hub
      </button>

      {/* HEADER */}
      <div className="card" style={{ borderTop: '4px solid var(--success)', textAlign: 'center', backgroundColor: 'var(--success-bg)', paddingBottom: '20px' }}>
        <h1 style={{ color: 'var(--success)', margin: '0 0 10px 0' }}>💳 Treasury & Analytics Portal</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.05rem' }}>Securely manage club finances and view real-time growth metrics.</p>
      </div>

      <ClubNavigation club={club} />

      <div style={{ display: 'grid', gridTemplateColumns: canViewLedger ? '1fr 2fr' : '1fr', gap: '30px' }}>
        
        {/* LEFT COLUMN: Personal Status & Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {!isSupervisor && (
          <div className="card" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--surface-color)', marginBottom: 0 }}>
            <h3 style={{ color: 'var(--text-main)', marginTop: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>My Payment Status</h3>
            
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <span className="badge" style={{ 
                padding: '8px 20px', fontSize: '1.1rem', marginBottom: '15px',
                backgroundColor: myStatus === 'Paid' ? 'var(--success-bg)' : myStatus === 'Pending Verification' ? 'var(--primary-light)' : myStatus === 'Exempt' ? 'var(--bg-color)' : 'var(--warning-bg)',
                color: myStatus === 'Paid' ? 'var(--success)' : myStatus === 'Pending Verification' ? 'var(--primary-color)' : myStatus === 'Exempt' ? 'var(--text-muted)' : 'var(--warning)'
              }}>
                {myStatus === 'Pending Verification' ? '⏳ Pending Verification' : myStatus}
              </span>
              
              <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)' }}>Amount Logged: Rs. {myAmount.toLocaleString()}</h4>
              
              {/* UPGRADED: PAYMENT ENTRY FORM */}
              {myStatus === 'Pending' && (
                <div style={{ marginTop: '20px', borderTop: '1px dashed var(--border-color)', paddingTop: '15px', textAlign: 'left' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>
                    <strong style={{ color: 'var(--text-main)' }}>Submit Bank Transfer Details</strong><br/>
                    Transfer funds to the club account, then enter the amount you paid below.
                  </p>
                  <form onSubmit={handleSubmitPayment} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="number" 
                      className="form-control" 
                      placeholder="Amount (Rs.)" 
                      value={paymentAmount} 
                      onChange={(e) => setPaymentAmount(e.target.value)} 
                      required 
                      min="1"
                      style={{ margin: 0, flex: 1 }} 
                    />
                    <button type="submit" className="btn btn-success" style={{ margin: 0, padding: '8px 15px' }}>
                      Submit
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Quick Stats (Only Treasurers and Supervisors see this) */}
          {canViewLedger && (
            <div className="card" style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', marginBottom: 0 }}>
              <h4 style={{ color: 'var(--text-main)', margin: '0 0 15px 0' }}>📈 Quick Overview</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Members:</span>
                <strong style={{ color: 'var(--text-main)' }}>{allMembers?.length || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginBottom: '20px' }}>
                <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>Verified Funds:</span>
                <strong style={{ color: 'var(--success)' }}>Rs. {totalCollected.toLocaleString()}</strong>
              </div>
              
              <button className="btn btn-outline" style={{ width: '100%', backgroundColor: 'var(--surface-color)' }} onClick={generateLedgerPDF}>
                📥 Download Master Ledger
              </button>
            </div>
          )}
        </div>

    {/* RIGHT COLUMN: Interactive Analytics & Master Ledger (Execs & Supervisors) */}
        {canViewLedger && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* --- THE NEW FINANCIAL ANALYTICS DASHBOARD --- */}
            <div className="card" style={{ border: '1px solid var(--border-color)', padding: '20px', marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                <h3 style={{ color: 'var(--text-main)', margin: 0 }}>
                  📊 Year-to-Date (YTD) Trajectory
                </h3>
                
                {/* The New Target Tracker */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>
                    ANNUAL TARGET: Rs. {analytics.targets.overallTarget.toLocaleString()}
                  </div>
                  <div style={{ width: '200px', backgroundColor: 'var(--bg-color)', borderRadius: '99px', height: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <div style={{ 
                      width: `${Math.min((totalCollected / (analytics.targets.overallTarget || 1)) * 100, 100)}%`, 
                      backgroundColor: 'var(--success)', height: '100%', transition: 'width 1s ease-in-out' 
                    }}></div>
                  </div>
                </div>
              </div>
              
              <div style={{ width: '100%', height: 320 }}>
                {analytics.chartData.length === 0 ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Crunching numbers...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--success)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--success)" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSponsorships" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                      <YAxis stroke="var(--text-muted)" fontSize={12} />
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      
                      {/* Upgraded Tooltip showing Percentages! */}
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--surface-color)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)', boxShadow: 'var(--shadow-md)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(value, name) => [`Rs. ${value.toLocaleString()}`, name]}
                        labelFormatter={(label) => `End of ${label}`}
                      />
                      
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}/>
                      
                      {/* We now graph the Cumulative totals! */}
                      <Area type="monotone" dataKey="cumulativeFees" name="YTD Member Fees" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorFees)" />
                      <Area type="monotone" dataKey="cumulativeSponsorships" name="YTD Sponsorships" stroke="var(--primary-color)" strokeWidth={3} fillOpacity={1} fill="url(#colorSponsorships)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* MASTER LEDGER */}
            <div className="card" style={{ border: '1px solid var(--border-color)', padding: '20px', marginBottom: 0 }}>
              <h3 style={{ color: 'var(--text-main)', marginTop: 0, borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginBottom: '20px' }}>
                📖 Official Treasury Ledger
              </h3>

              {allMembers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No approved members in this club yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)' }}>
                        <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Member Name</th>
                        <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Status</th>
                        <th style={{ padding: '12px', color: 'var(--text-secondary)' }}>Amount (Rs.)</th>
                        {canManageFees && <th style={{ padding: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {allMembers.map(member => {
                        const record = club.feeRecords?.find(f => f.user === member._id) || { status: 'Pending', amountPaid: 0 };
                        const isEditing = editingId === member._id;

                        return (
                          <tr key={member._id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: record.status === 'Pending Verification' ? 'var(--primary-light)' : 'transparent', transition: 'var(--transition)' }}>
                            <td style={{ padding: '12px' }}>
                              <strong style={{ display: 'block', color: 'var(--text-main)' }}>{member.name}</strong>
                              <small style={{ color: 'var(--text-muted)' }}>{member.email}</small>
                            </td>
                            
                            <td style={{ padding: '12px' }}>
                              {isEditing ? (
                                <select className="form-control" value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} style={{ margin: 0, padding: '6px' }}>
                                  <option value="Pending">Pending</option>
                                  <option value="Pending Verification">Pending Verification</option>
                                  <option value="Paid">Paid</option>
                                  <option value="Exempt">Exempt</option>
                                </select>
                              ) : (
                                <span className="badge" style={{ 
                                  backgroundColor: record.status === 'Paid' ? 'var(--success-bg)' : record.status === 'Pending Verification' ? 'var(--primary-light)' : record.status === 'Exempt' ? 'var(--bg-color)' : 'var(--warning-bg)',
                                  color: record.status === 'Paid' ? 'var(--success)' : record.status === 'Pending Verification' ? 'var(--primary-color)' : record.status === 'Exempt' ? 'var(--text-muted)' : 'var(--warning)'
                                }}>
                                  {record.status === 'Pending Verification' ? '⏳ Verification' : record.status}
                                </span>
                              )}
                            </td>

                            <td style={{ padding: '12px' }}>
                              {isEditing ? (
                                <input type="number" className="form-control" value={editForm.amountPaid} onChange={(e) => setEditForm({...editForm, amountPaid: e.target.value})} style={{ margin: 0, padding: '6px', width: '80px' }} />
                              ) : (
                                <strong style={{ color: record.amountPaid > 0 ? 'var(--success)' : 'var(--text-main)' }}>{record.amountPaid.toLocaleString()}</strong>
                              )}
                            </td>

                            {canManageFees && (
                              <td style={{ padding: '12px', textAlign: 'right' }}>
                                {isEditing ? (
                                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                    <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.8rem', margin: 0 }} onClick={() => handleUpdateFee(member._id)}>Save</button>
                                    <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', margin: 0, backgroundColor: 'var(--surface-color)' }} onClick={() => setEditingId(null)}>Cancel</button>
                                  </div>
                                ) : (
                                  <button className="btn btn-edit" style={{ padding: '6px 12px', fontSize: '0.85rem', margin: 0 }} onClick={() => {
                                    setEditingId(member._id);
                                    setEditForm({ status: record.status, amountPaid: record.amountPaid });
                                  }}>
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

          </div>
        )}
      </div>
    </div>
  );
}

export default MembershipFees;