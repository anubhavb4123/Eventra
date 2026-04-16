import React from 'react';

interface StatusBadgeProps {
  status: 'present' | 'absent';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'present') {
    return (
      <span className="badge-present">
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
        Present
      </span>
    );
  }
  return (
    <span className="badge-absent">
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F87171', display: 'inline-block' }} />
      Absent
    </span>
  );
};
