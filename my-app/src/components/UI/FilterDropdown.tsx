
import { useState } from 'react';

interface FilterDropdownProps {
  label: string;
  selectedCount: number;
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

export const FilterDropdown = ({ label, selectedCount, placeholder, isOpen, onToggle, children }: FilterDropdownProps) => (
  <div className="custom-dropdown-container" style={{ position: 'relative', width: '250px' }}>
    <p style={{ fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>{label}:</p>
    <div 
      onClick={onToggle}
      style={{
        background: 'rgba(5, 10, 37, 0.4)', border: '1px solid #444',
        padding: '10px', borderRadius: '4px', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#5cd6ce'
      }}
    >
      <span style={{ fontSize: '0.8rem' }}>
        {selectedCount > 0 ? `SELECTED (${selectedCount})` : placeholder}
      </span>
      <span>{isOpen ? '▲' : '▼'}</span>
    </div>
    {isOpen && (
      <div style={{
        position: 'absolute', top: '100%', left: 0, right: 0,
        background: '#1a1a1a', border: '1px solid #81a4e4', zIndex: 1000,
        maxHeight: '200px', overflowY: 'auto', marginTop: '5px', borderRadius: '4px'
      }}>
        {children}
      </div>
    )}
  </div>
);