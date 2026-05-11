import { Card } from '../../components/UI/Card';
import type { DeviceDTO } from '../../models/device.dto';
import { RotateCw, Search, Trash2 } from 'lucide-react';
import { Button } from '../UI/Button';
import { useState } from 'react';

interface DeviceListProps {
  device: DeviceDTO[];
  users: any[];
  onDelete: (id: string) => void;
  onDevice: (e: React.SyntheticEvent) => void;
  onDeviceClick: (dev: DeviceDTO) => void;
  isAdmin :boolean;
  currentUserId: string | number | undefined;
  onRegister?:() => void;

  onFilterChange:(userIds?: number[] ) => void;
  targetUserIds: number[];
  totalCount? : number;

}

export const DeviceList = ({ device = [], users = [], onDelete, onDevice, onDeviceClick, isAdmin, currentUserId, onRegister, onFilterChange, targetUserIds=[]}: DeviceListProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Logika za filtriranje po imenu ili tipu
  const filteredDevices = device.filter(dev => {
  
    return (
      dev.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
});
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  return (
   
    <Card title={isAdmin? " SYSTEM DEVICE FEED" : "MY_ASSIGNED_DEVICES"}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
        <div className="search-container" style={{ margin: 0, flex: 1 }}>
          <input 
            type="text" 
            placeholder="SEARCH_BY_NAME_OR_TYPE..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Button 
            className="btn-register-cyber" 
            onClick={onRegister}
            style={{ whiteSpace: 'nowrap' }}
          >
            + REGISTER_DEVICE
          </Button>
        )}
  
         {isAdmin && (
          
          
          
            <div className="custom-dropdown-container" style={{ position: 'relative', width: '250px' }}>
              <p style={{ fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>FILTER_BY_USERS:</p>
              
              {/* Glavni Dropdown "Okidač" */}
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid #444',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#fff'
                }}
              >
                <span style={{ fontSize: '0.8rem' }}>
                  {targetUserIds.length > 0 ? `SELECTED (${targetUserIds.length})` : 'SELECT_USERS'}
                </span>
                <span>{isDropdownOpen ? '▲' : '▼'}</span>
              </div>

              {/* Lista koja se pojavljuje */}
              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#1a1a1a',
                  border: '1px solid #81a4e4',
                  zIndex: 1000,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  marginTop: '5px',
                  borderRadius: '4px'
                }}>
                  {users.map(u => (
                    <label 
                      key={u.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '10px', 
                        gap: '10px', 
                        cursor: 'pointer',
                        borderBottom: '1px solid #222',
                        fontSize: '0.8rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(129, 164, 228, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <input 
                        type="checkbox"
                        checked={targetUserIds.includes(u.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked 
                            ? [...targetUserIds, u.id] 
                            : targetUserIds.filter(id => id !== u.id);
                          onFilterChange(newIds);
                        }}
                        style={{ accentColor: '#81a4e4' }}
                      />
                      {u.email}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        
        {/* Search Polje */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
       
        

        <Button onClick={onDevice} className="btn-refresh" title="SYNC_DATABASE">
          <RotateCw size={18} />
        </Button>
      </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="techno-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Serial Number</th>
              <th>Owner ID</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>
                  NO_DEVICES_MATCH_SEARCH_CRITERIA
                </td>
              </tr>
            ) : (
              filteredDevices.map((dev) => (
                <tr key={dev.id}
                onClick={() => onDeviceClick(dev)} 
                style={{ cursor: 'pointer' }} 
                className="table-row-hover">
                  <td style={{ color: '#81a4e4', fontWeight: 'bold' }}>{dev.name}</td>
                  <td>
                    <span style={{ color: '#e0e867', fontSize: '0.8rem' }}>{dev.type}</span>
                  </td>
                  <td style={{ opacity: 0.8 }}>{dev.serialNumber}</td>
                  <td>
                    <span style={{ color: '#aaa', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                      {dev.user? `USER_${dev.user.email}` : 'UNASSIGNED'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                  {isAdmin &&(
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`DELETE DEVICE: ${dev.serialNumber}?`)) {
                          onDelete(dev.id); 
                        }
                      }}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: 'var(--accent-danger)', 
                        cursor: 'pointer' 
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};