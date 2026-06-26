import { Trash2, Circle, Radio } from 'lucide-react';
import type { DeviceDTO } from '../../models/device.dto';


interface DeviceTableProps {
  devices: DeviceDTO[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onDeviceClick: (dev: DeviceDTO) => void;
}

export const DeviceTable = ({ devices, isAdmin, onDelete, onDeviceClick }: DeviceTableProps) => {
  const statusPriority: Record<'ONLINE' | 'OFFLINE' | 'UNINITIALIZED', number> = {
    ONLINE: 1,
    OFFLINE: 2,
    UNINITIALIZED: 3,
  };

 
  const sortedDevices = [...devices].sort((a, b) => {
    const priorityA = statusPriority[a.status as 'ONLINE' | 'OFFLINE' | 'UNINITIALIZED'] || 99;
    const priorityB = statusPriority[b.status as 'ONLINE' | 'OFFLINE' | 'UNINITIALIZED'] || 99;
    return priorityA - priorityB;
  });
  return (
    <div style={{ overflowX: 'auto', marginTop: '20px' }}>
      <table className="techno-table" data-cy="device-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Serial Number</th>
            <th>Owner</th>
            <th>Status</th>
            {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {sortedDevices.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', opacity: 0.5, padding: '40px' }}>
                NO_DEVICES_MATCH_SEARCH_CRITERIA
              </td>
            </tr>
          ) : (
            sortedDevices.map((dev) => (
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
               <td>
                  <div 
                  data-cy={`device-status-${dev.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {dev.status === 'UNINITIALIZED' ? (
                      <>
                        <Radio size={14} style={{ color: '#7f8c8d' }} />
                        <span style={{ color: '#7f8c8d', fontSize: '0.75rem' }}>UNINITIALIZED</span>
                      </>
                    ) : dev.status === 'ONLINE' ? (
                      <>
                        <Circle size={12} fill="#2ecc71" style={{ color: '#2ecc71' }} />
                        <span style={{ color: '#2ecc71', fontSize: '0.75rem' }}>ONLINE</span>
                      </>
                    ) : (
                      <>
                        <Circle size={12} fill="#e74c3c" style={{ color: '#e74c3c' }} />
                        <span style={{ color: '#e74c3c', fontSize: '0.75rem' }}>OFFLINE</span>
                      </>
                    )}
                  </div>
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