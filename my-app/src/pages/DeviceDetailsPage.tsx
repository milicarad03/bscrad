import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Sidebar } from '../components/Dashboard/Sidebar';
import { useDeviceTelemetry } from '../hooks/useDeviceTelemetry';
import { useAuth } from '../hooks/useAuth';
import { useDevice } from '../hooks/useDevice';
import { toast } from 'react-hot-toast';
import '../styles/layouts/deviceDetailsPage.css';
import type { CommandMetadata } from '../models/device.dto';
import { CommandCard } from '../components/DeviceCommands/CommandCard';

export const DeviceDetailsPage = ({ auth }: { auth: any }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { latestTelemetry, telemetryHistory, loading: telemetryLoading } = useDeviceTelemetry({ deviceId: id, token: auth?.token });
  const { users, fetchUsers } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [streamStatus, setStreamStatus] = useState<'ACTIVE' | 'IDLE'>('IDLE');
  const [commandMetadata, setCommandMetadata] = useState<CommandMetadata[]>([]);

  const { handleReassignDevice, fetchDevices, sendDeviceCommand, devices, loading: devicesLoading, getCommandMetadata } = useDevice(auth?.token);

  const currentDevice = devices.find((d) => String(d.id) === String(id) || String(d.serialNumber) === String(id));
  const isDeviceConnected = currentDevice?.status === 'ONLINE';
  const isAdmin = auth?.profile?.role === 'ADMIN';
  
  // Ekstrakcija stanja iz telemetrije
  const displayLedColor = latestTelemetry?.data?.ledColor ?? 'N/A';
  const displayLedState = latestTelemetry?.data?.led ?? false;
  const currentProfile = latestTelemetry?.data?.system?.status?.operatingProfile ?? 'NORMAL';

  const executeCommand = async (command: string, payload: any) => {
    try {
      await sendDeviceCommand(id!, command, payload);
      toast.success(`${command} executed`);
    } catch {
      toast.error('Command failed');
    }
  };

  const handleCommand = async (command: string, payload: any, setter: (val: boolean) => void) => {
    setter(true);
    try {
      await sendDeviceCommand(id!, command, payload);
      setStreamStatus(payload.state);
      toast.success(`System state set to ${payload.state}`);
    } catch (err: any) {
      if (err.message !== 'DEVICE_OFFLINE') toast.error('Failed to execute command.');
    } finally {
      setter(false);
    }
  };

  const onTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedUserId) return;
    if (window.confirm(`TRANSFER OWNERSHIP OF NODE ${id}?`)) {
      await handleReassignDevice(id, Number(selectedUserId));
      setSelectedUserId('');
    }
  };
  useEffect(() => {
  
    if (!id || !isDeviceConnected) return;


    sendDeviceCommand(id, 'SET_STATE', { state: 'ACTIVE' })
      .then(() => {
        setStreamStatus('ACTIVE');
        toast.success('Telemetry stream initiated');
      })
      .catch((err) => {
   
        if (err.message !== 'DEVICE_OFFLINE') {
          toast.error('Failed to auto-start stream');
        }
      });

    
    return () => {
      if (isDeviceConnected) {
        sendDeviceCommand(id, 'SET_STATE', { state: 'IDLE' }).catch(() => {});
      }
    };
  }, [id, isDeviceConnected]);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin]);
  useEffect(() => { if (auth?.token) fetchDevices(); }, [auth?.token]);
  useEffect(() => { if (id) getCommandMetadata(id).then(setCommandMetadata).catch(console.error); }, [id, getCommandMetadata]);

  if (devicesLoading) return <div className="dashboard-layout">Loading system data...</div>;
  if (!currentDevice) return <div className="dashboard-layout">Device not found</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar profile={auth.profile} activeTab="devices" setActiveTab={() => navigate('/dashboard')} onLogout={auth.handleLogout} />

      <main className="dashboard-content">
        <header className="dd-header">
          <button className="dd-back" onClick={() => navigate('/dashboard?tab=devices')}>RETURN_TO_SYSTEM_REGISTRY</button>
          <h1 className="dd-title">SYSTEM_NODE: <span className="highlight">{id}</span></h1>
        </header>

        <div className="dd-grid">
          <Card title="SYSTEM_CONTROLS">
            <div className="dd-row">
              <Button className={`dd-btn dd-btn--row ${streamStatus === 'ACTIVE' ? 'dd-btn--on' : ''}`} onClick={() => handleCommand('SET_STATE', { state: 'ACTIVE' }, setIsStarting)} disabled={isStarting || !isDeviceConnected}>
                {isStarting ? 'ACTIVATING...' : 'START_STREAM'}
              </Button>
              <Button className={`dd-btn dd-btn--row ${streamStatus === 'IDLE' ? 'dd-btn--on' : ''}`} onClick={() => handleCommand('SET_STATE', { state: 'IDLE' }, setIsStopping)} disabled={isStopping || !isDeviceConnected}>
                {isStopping ? 'STOPPING...' : 'STOP_STREAM'}
              </Button>
            </div>
            {isAdmin && (
              <form onSubmit={onTransferSubmit} className="dd-transfer">
                <label className="dd-transfer-label">TRANSFER_OWNERSHIP</label>
                <div className="dd-row">
                  <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="dd-select" required>
                    <option value="">SELECT_USER</option>
                    {users.filter(u => u.status === 'APPROVED').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <Button type="submit" className="dd-btn">TRANSFER</Button>
                </div>
              </form>
            )}
          </Card>

          {/* Vraćena i integrisana Device Status kartica */}
          <Card title="DEVICE_STATUS">
            <div className="dd-state-grid">
              <div className="dd-state-card">
                <span className="dd-state-label">LED STATE</span>
                <span className={displayLedState ? 'dd-indicator-on' : 'dd-indicator-off'}>{displayLedState ? 'ON' : 'OFF'}</span>
              </div>
              <div className="dd-state-card">
                <span className="dd-state-label">LED COLOR</span>
                <div className="dd-led-color-display">
                  <span className="dd-led-dot" style={{ background: displayLedColor?.toLowerCase() === 'n/a' ? '#333' : displayLedColor?.toLowerCase() }} />
                  <span>{displayLedColor}</span>
                </div>
              </div>
              <div className="dd-state-card">
                <span className="dd-state-label">PROFILE</span>
                <span className={currentProfile === 'BOOST' ? 'dd-indicator-on' : 'dd-indicator-off'}>{currentProfile}</span>
              </div>
            </div>
          </Card>
        </div>
        <Card title="DEVICE_COMMANDS">
          <div className="dd-commands-container">
            {commandMetadata.map(command => (
              <div key={command.command} className="dd-command-wrapper">
                <CommandCard 
                  command={command} 
                  disabled={!isDeviceConnected} 
                  latestTelemetry={latestTelemetry?.data} 
                  onExecute={executeCommand} 
                />
              </div>
            ))}
          </div>
        </Card>
        {/* Srednji red: Telemetrija i Komande */}
        <div className="dd-grid" style={{ marginTop: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
          
          <Card title="LATEST_TELEMETRY">
            {/* Ograničavamo visinu i dodajemo scroll */}
            <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '0.85rem' }}>
              {latestTelemetry ? (
                <pre>{JSON.stringify(latestTelemetry.data, null, 2)}</pre>
              ) : (
                <p>No telemetry data available.</p>
              )}
            </div>
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
        </div>

        <div style={{ marginTop: '20px' }}>
          <Card title="TELEMETRY_HISTORY">
            <div className="dd-history-scroll" style={{ maxHeight: '500px' }}>
              {telemetryHistory.map((item, i) => (
                <div key={i} className="dd-history-item">
                  <span className="dd-history-time">{new Date(item.timestamp).toLocaleString()}</span>
                  <pre className="dd-history-data">{JSON.stringify(item.data, null, 2)}</pre>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};