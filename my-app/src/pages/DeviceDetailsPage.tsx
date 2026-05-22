// DeviceDetailsPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Sidebar } from '../components/Dashboard/Sidebar';
import { useDeviceTelemetry} from '../hooks/useDeviceTelemetry';

export const DeviceDetailsPage = ({ auth }: { auth: any }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {latestTelemetry, telemetryHistory, loading}= useDeviceTelemetry({deviceId:id, token:auth?.token})

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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Button>REBOOT</Button>
                <Button variant="secondary">DIAGNOSTICS</Button>
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