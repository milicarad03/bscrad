import { useState } from 'react';
import { Trash2, Circle, Radio, RefreshCw, UserCheck, AlertCircle } from 'lucide-react';
import type { DeviceDTO, ModelVersionDTO } from '../../models/device.dto';
import '../../styles/layouts/devTabl.css';

interface DeviceTableProps {
  devices: DeviceDTO[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onDeviceClick: (dev: DeviceDTO) => void;
  modelVersions: ModelVersionDTO[];
  onApplyModelVersion: (deviceId: string, modelVersionId: string) => Promise<unknown>;
  onTransferOwnership: (deviceId: string, userId: string) => Promise<void>;
  users: { id: number; email: string }[];
}

export const DeviceTable = ({
  devices,
  isAdmin,
  onDelete,
  onDeviceClick,
  modelVersions,
  onApplyModelVersion,
  onTransferOwnership,
  users,
}: DeviceTableProps) => {
  const [selectedVersionByDevice, setSelectedVersionByDevice] = useState<Record<string, string>>({});
  const [selectedOwnerByDevice, setSelectedOwnerByDevice] = useState<Record<string, string>>({});
  const [updatingDeviceId, setUpdatingDeviceId] = useState<string | null>(null);
  const [transferringDeviceId, setTransferringDeviceId] = useState<string | null>(null);

  const statusPriority: Record<'ONLINE' | 'OFFLINE' | 'UNINITIALIZED', number> = {
    ONLINE: 1,
    OFFLINE: 2,
    UNINITIALIZED: 3,
  };

  const sortedDevices = [...devices].sort((a, b) => {
    const priorityA = statusPriority[a.status] || 99;
    const priorityB = statusPriority[b.status] || 99;
    return priorityA - priorityB;
  });

  const getModelName = (dev: DeviceDTO) =>
    dev.modelVersion?.modelId || dev.modelVersion?.model?.name || '';

  const getCandidates = (dev: DeviceDTO) => {
    const modelName = getModelName(dev);
    return modelVersions
      .filter(
        (modelVersion) =>
          modelVersion.modelId === modelName && modelVersion.id !== dev.modelVersion?.id,
      )
      .sort((a, b) =>
        a.version.localeCompare(b.version, undefined, { numeric: true }),
      );
  };

  const applyVersion = async (dev: DeviceDTO, versionId: string) => {
    if (!versionId) return;
    setUpdatingDeviceId(dev.id);

    try {
      await onApplyModelVersion(dev.id, versionId);
      setSelectedVersionByDevice((prev) => ({ ...prev, [dev.id]: '' }));
    } finally {
      setUpdatingDeviceId(null);
    }
  };

  const handleTransfer = async (dev: DeviceDTO) => {
    const userId = selectedOwnerByDevice[dev.id];
    if (!userId) return;

    if (!window.confirm(`Are you sure you want to transfer device "${dev.serialNumber}" to a new user?`)) {
      return;
    }

    setTransferringDeviceId(dev.id);
    try {
      await onTransferOwnership(dev.serialNumber, userId);
      setSelectedOwnerByDevice((prev) => ({ ...prev, [dev.id]: '' }));
    } finally {
      setTransferringDeviceId(null);
    }
  };

  return (
    <div className="device-table-wrapper">
      <div className="device-table-container">
        <table className="techno-table" data-cy="device-table">
          <thead>
            <tr>
              <th>Device Details</th>
              <th>Type</th>
              <th>Serial Number</th>
              <th>Owner</th>
              <th>Model Version</th>
              <th>Status</th>
              {isAdmin && <th className="text-right">Actions</th>}
            </tr>
          </thead>

          <tbody>
            {sortedDevices.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="empty-table-cell">
                  <div className="empty-state-content">
                    <AlertCircle size={24} />
                    <span>No devices match your search criteria</span>
                  </div>
                </td>
              </tr>
            ) : (
              sortedDevices.map((dev) => {
                const status = dev.status ?? 'OFFLINE';
                const candidates = getCandidates(dev);
                const selectedVersion = selectedVersionByDevice[dev.id] || '';
                const isUpdating = updatingDeviceId === dev.id;
                const isTransferring = transferringDeviceId === dev.id;

                return (
                  <tr
                    key={dev.id}
                    onClick={() => onDeviceClick(dev)}
                    className="table-row-hover"
                  >
                    <td>
                      <span className="cell-device-name">{dev.name}</span>
                    </td>

                    <td>
                      <span className="badge-type">{dev.type}</span>
                    </td>

                    <td>
                      <span className="cell-serial">{dev.serialNumber}</span>
                    </td>

                    <td>
                      <div className="owner-cell">
                        <span className={`badge-owner ${dev.user ? 'assigned' : 'unassigned'}`}>
                          {dev.user ? dev.user.email : 'Unassigned'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="model-info">
                        <span className="model-name">{getModelName(dev) || 'No Model'}</span>
                        <span className="model-version">{dev.modelVersion?.version || 'v—'}</span>
                      </div>
                    </td>

                    <td>
                      <div data-cy={`device-status-${dev.id}`}className={`status-pill ${status.toLowerCase()}`}>
                        {status === 'UNINITIALIZED' ? (
                          <>
                            <Radio size={12} className="status-icon" />
                            <span>Uninitialized</span>
                          </>
                        ) : status === 'ONLINE' ? (
                          <>
                            <Circle size={6} fill="currentColor" stroke="none" className="status-icon" />
                            <span>Online</span>
                          </>
                        ) : (
                          <>
                            <Circle size={6} fill="currentColor" stroke="none" className="status-icon" />
                            <span>Offline</span>
                          </>
                        )}
                      </div>
                    </td>

                    {isAdmin && (
                      <td className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="actions-wrapper">
                          <div className="action-group">
                            <select
                              className="select-input"
                              value={selectedOwnerByDevice[dev.id] || ''}
                              onChange={(e) =>
                                setSelectedOwnerByDevice((prev) => ({
                                  ...prev,
                                  [dev.id]: e.target.value,
                                }))
                              }
                              data-cy={`transfer-owner-${dev.id}`}
                              aria-label="Select new owner"
                            >
                              <option value="">Select Owner</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.email}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              data-cy={`transfer-btn-${dev.id}`}
                              className="btn-action"
                              disabled={!selectedOwnerByDevice[dev.id] || isTransferring}
                              onClick={() => handleTransfer(dev)}
                            >
                              <UserCheck size={13} className={isTransferring ? 'spin' : ''} />
                              <span>{isTransferring ? 'Transferring...' : 'Transfer'}</span>
                            </button>
                          </div>

                          {candidates.length > 0 && (
                            <div className="action-group">
                              <select
                                className="select-input"
                                value={selectedVersion}
                                onChange={(e) =>
                                  setSelectedVersionByDevice((prev) => ({
                                    ...prev,
                                    [dev.id]: e.target.value,
                                  }))
                                }
                                aria-label="Select model version"
                              >
                                <option value="">Select Version</option>
                                {candidates.map((modelVersion) => (
                                  <option key={modelVersion.id} value={modelVersion.id}>
                                    {modelVersion.version}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                className="btn-action"
                                disabled={status !== 'ONLINE' || !selectedVersion || isUpdating}
                                title={
                                  status !== 'ONLINE'
                                    ? 'Device must be ONLINE to update model version'
                                    : 'Apply selected model version'
                                }
                                onClick={() => applyVersion(dev, selectedVersion)}
                              >
                                <RefreshCw size={13} className={isUpdating ? 'spin' : ''} />
                                <span>{isUpdating ? 'Updating...' : 'Apply'}</span>
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            className="btn-icon-danger"
                            title="Delete Device"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete device: ${dev.serialNumber}?`)) {
                                onDelete(dev.id);
                              }
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
