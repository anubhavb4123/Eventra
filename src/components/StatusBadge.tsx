import React from 'react';

interface StatusBadgeProps {
  status: 'present' | 'absent';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'present') {
    return (
      <span className="ev-pill ev-pill-green">
        <span className="ev-dot ev-dot-green" />
        Present
      </span>
    );
  }
  return (
    <span className="ev-pill ev-pill-red">
      <span className="ev-dot ev-dot-red" />
      Absent
    </span>
  );
};
