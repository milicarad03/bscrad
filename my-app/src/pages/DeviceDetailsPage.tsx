// DeviceDetailsPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Sidebar } from '../components/Dashboard/Sidebar';

export const DeviceDetailsPage = ({ auth }: { auth: any }) => {
  const { id } = useParams();
  const navigate = useNavigate();

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
          </div>
        </div>
      </main>
    </div>
  );
};