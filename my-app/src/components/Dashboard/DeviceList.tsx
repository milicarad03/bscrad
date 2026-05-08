import { Card } from '../../components/UI/Card';
import type { DeviceDTO } from '../../models/device.dto';
import { RotateCw, Search, Trash2 } from 'lucide-react';
import { Button } from '../UI/Button';
import { useState } from 'react';

interface DeviceListProps {
  device: DeviceDTO[];
  onDelete: (id: string) => void;
  onDevice: (e: React.SyntheticEvent) => void;
  onDeviceClick: (dev: DeviceDTO) => void;
  isAdmin :boolean;
  currentUserId: string | number | undefined;
}

export const DeviceList = ({ device, onDelete, onDevice, onDeviceClick, isAdmin, currentUserId}: DeviceListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyMine, setShowOnlyMine]=useState(false);

  // Logika za filtriranje po imenu ili tipu
  const filteredDevices = device.filter(dev => {
  
    return (
      dev.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dev.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
});

  return (
    <Card title=" SYSTEM DEVICE FEED">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        {/* Search Polje */}
        <div className="search-container" style={{ margin: 0 }}>
          <input 
            type="text" 
            placeholder="FILTER_BY_NAME_OR_TYPE..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        

        <Button onClick={onDevice} className="btn-refresh" title="SYNC_DATABASE">
          <RotateCw size={18} />
        </Button>
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