import { Card } from '../components/UI/Card';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../hooks/useAuth';
import { useDevice } from '../hooks/useDevice';
import { UsersList } from '../components/Dashboard/UserList';
import { DeviceForm } from '../components/Dashboard/DeviceForm';
import { DeviceList } from '../components/Dashboard/DeviceList';
import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Dashboard/Sidebar';
import { DeviceDetailsModal } from '../components/Dashboard/DeviceDetailsModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ModelVersionManager } from '../components/Dashboard/ModelVersionManager';

interface DashboardProps {
  post: ReturnType<typeof usePosts>;
  auth: ReturnType<typeof useAuth>;
  device: ReturnType<typeof useDevice>;
}

const TABS = ['profile', 'devices', 'register-device', 'users', 'model-versions'];

export const Dashboard = ({ auth, device }: DashboardProps) => {
  const [selectedDevice] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedTab = searchParams.get('tab') || 'profile';
  const activeTab = TABS.includes(requestedTab) ? requestedTab : 'profile';

  const setActiveTab = (tabName: string) => {
    navigate(`/dashboard?tab=${encodeURIComponent(tabName)}`);
  };

  useEffect(() => {
    if (activeTab === 'devices' && auth.profile && !device.hasError) {
      device.fetchDevices();
    }
  }, [activeTab, auth.profile, device.hasError]);

  useEffect(() => {
    if (activeTab === 'users' && auth.profile?.role === 'ADMIN') {
      auth.fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'model-versions' && auth.profile?.role === 'ADMIN') {
      device.fetchModels();
    }
  }, [activeTab, auth.profile?.role]);

  return (
    <div className="dashboard-layout">
      <Sidebar
        profile={auth.profile}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={auth.handleLogout}
      />

      <main className="dashboard-content">
        {activeTab === 'profile' && auth.profile && (
          <div className="view-section">
            <h2>User Profile</h2>

            <Card>
              <p>Email: {auth.profile?.email}</p>
              <p>Role: {auth.profile?.role}</p>
              <p>ID: {auth.profile?.id}</p>
            </Card>
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="view-section">
            {device.hasError && (
              <div
                data-cy="error-message"
                style={{ color: '#ff4d4d', marginBottom: '10px', fontSize: '0.9rem' }}
              >
                NetworkError: Failed to fetch devices.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2>Device Management</h2>
            </div>

            <DeviceList
              device={Array.isArray(device.devices) ? device.devices : []}
              users={auth.users || []}
              onDelete={device.handleDeleteDevice}
              onDevice={(e) => {
                e.preventDefault();
                device.resetError();
                device.fetchDevices();
              }}
              isAdmin={auth.profile?.role === 'ADMIN'}
              onDeviceClick={(dev) => navigate(`/device/${dev.serialNumber}`)}
              currentUserId={auth.profile?.id}
              onRegister={() => setActiveTab('register-device')}
              onBulkImport={device.bulkImportDevices}
              onFilterChange={(ids, types) => {
                device.resetError();
                device.fetchDevices({ userId: ids, type: types });
                device.setSelectedTargetUsers(ids || []);
                device.setSelectedTypes(types || []);
              }}
              targetUserIds={device.selectedTargetUsers || []}
              selectedTypes={device.selectedTypes || []}
              modelVersions={device.models || []}
              onApplyModelVersion={device.applyModelVersion}
              onTransferOwnership={async (deviceId, userId) => {
                await device.handleReassignDevice(deviceId, Number(userId));
              }}
            />
          </div>
        )}

        {activeTab === 'register-device' && (
          <div className="view-section">
            <button
              className="btn-back-link"
              onClick={() => {
                device.resetForm();
                setActiveTab('devices');
              }}
            >
              RETURN_TO_DATABASE
            </button>

            <DeviceForm
              onSubmit={device.handleCreateDevice}
              onCancel={() => {
                device.resetForm();
                setActiveTab('devices');
              }}
              loading={device.loading}
              message={device.message}
              serialNumber={device.newSerialNumber}
              setSerialNumber={device.setNewSerialNumber}
              name={device.newDeviceName}
              setName={device.setNewDeviceName}
              type={device.newDeviceType}
              setType={device.setNewDeviceType}
              isAdmin={auth.profile?.role === 'ADMIN'}
              users={auth.users}
              selectedTargetUser={device.selectedTargetUsers[0] || ''}
              setSelectedTargetUser={(id) => device.setSelectedTargetUsers([Number(id)])}
              selectedModelVersion={device.selectedDeviceModel[0] || ''}
              setSelectedModelVersion={(id) => device.setSelectedDeviceModel([id])}
              modelVersions={device.models || []}
            />
          </div>
        )}

        {activeTab === 'users' && auth.profile?.role === 'ADMIN' && (
          <div className="view-section">
            <h2>User management</h2>

            <UsersList
              users={auth.users}
              onDelete={auth.handleDeleteUser}
              onApprove={auth.handleApproveUser}
              onUsers={auth.fetchUsers}
            />
          </div>
        )}

        {activeTab === 'model-versions' && auth.profile?.role === 'ADMIN' && (
          <div className="view-section">
            <h2>Model Version Registry</h2>

            <ModelVersionManager
              modelVersions={device.models || []}
              onUpload={device.uploadModelVersion}
              onRefresh={() => device.fetchModels()}
            />
          </div>
        )}
      </main>

      <DeviceDetailsModal
        device={selectedDevice}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
};