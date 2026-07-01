// DeviceDetailsPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Sidebar } from '../components/Dashboard/Sidebar';
import { useDeviceTelemetry} from '../hooks/useDeviceTelemetry';
import { useAuth } from '../hooks/useAuth';
import { useDevice } from '../hooks/useDevice';

export const DeviceDetailsPage = ({ auth }: { auth: any }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {latestTelemetry, telemetryHistory, loading}= useDeviceTelemetry({deviceId:id, token:auth?.token})
  const { handleReassignDevice, fetchDevices } = useDevice(auth?.token);
  const { users, fetchUsers } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const isAdmin = auth?.profile?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

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