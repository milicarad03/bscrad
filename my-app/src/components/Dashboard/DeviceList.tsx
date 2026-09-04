import { Card } from '../../components/UI/Card';
import type { DeviceDTO, ModelVersionDTO } from '../../models/device.dto';
import { RotateCw, Search, Plus, Upload } from 'lucide-react';
import { Button } from '../UI/Button';
import { useState, useEffect } from 'react';
import { DeviceTable } from './DeviceTable'; 
import { FilterDropdown } from '../UI/FilterDropdown'; 
import { useDevicesStatuses } from '../../hooks/useDeviceStatus';
import '../../styles/layouts/deviceList.css'; 
import { DeviceBulkImportDialog } from './DeviceBulkImportDialog';
import type {
  BulkDeviceImportManifestDTO,
  BulkDeviceImportResultDTO,
} from '../../models/device-bulk-import.dto';

interface DeviceListProps {
  device: DeviceDTO[];
  users: any[];
  onDelete: (id: string) => void;
  onDevice: (e: React.SyntheticEvent) => void;
  onDeviceClick: (dev: DeviceDTO) => void;
  isAdmin: boolean;
  onRegister?: () => void;
  onBulkImport?: (
    manifest: BulkDeviceImportManifestDTO,
  ) => Promise<BulkDeviceImportResultDTO>;
  onFilterChange: (userIds?: number[], typeNames?: string[]) => void;
  targetUserIds: number[];
  selectedTypes: string[];
  currentUserId: string | number | undefined;
  modelVersions: ModelVersionDTO[];
  onApplyModelVersion: (
    deviceId: string,
    modelVersionId: string,
  ) => Promise<unknown>;
  onTransferOwnership: (
    deviceId: string,
    userId: string,
  ) => Promise<void>;
}

export const DeviceList = ({
  device = [],
  users = [],
  onDelete,
  onDevice,
  onDeviceClick,
  isAdmin,
  onRegister,
  onBulkImport,
  onFilterChange,
  targetUserIds = [],
  selectedTypes = [],
  modelVersions = [],
  onApplyModelVersion,
  onTransferOwnership,
}: DeviceListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState<'user' | 'type' | null>(null);
  const [allPossibleTypes, setAllPossibleTypes] = useState<string[]>([]);
  const [localDevices, setLocalDevices] = useState<DeviceDTO[]>(device);
  const [showBulkImport, setShowBulkImport] = useState(false);

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

  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).triggerStatusUpdate = (
        deviceId: string,
        status: DeviceDTO['status']
      ) => {
        setLocalDevices((prevDevices) =>
          prevDevices.map((dev) =>
            dev.serialNumber === deviceId ? { ...dev, status } : dev
          )
        );
      };
    }
    return () => {
      if (import.meta.env.DEV) {
        delete (window as any).triggerStatusUpdate;
      }
    };
  }, []);

  const filteredDevices = localDevices.filter(dev => {
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      (dev.name || '').toLowerCase().includes(term) ||
      (dev.type || '').toLowerCase().includes(term) ||
      (dev.serialNumber || '').toLowerCase().includes(term) ||
      (dev.user?.email || '').toLowerCase().includes(term);

    const matchesType =
      selectedTypes.length === 0 ||
      selectedTypes.includes(dev.type || '');

    return matchesSearch && matchesType;
  });
  
  useEffect(() => {
    if (localDevices.length > 0) {
      const currentTypes = localDevices.map(d => d.type).filter(Boolean) as string[];
      setAllPossibleTypes(prev => Array.from(new Set([...prev, ...currentTypes])));
    }
  }, [localDevices]);

  return (
    <Card title={isAdmin ? "System Device Feed" : "Assigned Devices"}>
      <div className="device-list-wrapper">
        
        <div className="device-list-header">
          <div className="device-controls-bar">
            <div className="search-field-group">
              <label className="search-field-label">Search Devices</label>
              <div className="search-input-wrapper">
                <Search size={15} className="search-icon" />
                <input 
                  data-cy="device-search"
                  type="text" 
                  placeholder="Filter by name, type, SN..." 
                  className="search-input-cyber"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {isAdmin && (
              <FilterDropdown 
                data-cy="filter-user"
                label="Users Filter"
                placeholder="Select Users"
                selectedCount={targetUserIds.length}
                isOpen={openDropdown === 'user'}
                onToggle={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
              >
                {users.map(u => (
                  <label key={u.id} className="filter-dropdown-label">
                    <input 
                      type="checkbox"
                      checked={targetUserIds.includes(u.id)}
                      onChange={(e) => {
                        const newIds = e.target.checked ? [...targetUserIds, u.id] : targetUserIds.filter(id => id !== u.id);
                        onFilterChange(newIds, selectedTypes);
                      }}
                    />
                    <span>{u.email}</span>
                  </label>
                ))}
              </FilterDropdown>
            )}

            <FilterDropdown 
              data-cy="filter-type"
              label="Type Filter"
              placeholder="Select Type"
              selectedCount={selectedTypes.length}
              isOpen={openDropdown === 'type'}
              onToggle={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
            >
              {allPossibleTypes.map(typeName => (
                <label key={typeName} data-cy={`filter-option-${typeName}`} className="filter-dropdown-label">
                  <input 
                    type="checkbox"
                    checked={selectedTypes.includes(typeName)}
                    onChange={(e) => {
                      const newTypes = e.target.checked ? [...selectedTypes, typeName] : selectedTypes.filter(t => t !== typeName);
                      onFilterChange(targetUserIds, newTypes);
                    }}
                  />
                  <span>{typeName}</span>
                </label>
              ))}
            </FilterDropdown>
          </div>

          <div className="device-action-buttons">
            {isAdmin && onBulkImport && (
              <Button
                className="btn-import-devices"
                onClick={() => setShowBulkImport(true)}
                data-cy="bulk-import-btn"
              >
                <Upload size={15} />
                <span>Import Devices</span>
              </Button>
            )}
            {isAdmin && (
              <Button className="btn-register-cyber" onClick={onRegister} data-cy="add-device-btn">
                <Plus size={15} />
                <span>Register Device</span>
              </Button>
            )}
            <Button onClick={onDevice} className="btn-refresh" data-cy="refresh-devices-btn" title="Sync Database">
              <RotateCw size={16} />
            </Button>
          </div>
        </div>

        <DeviceTable
          devices={filteredDevices}
          isAdmin={isAdmin}
          onDelete={onDelete}
          onDeviceClick={onDeviceClick}
          modelVersions={modelVersions}
          onApplyModelVersion={onApplyModelVersion}
          users={users}
          onTransferOwnership={onTransferOwnership}
        />

        {showBulkImport && onBulkImport && (
          <DeviceBulkImportDialog
            onClose={() => setShowBulkImport(false)}
            onImport={onBulkImport}
          />
        )}
      </div>
    </Card>
  );
};
