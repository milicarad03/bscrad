import { useState } from 'react';

import {
  Trash2,
  Circle,
  Radio,
  RefreshCw,
} from 'lucide-react';

import type {
  DeviceDTO,
  ModelVersionDTO,
} from '../../models/device.dto';

interface DeviceTableProps {
  devices: DeviceDTO[];

  isAdmin: boolean;

  onDelete: (
    id: string,
  ) => void;

  onDeviceClick: (
    dev: DeviceDTO,
  ) => void;

  modelVersions:
    ModelVersionDTO[];

  onApplyModelVersion: (
    deviceId: string,
    modelVersionId: string,
  ) => Promise<unknown>;
}

export const DeviceTable = ({
  devices,
  isAdmin,
  onDelete,
  onDeviceClick,
  modelVersions,
  onApplyModelVersion,
}: DeviceTableProps) => {
  const [
    selectedVersionByDevice,
    setSelectedVersionByDevice,
  ] = useState<
    Record<string, string>
  >({});

  const [
    updatingDeviceId,
    setUpdatingDeviceId,
  ] = useState<
    string | null
  >(null);

  const statusPriority: Record<
    'ONLINE' |
    'OFFLINE' |
    'UNINITIALIZED',
    number
  > = {
    ONLINE: 1,
    OFFLINE: 2,
    UNINITIALIZED: 3,
  };

  const sortedDevices = [
    ...devices,
  ].sort((a, b) => {
    const priorityA =
      statusPriority[
        a.status
      ] || 99;

    const priorityB =
      statusPriority[
        b.status
      ] || 99;

    return (
      priorityA -
      priorityB
    );
  });

  /*
   * Vraća ime modela
   * trenutne verzije uređaja.
   *
   * npr. modelB
   */
  const getModelName = (
    dev: DeviceDTO,
  ) =>
    dev.modelVersion
      ?.modelId ||
    dev.modelVersion
      ?.model?.name ||
    '';

  /*
   * Administratoru nudimo samo:
   *
   * - verzije istog modela
   * - koje nisu trenutna verzija
   *
   * npr:
   *
   * uređaj = modelB:3.0.0
   *
   * modelB:1.0.0 -> DA
   * modelB:2.0.0 -> DA
   * modelB:3.0.0 -> NE
   * modelA:2.0.0 -> NE
   */
  const getCandidates = (
    dev: DeviceDTO,
  ) => {
    const modelName =
      getModelName(dev);

    return modelVersions
      .filter(
        (modelVersion) =>
          modelVersion.modelId ===
            modelName &&
          modelVersion.id !==
            dev.modelVersion
              ?.id,
      )
      .sort((a, b) =>
        a.version.localeCompare(
          b.version,
          undefined,
          {
            numeric: true,
          },
        ),
      );
  };

  /*
   * Poziva useDevice.applyModelVersion().
   *
   * On zatim šalje:
   *
   * PATCH
   * /device/:id/model-version
   */
  const applyVersion =
    async (
      dev: DeviceDTO,
      versionId: string,
    ) => {
      if (!versionId) {
        return;
      }

      setUpdatingDeviceId(
        dev.id,
      );

      try {
        await onApplyModelVersion(
          dev.id,
          versionId,
        );

        /*
         * Posle uspešnog
         * update-a resetujemo
         * select za taj uređaj.
         */
        setSelectedVersionByDevice(
          (prev) => ({
            ...prev,
            [dev.id]: '',
          }),
        );
      } finally {
        setUpdatingDeviceId(
          null,
        );
      }
    };

  return (
    <div
      style={{
        overflowX: 'auto',
        marginTop: '20px',
      }}
    >
      <table
        className="techno-table"
        data-cy="device-table"
      >
        <thead>
          <tr>
            <th>Name</th>

            <th>Type</th>

            <th>
              Serial Number
            </th>

            <th>Owner</th>

            <th>
              Model version
            </th>

            <th>Status</th>

            {isAdmin && (
              <th
                style={{
                  textAlign:
                    'right',
                }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {sortedDevices.length ===
          0 ? (
            <tr>
              <td
                colSpan={
                  isAdmin
                    ? 7
                    : 6
                }
                style={{
                  textAlign:
                    'center',

                  opacity:
                    0.5,

                  padding:
                    '40px',
                }}
              >
                NO_DEVICES_MATCH_SEARCH_CRITERIA
              </td>
            </tr>
          ) : (
            sortedDevices.map(
              (dev) => {
                /*
                 * Dostupne verzije
                 * za ovaj konkretan
                 * uređaj.
                 */
                const candidates =
                  getCandidates(
                    dev,
                  );

                const selectedVersion =
                  selectedVersionByDevice[
                    dev.id
                  ] || '';

                const isUpdating =
                  updatingDeviceId ===
                  dev.id;

                return (
                  <tr
                    key={
                      dev.id
                    }
                    onClick={() =>
                      onDeviceClick(
                        dev,
                      )
                    }
                    style={{
                      cursor:
                        'pointer',
                    }}
                    className="table-row-hover"
                  >
                    <td
                      style={{
                        color:
                          '#81a4e4',

                        fontWeight:
                          'bold',
                      }}
                    >
                      {
                        dev.name
                      }
                    </td>

                    <td>
                      <span
                        style={{
                          color:
                            '#e0e867',

                          fontSize:
                            '0.8rem',
                        }}
                      >
                        {
                          dev.type
                        }
                      </span>
                    </td>

                    <td
                      style={{
                        opacity:
                          0.8,
                      }}
                    >
                      {
                        dev.serialNumber
                      }
                    </td>

                    <td>
                      <span
                        style={{
                          color:
                            '#aaa',

                          fontSize:
                            '0.8rem',

                          fontFamily:
                            'monospace',
                        }}
                      >
                        {dev.user
                          ? `USER_${dev.user.email}`
                          : 'UNASSIGNED'}
                      </span>
                    </td>

                    {/*
                     * NOVA KOLONA:
                     * trenutni model
                     * i verzija.
                     */}
                    <td>
                      <div
                        style={{
                          fontSize:
                            '0.78rem',
                        }}
                      >
                        <div
                          style={{
                            color:
                              '#81a4e4',

                            fontWeight:
                              'bold',
                          }}
                        >
                          {getModelName(
                            dev,
                          ) ||
                            'NO_MODEL'}
                        </div>

                        <div
                          style={{
                            opacity:
                              0.65,
                          }}
                        >
                          {dev
                            .modelVersion
                            ?.version ||
                            'NO_VERSION'}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div
                        data-cy={`device-status-${dev.id}`}
                        style={{
                          display:
                            'flex',

                          alignItems:
                            'center',

                          gap:
                            '6px',
                        }}
                      >
                        {dev.status ===
                        'UNINITIALIZED' ? (
                          <>
                            <Radio
                              size={
                                14
                              }
                              style={{
                                color:
                                  '#7f8c8d',
                              }}
                            />

                            <span
                              style={{
                                color:
                                  '#7f8c8d',

                                fontSize:
                                  '0.75rem',
                              }}
                            >
                              UNINITIALIZED
                            </span>
                          </>
                        ) : dev.status ===
                          'ONLINE' ? (
                          <>
                            <Circle
                              size={
                                12
                              }
                              fill="#2ecc71"
                              style={{
                                color:
                                  '#2ecc71',
                              }}
                            />

                            <span
                              style={{
                                color:
                                  '#2ecc71',

                                fontSize:
                                  '0.75rem',
                              }}
                            >
                              ONLINE
                            </span>
                          </>
                        ) : (
                          <>
                            <Circle
                              size={
                                12
                              }
                              fill="#e74c3c"
                              style={{
                                color:
                                  '#e74c3c',
                              }}
                            />

                            <span
                              style={{
                                color:
                                  '#e74c3c',

                                fontSize:
                                  '0.75rem',
                              }}
                            >
                              OFFLINE
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {isAdmin && (
                      <td
                        style={{
                          textAlign:
                            'right',
                        }}

                        /*
                         * Važno:
                         * klik na select
                         * ili dugme ne sme
                         * otvoriti Device
                         * Details stranicu.
                         */
                        onClick={(
                          e,
                        ) =>
                          e.stopPropagation()
                        }
                      >
                        <div
                          style={{
                            display:
                              'flex',

                            justifyContent:
                              'flex-end',

                            alignItems:
                              'center',

                            gap:
                              '8px',

                            flexWrap:
                              'wrap',
                          }}
                        >
                          {candidates.length >
                            0 && (
                            <>
                              <select
                                value={
                                  selectedVersion
                                }
                                onChange={(
                                  e,
                                ) =>
                                  setSelectedVersionByDevice(
                                    (
                                      prev,
                                    ) => ({
                                      ...prev,

                                      [dev.id]:
                                        e
                                          .target
                                          .value,
                                    }),
                                  )
                                }
                                style={{
                                  padding:
                                    '6px',

                                  minWidth:
                                    '120px',
                                }}
                              >
                                <option value="">
                                  SELECT_VERSION
                                </option>

                                {candidates.map(
                                  (
                                    modelVersion,
                                  ) => (
                                    <option
                                      key={
                                        modelVersion.id
                                      }
                                      value={
                                        modelVersion.id
                                      }
                                    >
                                      {
                                        modelVersion.version
                                      }
                                    </option>
                                  ),
                                )}
                              </select>

                              <button
                                type="button"
                                disabled={
                                  dev.status !==
                                    'ONLINE' ||
                                  !selectedVersion ||
                                  isUpdating
                                }
                                title={
                                  dev.status !==
                                  'ONLINE'
                                    ? 'Device must be ONLINE to update model version'
                                    : 'Apply selected model version'
                                }
                                onClick={() =>
                                  applyVersion(
                                    dev,
                                    selectedVersion,
                                  )
                                }
                                style={{
                                  display:
                                    'inline-flex',

                                  alignItems:
                                    'center',

                                  gap:
                                    '5px',

                                  padding:
                                    '6px 8px',

                                  cursor:
                                    dev.status ===
                                    'ONLINE'
                                      ? 'pointer'
                                      : 'not-allowed',

                                  opacity:
                                    dev.status ===
                                    'ONLINE'
                                      ? 1
                                      : 0.45,
                                }}
                              >
                                <RefreshCw
                                  size={
                                    14
                                  }
                                />

                                {isUpdating
                                  ? 'UPDATING...'
                                  : 'APPLY_VERSION'}
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `DELETE DEVICE: ${dev.serialNumber}?`,
                                )
                              ) {
                                onDelete(
                                  dev.id,
                                );
                              }
                            }}
                            style={{
                              background:
                                'none',

                              border:
                                'none',

                              color:
                                '#ff4d4d',

                              cursor:
                                'pointer',

                              padding:
                                '5px',
                            }}
                          >
                            <Trash2
                              size={
                                16
                              }
                            />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              },
            )
          )}
        </tbody>
      </table>
    </div>
  );
};