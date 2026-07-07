// DeviceDetailsPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Sidebar } from '../components/Dashboard/Sidebar';
import { useDeviceTelemetry} from '../hooks/useDeviceTelemetry';
import { useAuth } from '../hooks/useAuth';
import { useDevice } from '../hooks/useDevice';
import { toast } from 'react-hot-toast';
import { useDevicesStatuses } from '../hooks/useDeviceStatus';
import { useCallback } from 'react';


export const DeviceDetailsPage = ({ auth }: { auth: any }) => {
  const { id } = useParams();
  
  const navigate = useNavigate();
  const {latestTelemetry, telemetryHistory, loading}= useDeviceTelemetry({deviceId:id, token:auth?.token})
//  const { handleReassignDevice, fetchDevices } = useDevice(auth?.token);
  const { users, fetchUsers } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
 // const { sendDeviceCommand } = useDevice(auth?.token);
  //const [isPending, setIsPending] = useState(false);
  const [isCommandLoading, setIsCommandLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
 const [streamStatus, setStreamStatus] = useState<'ACTIVE' | 'IDLE'>('IDLE');
 


// const { devices, updateDeviceStatus,loading: devicesLoading} = useDevice(auth?.token);
const {
  handleReassignDevice,
  fetchDevices,
  sendDeviceCommand,
  devices,
  updateDeviceStatus,
  loading: devicesLoading
} = useDevice(auth?.token);
 const currentDevice = devices.find(d => 
    String(d.id) === String(id) || String(d.serialNumber) === String(id)
  );
  const isDeviceConnected = currentDevice?.status === 'ONLINE';

  const isAdmin = auth?.profile?.role === 'ADMIN';

  const handleStatusUpdate = useCallback(
    (deviceId: string, newStatus: 'ONLINE' | 'OFFLINE' | 'UNINITIALIZED') => {
      console.log("WebSocket primio update za:", deviceId, newStatus);

      updateDeviceStatus(deviceId, newStatus);

      if (newStatus === 'OFFLINE') {
            setStreamStatus('IDLE');
          }

      toast.success(`Node ${deviceId} is now ${newStatus}`);
    },
    [updateDeviceStatus]
  );
  useDevicesStatuses({
    onStatusUpdate: handleStatusUpdate,
  });
 

useEffect(() => {
  console.log("DEVICE DETAILS MOUNT");

  return () => {
    console.log("DEVICE DETAILS UNMOUNT");
  };
}, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  useEffect(() => {
      console.log("Svi uređaji u state-u:", devices);
      const foundDevice = devices.find(d =>
      String(d.id) === String(id) ||
      String(d.serialNumber) === String(id)
  );
    console.log("Uređaj pronađen u listi:", foundDevice);
  }, [devices, id]);
  
  useEffect(() => {
    if (!isDeviceConnected) {
      setStreamStatus('IDLE');
      return;
    }

    if (!latestTelemetry) {
      setStreamStatus('IDLE');
      return;
    }

    const age =
      (Date.now() -
        new Date(latestTelemetry.timestamp).getTime()) / 1000;

    setStreamStatus(age < 10 ? 'ACTIVE' : 'IDLE');
  }, [latestTelemetry, isDeviceConnected]);



  useEffect(() => {
    if (auth?.token) {
      fetchDevices();
    }
  }, [auth?.token]);

 /* useEffect(() => {
    if (!id || !isDeviceConnected) return;

    
    console.log("[TELEMETRY] Inicijalizacija automatskog pokretanja za:", id);
    sendDeviceCommand(id, 'SET_STATE', { state: 'ACTIVE' })
      .then(() => {
        setStreamStatus('ACTIVE');
        toast.success("Telemetry stream started.");
      })
      .catch((err) => console.error("Auto-start error:", err));

    
    return () => {
      console.log("[TELEMETRY] Zaustavljanje telemetrije pri izlasku:", id);
      sendDeviceCommand(id, 'SET_STATE', { state: 'IDLE' })
        .catch((err) => console.error("Cleanup stop error:", err));
    };
  }, [id, isDeviceConnected]); */
  useEffect(() => {
    if (!id) return;

    if (!isDeviceConnected) {
      //toast("Device is offline");
      return;
    }

    sendDeviceCommand(id, 'SET_STATE', {
      state: 'ACTIVE'
    })
    .catch(err => {
     // toast.error(err.message);

      if (err.message === 'DEVICE_OFFLINE') {
          return;
        }

    });

    return () => {
      if (isDeviceConnected) {
        sendDeviceCommand(id, 'SET_STATE', {
          state: 'IDLE'
        }).catch(() => {});
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


  const handleCommand = async (command: string, payload: any, setter: (val: boolean) => void) => {

  console.log(
    "[FRONTEND COMMAND]",
    command,
    payload
  );

 console.log(
    'BUTTON CLICK',
    payload.state,
    new Date().toISOString()
  );
  console.trace(
  "[BUTTON TRACE]",
  payload.state
);
  console.log("PRE SET TRUE", payload.state);

setter(true);

console.log("AFTER SET TRUE", payload.state);
  try {
    //if (payload.state === 'IDLE') setForcedStatus(false);
    //if (payload.state === 'ACTIVE') setForcedStatus(true);
    await sendDeviceCommand(id!, 'SET_STATE', payload);
    setStreamStatus(payload.state);
    toast.success(`Command processed successfully!`);
  } catch (err: any) {
    
    if (err.message === 'DEVICE_OFFLINE') {
      return;
    }

    toast.error("Failed to execute command.");

  } finally {
      console.log("FINALLY", payload.state);
    setter(false); 
    //setTimeout(() => setForcedStatus(null), 5000);
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
          <header className="device-header">
            <button className="btn-back-link" onClick={() => navigate('/dashboard?tab=devices')}>
               RETURN_TO_SYSTEM_REGISTRY
            </button>
            <h1 style={{marginTop: '20px'}}>SYSTEM_NODE: <span className="highlight">{id}</span></h1>
          </header>


          <div className="device-content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <Card title="CORE_DATA">
              <p><strong>SERIAL:</strong> {id}</p>
              <p>
                <strong>STREAM_STATUS:</strong>{' '}

                  <span
                      style={{
                        color: streamStatus === 'ACTIVE'
                          ? '#00ff41'
                          : '#ff4d4d',
                        fontWeight: 'bold',
                      }}
                    >
                      {streamStatus}
                    </span>

                
              </p>
              <p><strong>STATUS:</strong> <span className="status-active">OPERATIONAL</span></p>
              <p><strong>TYPE:</strong> GPIO_CONTROLLER</p>
            </Card>

            <Card title="ADMIN_ACTIONS">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Button style={{ flex: 1 }}>REBOOT</Button>
                  <Button variant="secondary" style={{ flex: 1 }}>DIAGNOSTICS</Button>
                </div>

                {isAdmin && (
                  <form onSubmit={onTransferSubmit} style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '15px', marginTop: '5px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: '#aaa' }}>
                      TRANSFER_NODE_OWNERSHIP
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <select
                        data-cy="reassign-select"
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="techno-input"
                        style={{
                          flex: 1,
                          background: '#0d1117',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.2)',
                          padding: '8px',
                          borderRadius: '4px',
                          fontSize: '0.85rem'
                        }}
                        required
                      >
                        <option value="">SELECT_TARGET_USER</option>
                        {users
                          .filter(u => u.status === 'APPROVED')
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.email})
                            </option>
                          ))}
                      </select>
                      <Button data-cy="reassign-confirm" type="submit" variant="secondary" style={{ padding: '8px 15px', fontSize: '0.85rem' }}>
                        TRANSFER
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </Card>
            <Card title="CONTROL_PLANE">
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                onClick={() =>
                  handleCommand(
                    'SET_STATE',
                    { state: 'ACTIVE' },
                    setIsStarting
                  )
                }
                disabled={isStarting || !isDeviceConnected}
              >
                {!isDeviceConnected
                  ? "OFFLINE_NODE"
                  : (isStarting
                      ? "ACTIVATING..."
                      : "START_TELEMETRY")}
              </Button>

              <Button
                onClick={() =>
                  handleCommand( 'SET_STATE', { state: 'IDLE' }, setIsStopping)}
                disabled={isStopping || !isDeviceConnected}
              >
                {!isDeviceConnected
                  ? "OFFLINE_NODE"
                  : (isStopping
                      ? "STOPPING..."
                      : "STOP_TELEMETRY")}
              </Button>
                        
              </div>
            </Card>
            <Card title="LATEST_TELEMETRY">
              {loading ? ( <p>Loading telemetry...</p>) : latestTelemetry ? (
                <div>
                  <p>
                    <strong>TIME:</strong>{' '}
                    {new Date(latestTelemetry.timestamp).toLocaleString()}
                  </p>

                  {Object.entries(latestTelemetry.data).map(([key, value]) => (
                    <p key={key}>
                      <strong>{key.toUpperCase()}:</strong> {String(value)}
                    </p>
                  ))}
                </div>
              ) : (
                <p>No telemetry received yet.</p>
              )}
            </Card>
            <Card title="TELEMETRY_HISTORY">
              {loading ? ( <p>Loading history...</p> ) : telemetryHistory.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {telemetryHistory.map((item, index) => (
                    <div
                      key={item.id ?? `${item.deviceId}-${item.timestamp}-${index}`}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.15)',
                        paddingBottom: '8px',
                      }}
                    >
                      <p>
                        <strong>{new Date(item.timestamp).toLocaleString()}</strong>
                      </p>

                      <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                        {JSON.stringify(item.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No telemetry history.</p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};