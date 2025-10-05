import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({ name, value, change, changeType, icon: Icon }) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <p style={styles.title}>{name}</p>
          <p style={styles.value}>{value}</p>
        </div>
        <div>
          <Icon size={32} color="#9ca3af" />
        </div>
      </div>
      <div style={styles.changeRow}>
        {changeType === 'increase' ? (
          <TrendingUp size={16} color="#059669" style={styles.changeIcon} />
        ) : (
          <TrendingDown size={16} color="#dc2626" style={styles.changeIcon} />
        )}
        <span style={{ 
          ...styles.changeText, 
          color: changeType === 'increase' ? '#059669' : '#dc2626' 
        }}>
          {change}
        </span>
        <span style={styles.changeSubtext}>from last month</span>
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    margin: 0,
  },
  value: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    marginTop: '4px',
    marginBottom: 0,
  },
  changeRow: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '16px',
  },
  changeIcon: {
    marginRight: '4px',
  },
  changeText: {
    fontSize: '14px',
    fontWeight: '500',
  },
  changeSubtext: {
    fontSize: '14px',
    color: '#6b7280',
    marginLeft: '6px',
  },
};
