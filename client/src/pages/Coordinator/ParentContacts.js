import React, { useState } from 'react';
import { Search, Phone, Mail, MessageCircle, Download } from 'lucide-react';

export default function ParentContacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('all');

  const parentContacts = [
    {
      id: 1,
      studentName: 'Aarav Sharma',
      enrollmentId: 'ENR001',
      batch: 'Batch A',
      fatherName: 'Rajesh Sharma',
      motherName: 'Priya Sharma',
      primaryContact: '+91 98765 43210',
      secondaryContact: '+91 98765 43211',
      email: 'rajesh.sharma@email.com',
      address: '123 MG Road, Delhi',
      lastContact: '2024-01-10',
      communicationPreference: 'phone'
    },
    {
      id: 2,
      studentName: 'Priya Patel',
      enrollmentId: 'ENR002',
      batch: 'Batch B',
      fatherName: 'Amit Patel',
      motherName: 'Meera Patel',
      primaryContact: '+91 98765 43212',
      secondaryContact: '+91 98765 43213',
      email: 'amit.patel@email.com',
      address: '456 Park Street, Mumbai',
      lastContact: '2024-01-12',
      communicationPreference: 'email'
    },
    {
      id: 3,
      studentName: 'Rahul Kumar',
      enrollmentId: 'ENR003',
      batch: 'Batch A',
      fatherName: 'Suresh Kumar',
      motherName: 'Sunita Kumar',
      primaryContact: '+91 98765 43214',
      secondaryContact: '+91 98765 43215',
      email: 'suresh.kumar@email.com',
      address: '789 Gandhi Nagar, Bangalore',
      lastContact: '2024-01-08',
      communicationPreference: 'sms'
    },
  ];

  const batches = ['Batch A', 'Batch B', 'Batch C'];

  const filteredContacts = parentContacts.filter(contact => {
    const matchesBatch = selectedBatch === 'all' || contact.batch === selectedBatch;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      contact.studentName.toLowerCase().includes(query) ||
      contact.fatherName.toLowerCase().includes(query) ||
      contact.motherName.toLowerCase().includes(query) ||
      contact.primaryContact.includes(query) ||
      contact.secondaryContact.includes(query);
    return matchesBatch && matchesQuery;
  });

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Parent Contacts</h2>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '10px', width: '300px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
        >
          <option value="all">All Batches</option>
          {batches.map((batch) => (
            <option key={batch} value={batch}>{batch}</option>
          ))}
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Student</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Parents</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Contacts</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Last Contact</th>
            <th style={{ borderBottom: '1px solid #ccc', padding: '10px', textAlign: 'left' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredContacts.map(contact => (
            <tr key={contact.id}>
              <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
                <strong>{contact.studentName}</strong><br />
                <small>{contact.enrollmentId}</small><br />
                <span style={{ backgroundColor: '#e0f2fe', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{contact.batch}</span>
              </td>
              <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
                Father: {contact.fatherName}<br />
                Mother: {contact.motherName}
              </td>
              <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
                📞 {contact.primaryContact}<br />
                📞 {contact.secondaryContact}<br />
                📧 {contact.email}
              </td>
              <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>{new Date(contact.lastContact).toLocaleDateString()}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: '10px' }}>
                <button style={{ marginRight: '5px' }}><Phone size={16} /></button>
                <button style={{ marginRight: '5px' }}><Mail size={16} /></button>
                <button><MessageCircle size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}