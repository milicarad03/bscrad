import { Trash2 } from 'lucide-react';
import type { DeviceDTO } from '../../models/device.dto';

interface DeviceTableProps {
  devices: DeviceDTO[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onDeviceClick: (dev: DeviceDTO) => void;
}

export const DeviceTable = ({ devices, isAdmin, onDelete, onDeviceClick }: DeviceTableProps) => {
  return (
    <div style={{ overflowX: 'auto', marginTop: '20px' }}>
      <table className="techno-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Serial Number</th>
            <th>Owner</th>
            {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {devices.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>
                NO_DEVICES_MATCH_SEARCH_CRITERIA
              </td>
            </tr>
          ) : (
            devices.map((dev) => (
              <tr 
                key={dev.id}
                onClick={() => onDeviceClick(dev)} 
                style={{ cursor: 'pointer' }} 
                className="table-row-hover"
              >
                <td style={{ color: '#81a4e4', fontWeight: 'bold' }}>{dev.name}</td>
                <td>
                  <span style={{ color: '#e0e867', fontSize: '0.8rem' }}>{dev.type}</span>
                </td>
                <td style={{ opacity: 0.8 }}>{dev.serialNumber}</td>
                <td>
                  <span style={{ color: '#aaa', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {dev.user ? `USER_${dev.user.email}` : 'UNASSIGNED'}
                  </span>
                </td>
                
                {isAdmin && (
                  <td style={{ textAlign: 'right' }}>
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
                        color: '#ff4d4d', 
                        cursor: 'pointer',
                        padding: '5px'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};