import { ChevronDown, ChevronUp } from 'lucide-react';
import '../../styles/layouts/filterDropdown.css'; // Updated CSS reference

interface FilterDropdownProps {
  label: string;
  selectedCount: number;
  placeholder: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  'data-cy'?: string;
}

export const FilterDropdown = ({
  label,
  selectedCount,
  placeholder,
  isOpen,
  onToggle,
  children,
  'data-cy': dataCy,
}: FilterDropdownProps) => (
  <div className="filter-dropdown-container" data-cy={dataCy}>
    <label className="filter-dropdown-title">{label}</label>
    <div 
      className={`filter-dropdown-toggle ${isOpen ? 'open' : ''}`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-expanded={isOpen}
    >
      <span className="filter-dropdown-value">
        {selectedCount > 0 ? `Selected (${selectedCount})` : placeholder}
      </span>
      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </div>
    
    {isOpen && (
      <div className="filter-dropdown-menu">
        {children}
      </div>
    )}
  </div>
);