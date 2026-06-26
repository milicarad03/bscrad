import { Card } from '../../components/UI/Card';
import type { DeviceDTO } from '../../models/device.dto';
import { RotateCw } from 'lucide-react';
import { Button } from '../UI/Button';
import { useState, useEffect } from 'react';
import { DeviceTable } from './DeviceTable'; 
import { FilterDropdown } from '../UI/FilterDropdown'; 
import { useDevicesStatuses } from '../../hooks/useDeviceStatus';

interface DeviceListProps {
  device: DeviceDTO[];
  users: any[];
  onDelete: (id: string) => void;
  onDevice: (e: React.SyntheticEvent) => void;
  onDeviceClick: (dev: DeviceDTO) => void;
  isAdmin: boolean;
  onRegister?: () => void;
  onFilterChange: (userIds?: number[], typeNames?: string[]) => void;
  targetUserIds: number[];
  selectedTypes: string[];
   currentUserId: string | number | undefined;
}

export const DeviceList = ({
  device = [],
  users = [],
  onDelete,
  onDevice,
  onDeviceClick,
  isAdmin,
  onRegister,
  onFilterChange,
  targetUserIds = [],
  selectedTypes = [],
  currentUserId,
}: DeviceListProps) => {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<'user' | 'type' | null>(null);
  const [allPossibleTypes, setAllPossibleTypes] = useState<string[]>([]);
  const [localDevices, setLocalDevices] = useState<DeviceDTO[]>(device);


  useEffect(() => {
    setLocalDevices(device);
  }, [device]);
  
  useDevicesStatuses({
    onStatusUpdate: (deviceId, newStatus) => {
      setLocalDevices((prevDevices) =>
        prevDevices.map((dev) =>
          dev.serialNumber === deviceId ? { ...dev, status: newStatus } : dev
        )
      );
    }
  });

  // search
  const filteredDevices = localDevices.filter(dev => {
    const term = searchTerm.toLowerCase();
    return (
      dev.name?.toLowerCase().includes(term) ||
      dev.type.toLowerCase().includes(term) ||
      dev.serialNumber.toLowerCase().includes(term) ||
      dev.user?.email?.toLowerCase().includes(term)
    );
  });

  
  useEffect(() => {
    if (localDevices.length > 0) {
      const currentTypes =localDevices.map(d => d.type);
      setAllPossibleTypes(prev => Array.from(new Set([...prev, ...currentTypes])));
    }
  }, [localDevices]);



  return (
    <Card title={isAdmin ? "SYSTEM DEVICE FEED" : "MY_ASSIGNED_DEVICES"}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
      
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isAdmin && <Button className="btn-register-cyber" onClick={onRegister} data-cy="add-device-btn">+ REGISTER_DEVICE</Button>}
          <Button onClick={onDevice} className="btn-refresh" title="SYNC_DATABASE">
            <RotateCw size={18} />
          </Button>
        </div>

    
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          
       
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>SEARCH:</p>
            <input 
              type="text" 
              placeholder="NAME, TYPE, SN..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          
          {isAdmin && (
            <FilterDropdown 
              label="FILTER_BY_USERS"
              placeholder='SELECT_USERS'
              selectedCount={targetUserIds.length}
              isOpen={openDropdown === 'user'}
              onToggle={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
            >
              {users.map(u => (
                <label key={u.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '10px', 
                gap: '10px', 
                width: '100%', 
                cursor: 'pointer',
                borderBottom: '1px solid #222',
                color: '#ccc'
              }}
              className="dropdown-item">
                  <input 
                    type="checkbox"
                    checked={targetUserIds.includes(u.id)}
                    onChange={(e) => {
                      const newIds = e.target.checked ? [...targetUserIds, u.id] : targetUserIds.filter(id => id !== u.id);
                      onFilterChange(newIds, selectedTypes);
                    }}
                  />
                  {u.email}
                </label>
              ))}
            </FilterDropdown>
          )}

          <FilterDropdown 
            data-cy="filter-type"
            label="FILTER_BY_TYPE"
            placeholder='SELECT_TYPE'
            selectedCount={selectedTypes.length}
            isOpen={openDropdown === 'type'}
            onToggle={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
          >
            {allPossibleTypes.map(typeName => (
              <label key={typeName}  data-cy={`filter-option-${typeName}`}
              style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '10px', 
              gap: '10px', 
              width: '100%', 
              cursor: 'pointer',
              borderBottom: '1px solid #222',
              color: '#ccc'
            }}
              className="dropdown-item">
                <input 
                  type="checkbox"
                  checked={selectedTypes.includes(typeName)}
                  onChange={(e) => {
                    const newTypes = e.target.checked ? [...selectedTypes, typeName] : selectedTypes.filter(t => t !== typeName);
                    onFilterChange(targetUserIds, newTypes);
                  }}
                />
                {typeName}
              </label>
            ))}
          </FilterDropdown>
        </div>

        <DeviceTable 
          devices={filteredDevices} 
          isAdmin={isAdmin} 
          onDelete={onDelete} 
          onDeviceClick={onDeviceClick} 
        />
      </div>
    </Card>
  );
};