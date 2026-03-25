import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ClubNavigation from '../components/ClubNavigation';

function MembershipFees() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  
  // States for inline editing the ledger (Treasury)
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: 'Pending', amountPaid: 0 });

  // NEW: State for the student's payment input
  const [paymentAmount, setPaymentAmount] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchClubData();
  }, [id]);

  const fetchClubData = () => {
    axios.get(`http://localhost:5000/api/clubs/${id}`)
      .then(res => setClub(res.data))
      .catch(err => console.log(err));
  };

  // 1. EARLY RETURN: Stop here if the data hasn't loaded yet!
  if (!club) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading Treasury Ledger...</div>;

  // 2. BUILD THE MASTER MEMBER LIST (Now guaranteed to have club data)
  let allMembers = [];
  
  if (club.members) {
    allMembers = [...club.members];
  }
  
  if (club.president && !allMembers.some(m => m._id === club.president._id)) {
    allMembers.push(club.president);
  }
  
  if (club.topBoard) {
    club.topBoard.forEach(boardMember => {
      if (boardMember.user && !allMembers.some(m => m._id === boardMember.user._id)) {
        allMembers.push(boardMember.user);
      }
    });
  }

  // 3. STRICT TREASURY ACCESS CONTROL
  const isSupervisor = currentUser?.role === 'supervisor';
  const isActualPresident = club.president?._id === currentUser?.id;
  const isVP = club.topBoard?.some(b => b.user?._id === currentUser?.id && b.role === 'Vice President');
  const isPresident = isActualPresident || isVP;

  const isTreasury = club.topBoard?.some(b => b.user?._id === currentUser?.id && ['Treasurer', 'Assistant Treasurer'].includes(b.role));
  
  const canManageFees = isPresident || isTreasury;
  // NEW: A combined permission so the layout knows when to show the ledger
  const canViewLedger = canManageFees || isSupervisor;
  
  
  // 4. ACTIONS (These functions can now safely see the allMembers list!)
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

    // Successfully uses our combined list!
    allMembers.forEach(member => {
      const record = club.feeRecords?.find(f => f.user === member._id) || { status: 'Pending', amountPaid: 0, lastUpdated: 'N/A' };
      const dateStr = record.lastUpdated !== 'N/A' ? new Date(record.lastUpdated).toLocaleDateString() : 'N/A';
      
      // --- NEW LOGIC: Check if they have an ExCo Role ---
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
        `${member.name}${roleTag}`, // Appends the role right next to their name!
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
      <button className="btn" style={{ backgroundColor: '#6b7280', marginBottom: '20px' }} onClick={() => navigate(`/clubs/${id}`)}>
        &larr; Back to {club.name} Hub
      </button>

      {/* HEADER */}
      <div className="card" style={{ borderTop: '4px solid #10b981', textAlign: 'center', backgroundColor: '#ecfdf5' }}>
        <h1 style={{ color: '#059669', margin: '0 0 10px 0' }}>💳 Membership Fee Portal</h1>
      </div>

      <ClubNavigation club={club} />

      <div style={{ display: 'grid', gridTemplateColumns: canViewLedger ? '1fr 2fr' : '1fr', gap: '30px' }}>
        
        {/* LEFT COLUMN: Personal Status */}
        <div>
          {!isSupervisor && (
          <div className="card" style={{ border: '1px solid #a7f3d0', backgroundColor: '#fff' }}>
            <h3 style={{ color: '#059669', marginTop: 0, borderBottom: '2px solid #a7f3d0', paddingBottom: '10px' }}>My Payment Status</h3>
            
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <span style={{ 
                display: 'inline-block', padding: '8px 20px', borderRadius: '20px', fontSize: '1.1rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px',
                backgroundColor: myStatus === 'Paid' ? '#dcfce7' : myStatus === 'Pending Verification' ? '#dbeafe' : myStatus === 'Exempt' ? '#f3f4f6' : '#fef3c7',
                color: myStatus === 'Paid' ? '#166534' : myStatus === 'Pending Verification' ? '#1e40af' : myStatus === 'Exempt' ? '#4b5563' : '#b45309'
              }}>
                {myStatus === 'Pending Verification' ? '⏳ Pending Verification' : myStatus}
              </span>
              
              <h4 style={{ margin: '0 0 5px 0', color: '#374151' }}>Amount Logged: Rs. {myAmount.toLocaleString()}</h4>
              
              {/* UPGRADED: PAYMENT ENTRY FORM */}
              {myStatus === 'Pending' && (
                <div style={{ marginTop: '20px', borderTop: '1px dashed #d1d5db', paddingTop: '15px', textAlign: 'left' }}>
                  <p style={{ color: '#4b5563', fontSize: '0.9rem', marginBottom: '10px' }}>
                    <strong>Submit Bank Transfer Details</strong><br/>
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
                    <button type="submit" className="btn" style={{ backgroundColor: '#10b981', margin: 0, fontWeight: 'bold', padding: '8px 15px' }}>
                      Submit
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
          )}

          {/* Quick Stats (Only Treasurers see this) */}
          {canViewLedger && (
            <div className="card" style={{ border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <h4 style={{ color: '#374151', margin: '0 0 15px 0' }}>📈 Treasury Overview</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ color: '#6b7280' }}>Total Members:</span>
                <strong style={{ color: '#111827' }}>{club.members?.length || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', marginBottom: '20px' }}>
                <span style={{ color: '#059669', fontWeight: 'bold' }}>Verified Funds:</span>
                <strong style={{ color: '#059669' }}>Rs. {totalCollected.toLocaleString()}</strong>
              </div>
              
              <button className="btn" style={{ width: '100%', backgroundColor: '#0ea5e9', padding: '10px', fontWeight: 'bold' }} onClick={generateLedgerPDF}>
                📥 Download Master Ledger
              </button>
            </div>
          )}
        </div>

    {/* RIGHT COLUMN: Master Ledger (For Execs, Treasury & Supervisors) */}
        {canViewLedger && (
          <div className="card" style={{ border: '1px solid #d1d5db', padding: '20px' }}>
            <h3 style={{ color: '#111827', marginTop: 0, borderBottom: '2px solid #e5e7eb', paddingBottom: '10px', marginBottom: '20px' }}>
              📖 Official Treasury Ledger
            </h3>

            {allMembers.length === 0 ? (
              <p style={{ color: '#6b7280', fontStyle: 'italic' }}>No approved members in this club yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                      <th style={{ padding: '12px', color: '#374151' }}>Member Name</th>
                      <th style={{ padding: '12px', color: '#374151' }}>Status</th>
                      <th style={{ padding: '12px', color: '#374151' }}>Amount (Rs.)</th>
                      {/* Hide Actions column header if they are a Supervisor */}
                      {canManageFees && <th style={{ padding: '12px', color: '#374151', textAlign: 'right' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {allMembers.map(member => {
                      const record = club.feeRecords?.find(f => f.user === member._id) || { status: 'Pending', amountPaid: 0 };
                      const isEditing = editingId === member._id;

                      return (
                        <tr key={member._id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: record.status === 'Pending Verification' ? '#eff6ff' : 'transparent' }}>
                          <td style={{ padding: '12px' }}>
                            <strong style={{ display: 'block', color: '#111827' }}>{member.name}</strong>
                            <small style={{ color: '#6b7280' }}>{member.email}</small>
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
                              <span style={{ 
                                padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                                backgroundColor: record.status === 'Paid' ? '#dcfce7' : record.status === 'Pending Verification' ? '#dbeafe' : record.status === 'Exempt' ? '#f3f4f6' : '#fef3c7',
                                color: record.status === 'Paid' ? '#166534' : record.status === 'Pending Verification' ? '#1e40af' : record.status === 'Exempt' ? '#4b5563' : '#b45309'
                              }}>
                                {record.status === 'Pending Verification' ? '⏳ Verification' : record.status}
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '12px' }}>
                            {isEditing ? (
                              <input type="number" className="form-control" value={editForm.amountPaid} onChange={(e) => setEditForm({...editForm, amountPaid: e.target.value})} style={{ margin: 0, padding: '6px', width: '80px' }} />
                            ) : (
                              <strong style={{ color: record.amountPaid > 0 ? '#059669' : '#374151' }}>{record.amountPaid.toLocaleString()}</strong>
                            )}
                          </td>

                          {/* Hide Actions buttons if they are a Supervisor */}
                          {canManageFees && (
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              {isEditing ? (
                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                  <button className="btn" style={{ backgroundColor: '#10b981', padding: '6px 12px', fontSize: '0.8rem', margin: 0 }} onClick={() => handleUpdateFee(member._id)}>Save</button>
                                  <button className="btn" style={{ backgroundColor: '#6b7280', padding: '6px 12px', fontSize: '0.8rem', margin: 0 }} onClick={() => setEditingId(null)}>Cancel</button>
                                </div>
                              ) : (
                                <button className="btn" style={{ backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '6px 12px', fontSize: '0.8rem', margin: 0 }} onClick={() => {
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
        )}
      </div>
    </div>
  );
}

export default MembershipFees;