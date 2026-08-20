import { useState } from 'react';
import { Trash2, Circle, Radio, RefreshCw, UserCheck } from 'lucide-react';
import type { DeviceDTO, ModelVersionDTO } from '../../models/device.dto';
import '../../styles/layouts/DeviceTable.css'

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
        a.version.localeCompare(b.version, undefined, {
          numeric: true,
        }),
      );
  };

  const applyVersion = async (dev: DeviceDTO, versionId: string) => {
    if (!versionId) {
      return;
    }

    setUpdatingDeviceId(dev.id);

    try {
      await onApplyModelVersion(dev.id, versionId);

      setSelectedVersionByDevice((prev) => ({
        ...prev,
        [dev.id]: '',
      }));
    } finally {
      setUpdatingDeviceId(null);
    }
  };

  return (
    <div className="device-table-container">
      <table className="techno-table" data-cy="device-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Serial Number</th>
            <th>Owner</th>
            <th>Model Version</th>
            <th>Status</th>
            {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {sortedDevices.length === 0 ? (
            <tr>
              <td colSpan={isAdmin ? 7 : 6} className="empty-table-cell">
                NO_DEVICES_MATCH_SEARCH_CRITERIA
              </td>
            </tr>
          ) : (
            sortedDevices.map((dev) => {
              const candidates = getCandidates(dev);
              const selectedVersion = selectedVersionByDevice[dev.id] || '';
              const isUpdating = updatingDeviceId === dev.id;

              return (
                <tr
                  key={dev.id}
                  onClick={() => onDeviceClick(dev)}
                  className="table-row-hover"
                >
                  <td className="cell-device-name">{dev.name}</td>

                  <td>
                    <span className="badge-type">{dev.type}</span>
                  </td>

                  <td className="cell-serial">{dev.serialNumber}</td>

                  <td>
                    <span className="badge-owner">
                      {dev.user ? `USER_${dev.user.email}` : 'UNASSIGNED'}
                    </span>
                  </td>

                  <td>
                    <div className="model-info">
                      <div className="model-name">{getModelName(dev) || 'NO_MODEL'}</div>
                      <div className="model-version">{dev.modelVersion?.version || 'NO_VERSION'}</div>
                    </div>
                  </td>

                  <td>
                    <div data-cy={`device-status-${dev.id}`} className="status-badge">
                      {dev.status === 'UNINITIALIZED' ? (
                        <>
                          <Radio size={14} className="status-icon uninit" />
                          <span className="status-text uninit">UNINITIALIZED</span>
                        </>
                      ) : dev.status === 'ONLINE' ? (
                        <>
                          <Circle size={10} fill="#2ecc71" className="status-icon online" />
                          <span className="status-text online">ONLINE</span>
                        </>
                      ) : (
                        <>
                          <Circle size={10} fill="#e74c3c" className="status-icon offline" />
                          <span className="status-text offline">OFFLINE</span>
                        </>
                      )}
                    </div>
                  </td>

                  {isAdmin && (
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <div className="actions-wrapper">
                        {/* Transfer Ownership Control */}
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
                          >
                            <option value="">SELECT_OWNER</option>
                            {users.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.email}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="btn btn-action"
                            disabled={!selectedOwnerByDevice[dev.id]}
                            onClick={async () => {
                              const userId = selectedOwnerByDevice[dev.id];
                              if (!userId) return;

                              if (!window.confirm(`TRANSFER DEVICE ${dev.serialNumber}?`)) {
                                return;
                              }

                              await onTransferOwnership(dev.serialNumber, userId);

                              setSelectedOwnerByDevice((prev) => ({
                                ...prev,
                                [dev.id]: '',
                              }));
                            }}
                          >
                            <UserCheck size={14} />
                            TRANSFER
                          </button>
                        </div>

                        {/* Model Version Control */}
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
                            >
                              <option value="">SELECT_VERSION</option>
                              {candidates.map((modelVersion) => (
                                <option key={modelVersion.id} value={modelVersion.id}>
                                  {modelVersion.version}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              className="btn btn-action"
                              disabled={dev.status !== 'ONLINE' || !selectedVersion || isUpdating}
                              title={
                                dev.status !== 'ONLINE'
                                  ? 'Device must be ONLINE to update model version'
                                  : 'Apply selected model version'
                              }
                              onClick={() => applyVersion(dev, selectedVersion)}
                            >
                              <RefreshCw size={14} className={isUpdating ? 'spin' : ''} />
                              {isUpdating ? 'UPDATING...' : 'APPLY'}
                            </button>
                          </div>
                        )}

                        {/* Delete Action */}
                        <button
                          type="button"
                          className="btn-icon-danger"
                          title="Delete Device"
                          onClick={() => {
                            if (window.confirm(`DELETE DEVICE: ${dev.serialNumber}?`)) {
                              onDelete(dev.id);
                            }
                          }}
                        >
                          <Trash2 size={16} />
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
  );
};