// DeviceDetailsPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Sidebar } from '../components/Dashboard/Sidebar';
import { useDeviceTelemetry } from '../hooks/useDeviceTelemetry';
import { useAuth } from '../hooks/useAuth';
import { useDevice } from '../hooks/useDevice';
import { toast } from 'react-hot-toast';
import { useDevicesStatuses } from '../hooks/useDeviceStatus';
import '../styles/layouts/deviceDetailsPage.css';
import type { CommandMetadata } from '../models/device.dto';
import { CommandConsole } from '../components/DeviceCommands/CommandConsole';
import { buildPayloadFromCommandFields } from '../utils/commandFields';


export const DeviceDetailsPage = ({ auth }: { auth: any }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { latestTelemetry, telemetryHistory, loading } = useDeviceTelemetry({
    deviceId: id,
    token: auth?.token,
  });
  const { users, fetchUsers } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [streamStatus, setStreamStatus] = useState<'ACTIVE' | 'IDLE'>('IDLE');
  const [localLedColor, setLocalLedColor] = useState<string | null>(null);
  const [localLedState, setLocalLedState] = useState<boolean | null>(null);
  const [persistedLedColor, setPersistedLedColor] = useState<string>('');
  const [persistedLedState, setPersistedLedState] = useState<boolean>(false);
  //const [currentProfile, setCurrentProfile] = useState('NORMAL');
  const [commandMetadata, setCommandMetadata] = useState<CommandMetadata[]>([]);
  const [selectedCommand, setSelectedCommand] = useState('');
  const [commandPayload, setCommandPayload] = useState<Record<string, any>>({});

  const {
    handleReassignDevice,
    fetchDevices,
    sendDeviceCommand,
    devices,
    updateDeviceStatus,
    loading: devicesLoading,
    getCommandMetadata
  } = useDevice(auth?.token);

  const currentDevice = devices.find(
    (d) => String(d.id) === String(id) || String(d.serialNumber) === String(id)
  );

  const commands = currentDevice?.modelVersion?.schema?.commands || {};

  const supportsLed = commandMetadata.some(c => c.command === 'SET_LED');

  const supportsLedColor = commandMetadata.some( c => c.command === 'SET_LED_COLOR');

  const supportsOperatingProfile = commandMetadata.some(c => c.command === 'SET_OPERATING_PROFILE');
  const ledColors =commandMetadata.find(c => c.command === 'SET_LED_COLOR')?.fields.find(f => f.name === 'color')?.enum ?? [];
 


  const displayLedColor = localLedColor || persistedLedColor;
  const displayLedState = localLedState !== null ? localLedState : persistedLedState;
  const currentProfile = latestTelemetry?.data?.system?.status?.operatingProfile ?? 'NORMAL';
  const isDeviceConnected = currentDevice?.status === 'ONLINE';
  const isAdmin = auth?.profile?.role === 'ADMIN';
  const activeCommand =
  commandMetadata.find( c => c.command === selectedCommand);



 const updateCommandField = (path: string, value: any) => {
  setCommandPayload(prev => ({
    ...prev,
    [path]: value
  }));
};
const executeGenericCommand = async () => {
  if (!selectedCommand || !activeCommand) return;
  try {
    const allowedPaths = new Set(activeCommand.fields.map(f => f.path));
    const payload = buildPayloadFromCommandFields(commandPayload, allowedPaths);

    await sendDeviceCommand(id!, selectedCommand, payload);
    setCommandPayload({});
    toast.success(`${selectedCommand} sent`);
  } catch {
    toast.error('Command failed');
  }
};
  const handleLedStateChange = async (value: boolean) => {
    setLocalLedState(value);
    try {
      await sendDeviceCommand(id!, 'SET_LED', { value });
      toast.success(`LED turned ${value ? 'ON' : 'OFF'}`);
    } catch {
      setLocalLedState(null);
      toast.error('Failed to change LED state');
    }
  };
  const sendOperatingProfile = async () => {
    try {
      await sendDeviceCommand(id!, 'SET_OPERATING_PROFILE', {
        mode: 'BOOST',
        pressure: {
          target: 12,
        },
        safety: {
          maxTemperature: 95,
          maxVibration: 5,
        },
        schedule: {
          durationMinutes: 1,
        },
      });

      toast.success('Operating profile applied');
    } catch {
      toast.error('Failed to apply operating profile');
    }
  };

  const handleLedColorChange = async (color: string) => {
    setLocalLedColor(color);
    try {
      await sendDeviceCommand(id!, 'SET_LED_COLOR', { color });
      toast.success(`LED color set to ${color}`);
    } catch {
      setLocalLedColor(null);
      toast.error('Failed to change LED color');
    }
  };

  const handleStatusUpdate = useCallback(
    (deviceId: string, newStatus: 'ONLINE' | 'OFFLINE' | 'UNINITIALIZED') => {
      updateDeviceStatus(deviceId, newStatus);
      if (newStatus === 'OFFLINE') {
        setStreamStatus('IDLE');
      }
    },
    [updateDeviceStatus]
  );
  useDevicesStatuses({ onStatusUpdate: handleStatusUpdate });

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);
  useEffect(() => {
  if (latestTelemetry?.data?.ledColor !== undefined) {
    setPersistedLedColor(latestTelemetry.data.ledColor);
  }

  if (latestTelemetry?.data?.led !== undefined) {
    setPersistedLedState(latestTelemetry.data.led);
  }
}, [latestTelemetry]);


  useEffect(() => {
    if (!isDeviceConnected || !latestTelemetry) {
      setStreamStatus('IDLE');
      return;
    }
  
    const age = (Date.now() - new Date(latestTelemetry.timestamp).getTime()) / 1000;
      setStreamStatus(age < 10 ? 'ACTIVE' : 'IDLE');
    }, [latestTelemetry, isDeviceConnected]);

  useEffect(() => {
    if (auth?.token) {
      fetchDevices();
    }
  }, [auth?.token]);

  useEffect(() => {

    if (!id) return;

    getCommandMetadata(id)
      .then(setCommandMetadata)
      .catch(console.error);

  }, [id,  getCommandMetadata]);

  useEffect(() => {
    console.count('DEVICE_DETAILS_MOUNT');

    return () => {
      console.count('DEVICE_DETAILS_UNMOUNT');
    };
  }, []);



  useEffect(() => {
    if (!id || !isDeviceConnected) return;

    sendDeviceCommand(id, 'SET_STATE', { state: 'ACTIVE' }).catch((err) => {
      if (err.message === 'DEVICE_OFFLINE') return;
    });

    return () => {
      if (isDeviceConnected) {
        sendDeviceCommand(id, 'SET_STATE', { state: 'IDLE' }).catch(() => {});
      }
    };
  }, [id, isDeviceConnected]);
  

  const onTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedUserId) return;

    if (window.confirm(`TRANSFER OWNERSHIP OF NODE ${id}?`)) {
      try {
        await handleReassignDevice(id, Number(selectedUserId));
        setSelectedUserId('');
      } catch (err) {
      }
    }
  };
  const getTextColor = (color: string) => {
    const lightColors = ['WHITE', 'YELLOW', 'LIME', 'CYAN'];

    return lightColors.includes(color.toUpperCase())
      ? '#0a0d12'
      : '#ffffff';
  };

  const handleCommand = async ( command: string, payload: any, setter: (val: boolean) => void) => {
    setter(true);
    try {
      await sendDeviceCommand(id!, 'SET_STATE', payload);
      setStreamStatus(payload.state);
      toast.success(`Command processed successfully!`);
    } catch (err: any) {
      if (err.message === 'DEVICE_OFFLINE') return;
      toast.error('Failed to execute command.');
    } finally {
      setter(false);
    }
  };

  if (devicesLoading) {
    return <div className="dashboard-layout">Loading system data...</div>;
  }

  if (!currentDevice) {
    return (
      <div className="dashboard-layout">
        <main className="dashboard-content">
          <h1>Device not found</h1>
          <p>The device with ID/SN "{id}" could not be found in the registry.</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar
        profile={auth.profile}
        activeTab="devices"
        setActiveTab={() => navigate('/dashboard')}
        onLogout={auth.handleLogout}
      />

      <main className="dashboard-content">
        <div className="view-section">
          <header className="dd-header">
            <button className="dd-back" onClick={() => navigate('/dashboard?tab=devices')}>
              RETURN_TO_SYSTEM_REGISTRY
            </button>
            <h1 className="dd-title">
              SYSTEM_NODE: <span className="highlight">{id}</span>
            </h1>
          </header>

          <div className="dd-grid">
            <Card title="CORE_DATA">
              <div className="dd-field">
                <span className="dd-field-label">SERIAL</span>
                <span className="dd-field-value">{id}</span>
              </div>
              <div className="dd-stats">
                <div className="dd-stat">
                  <span className="dd-stat-label">SERIAL</span>
                  <span className="dd-stat-value">{id}</span>
                </div>

                <div className="dd-stat">
                  <span className="dd-stat-label">STREAM_STATUS</span>
                  <span className="dd-stat-value">
                    {streamStatus}
                  </span>
                </div>

                <div className="dd-stat">
                  <span className="dd-stat-label">MODEL</span>
                  <span className="dd-stat-value">
                    {currentDevice.modelVersion?.modelId ?? 'N/A'}
                  </span>
                </div>

              </div>
              <div className="dd-field">
                <span className="dd-field-label">STATUS</span>
                <span className="dd-badge">OPERATIONAL</span>
              </div>
              <div className="dd-field">
                <span className="dd-field-label">TYPE</span>
                <span className="dd-field-value">GPIO_CONTROLLER</span>
              </div>
            </Card>

            <Card title="ADMIN_ACTIONS">
              <div className="dd-row">
                <Button className="dd-btn dd-btn--row">REBOOT</Button>
                <Button className="dd-btn dd-btn--row">DIAGNOSTICS</Button>
              </div>

              {isAdmin && (
                <form onSubmit={onTransferSubmit} className="dd-transfer">
                  <label className="dd-transfer-label">TRANSFER_NODE_OWNERSHIP</label>
                  <div className="dd-row">
                    <select
                      data-cy="reassign-select"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="dd-select"
                      required
                    >
                      <option value="">SELECT_TARGET_USER</option>
                      {users
                        .filter((u) => u.status === 'APPROVED')
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email})
                          </option>
                        ))}
                    </select>
                    <Button data-cy="reassign-confirm" type="submit" className="dd-btn">
                      TRANSFER
                    </Button>
                  </div>
                </form>
              )}
            </Card>

            <Card title="CONTROL_PLANE">
              <div className="dd-row">
                <Button
                  className={`dd-btn dd-btn--row dd-btn--start ${
                    streamStatus === 'ACTIVE' ? 'dd-btn--on' : ''
                  }`}
                  onClick={() => handleCommand('SET_STATE', { state: 'ACTIVE' }, setIsStarting)}
                  disabled={isStarting || !isDeviceConnected || streamStatus === 'ACTIVE'}
                >
                  {!isDeviceConnected
                    ? 'OFFLINE_NODE'
                    : isStarting
                    ? 'ACTIVATING...'
                    : streamStatus === 'ACTIVE'
                    ? 'TELEMETRY_ACTIVE'
                    : 'START_TELEMETRY'}
                </Button>

                <Button
                  className={`dd-btn dd-btn--row dd-btn--stop ${
                    streamStatus === 'IDLE' ? 'dd-btn--on' : ''
                  }`}
                  onClick={() => handleCommand('SET_STATE', { state: 'IDLE' }, setIsStopping)}
                  disabled={isStopping || !isDeviceConnected || streamStatus === 'IDLE'}
                >
                  {!isDeviceConnected
                    ? 'OFFLINE_NODE'
                    : isStopping
                    ? 'STOPPING...'
                    : streamStatus === 'IDLE'
                    ? 'TELEMETRY_IDLE'
                    : 'STOP_TELEMETRY'}
                </Button>
              </div>
              {supportsLedColor && (
                <div className="dd-section">
                  <span className="dd-section-title">LED COLOR CONFIG</span>
                  <div className="dd-swatches">
                    {ledColors.map((color: string) => (
                      <Button
                      key={color}
                      className={`dd-btn dd-btn--swatch ${
                        displayLedColor === color ? 'dd-btn--active' : ''
                      }`}
                      onClick={() => handleLedColorChange(color)}
                      disabled={!isDeviceConnected}
                      style={
                        displayLedColor === color ? { background: color.toLowerCase(), color: getTextColor(color)} : undefined
                      }
                    >
                      {color}
                    </Button>
                    ))}
                  </div>
                </div>
              )}


              {supportsLed && (
                <div className="dd-section">
                  <span className="dd-section-title">POWER CONTROL</span>
                  <div className="dd-row">
                    <Button
                      className={`dd-btn dd-btn--led-on flex-1 ${displayLedState === true ? 'dd-btn--active' : ''}`}
                      disabled={!isDeviceConnected}
                      onClick={() => handleLedStateChange(true)}
                    >
                      LED ON
                    </Button>
                    <Button
                      className={`dd-btn dd-btn--led-off flex-1 ${displayLedState === false ? 'dd-btn--active' : ''}`}
                      disabled={!isDeviceConnected}
                      onClick={() => handleLedStateChange(false)}
                    >
                      LED OFF
                    </Button>
                  </div>
                </div>
              )}
              {supportsOperatingProfile && (
              <div className="dd-section">
                <span className="dd-section-title">
                  OPERATING PROFILE
                </span>

                <Button
                  disabled={ !isDeviceConnected || currentProfile === 'BOOST'}
                  onClick={sendOperatingProfile}
                >
                {currentProfile === 'BOOST' ? 'BOOST ACTIVE' : 'APPLY BOOST PROFILE'}
              </Button>
              </div>
            )}
            </Card>

            <Card title="LATEST_TELEMETRY">
              {loading ? (
                <p>Loading telemetry...</p>
              ) : latestTelemetry ? (
                <div>
                  <div className="dd-field">
                    <span className="dd-field-label">TIME</span>
                    <span className="dd-field-value">
                      {new Date(latestTelemetry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="dd-telemetry-grid">
                  {Object.entries(latestTelemetry.data).map(([key, value]) => (
                    <div className="dd-metric" key={key}>
                      <div className="dd-metric-label">
                        {key.toUpperCase()}
                      </div>
                      <div className="dd-metric-value">
                        {String(value)}
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              ) : (
                <p>No telemetry received yet.</p>
              )}
            </Card>
            <Card title="DEVICE_STATE">
              <div className="dd-device-state">

                <div className="dd-state-row">
                  <span>LED STATE</span>

                  <span
                    className={
                      displayLedState
                        ? 'dd-indicator-on'
                        : 'dd-indicator-off'
                    }
                  >
                    {displayLedState ? 'ON' : 'OFF'}
                  </span>
                </div>

                <div className="dd-state-row">
                  <span>LED COLOR</span>

                <div className="dd-led-color-display">
                  <span
                    className="dd-led-dot"
                    style={{
                      background: displayLedColor?.toLowerCase() || '#666'
                    }}
                  />
                  <span>{displayLedColor}</span>
                </div>
                </div>
                <div className="dd-state-row">
                  <span>CURRENT PROFILE</span>

                  <span
                    className={
                      currentProfile === 'BOOST'
                        ? 'dd-indicator-on'
                        : 'dd-indicator-off'
                    }
                  >
                    {currentProfile}
                  </span>
                </div>

              </div>
            </Card>

            <Card title="TELEMETRY_HISTORY">
              {loading ? (
                <p>Loading history...</p>
              ) : telemetryHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {telemetryHistory.map((item, index) => (
                    <div
                      key={item.id ?? `${item.deviceId}-${item.timestamp}-${index}`}
                      className="dd-history-item"
                    >
                      <span className="dd-history-time">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                      <pre className="dd-history-data">{JSON.stringify(item.data, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No telemetry history.</p>
              )}
            </Card>
              <Card title="AVAILABLE_COMMANDS">
                

                {commandMetadata.map(command => (
                  <div
                    key={command.command}
                    className="dd-section"
                  >
                    <strong>
                      {command.command}
                    </strong>

                    {command.fields.map(field => (
                      <div key={field.path}>
                        {field.name}
                        {" | "}
                        {field.type}
                      </div>
                    ))}
                  </div>
                ))}
              
            </Card>
            <CommandConsole
              commandMetadata={commandMetadata}
              selectedCommand={selectedCommand}
              onSelectCommand={(cmd) => {
                setSelectedCommand(cmd);
                setCommandPayload({});
              }}
              commandPayload={commandPayload}
              onFieldChange={(path, value) => updateCommandField(path, value)}
              onExecute={executeGenericCommand}
              disabled={!isDeviceConnected}
            />
            
          </div>
        </div>
      </main>
    </div>
  );
};