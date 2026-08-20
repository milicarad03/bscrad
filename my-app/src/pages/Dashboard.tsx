import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Form } from '../components/UI/Form';
import { Button } from '../components/UI/Button';
import {usePosts} from '../hooks/usePosts'
import {useAuth} from '../hooks/useAuth'
import {useDevice} from '../hooks/useDevice'
import {UsersList} from '../components/Dashboard/UserList'
import {PostForm} from '../components/Dashboard/PostForm'
import {DeviceForm} from '../components/Dashboard/DeviceForm'
import {PostList} from '../components/Dashboard/PostList'
import {DraftList} from '../components/Dashboard/DraftList'
import {DeviceList} from '../components/Dashboard/DeviceList'
import { useState,useEffect, useCallback } from 'react';
import { Sidebar } from '../components/Dashboard/Sidebar';
import { DeviceDetailsModal} from '../components/Dashboard/DeviceDetailsModal';
import {useNavigate,useLocation} from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { ModelVersionManager} from '../components/Dashboard/ModelVersionManager';

interface DashboardProps {

  post:ReturnType<typeof usePosts>
  auth:ReturnType<typeof useAuth>
  device:ReturnType<typeof useDevice>
}



export const Dashboard = ({ auth, post, device }: DashboardProps) => {
  
  
  const [selectedDevice, setSelectedDevice] = useState<any>(null); 
  const [showModal, setShowModal] = useState(false); 


  const navigate=useNavigate();
 

  const [searchParams, setSearchParams]=useSearchParams();
  const activeTab=searchParams.get('tab') || 'profile' ;

  const setActiveTab = (tabName: string) => {
    setSearchParams({ tab: tabName });
  };
  //added device.devices.length===0
 /* useEffect(() => {
    if (activeTab === 'devices' && auth.profile && device.devices.length === 0 && !device.hasError) {
      
      device.fetchDevices(); 
    }
  }, [activeTab, auth.profile, device.hasError]);*/

useEffect(() => {
  if (activeTab === 'devices' && auth.profile &&  !device.hasError) {
     device.fetchDevices();
  }
}, [activeTab, auth.profile, device.hasError]);

useEffect(() => {
  if (activeTab === 'users' && auth.profile?.role === 'ADMIN') {
    auth.fetchUsers();
  }
}, [activeTab]);


useEffect(() => {
  if (
    activeTab ===
      'model-versions' &&
    auth.profile?.role ===
      'ADMIN'
  ) {
    device.fetchModels();
  }
}, [
  activeTab,
  auth.profile?.role,
]);
  


  return (
    <div className="dashboard-layout">
      <Sidebar 
        profile={auth.profile} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={auth.handleLogout}
      />

      <main className="dashboard-content">
        {/* DINAMIČKI PRIKAZ SEKCIJA */}
        
        {activeTab === 'profile' &&  auth.profile  &&(
          <div className="view-section">
            <h2>User Profile</h2>
            <Card>
              <p>Email: {auth.profile?.email}</p>
              <p>Role: {auth.profile?.role}</p>
              <p>ID: {auth.profile?.id}</p>
            </Card>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="view-section">
            <h2>Overview</h2>
            <p>Statistics...</p>
          </div>
        )}

      

       {activeTab === 'devices' && (
        <div className="view-section">
          {device.hasError && (
            <div style={{ color: '#ff4d4d', marginBottom: '10px', fontSize: '0.9rem' }}>
              Error loading devices. Check network connection or try again.
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
            //onDevice={device.fetchDevices}
            isAdmin={auth.profile?.role === "ADMIN"}
            onDeviceClick={(dev) => navigate(`/device/${dev.serialNumber}`)}
            currentUserId={auth.profile?.id}
            onRegister={()=> setActiveTab('register-device')}
            onFilterChange={(ids,types) => {
              device.resetError();
              device.fetchDevices({userId: ids, type:types})
              device.setSelectedTargetUsers(ids || []);
              device.setSelectedTypes(types || []);
            }}
            targetUserIds={device.selectedTargetUsers || []}
            selectedTypes={device.selectedTypes || []}
            modelVersions={
              device.models || []
            }

            onApplyModelVersion={
              device.applyModelVersion
            }
           onTransferOwnership={async (deviceId, userId) => {
            await device.handleReassignDevice(
            deviceId,
            Number(userId),
            );
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
                
               
                isAdmin={auth.profile?.role === "ADMIN"}
                users={auth.users} 
                selectedTargetUser={device.selectedTargetUsers[0] || ''}
                setSelectedTargetUser={(id) => device.setSelectedTargetUsers([Number(id)])}

                selectedModelVersion={device.selectedDeviceModel[0] || ''}
                setSelectedModelVersion={(id) => device.setSelectedDeviceModel([id])}
              
                modelVersions={device.models || []}
            />
            
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="view-section">
            <h2>Notifications</h2>
            <p>No notifications at the moment</p>
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
        {activeTab ===
          'model-versions' &&
        auth.profile?.role ===
          'ADMIN' && (
          <div className="view-section">
            <h2>
              Model Version Registry
            </h2>

            <ModelVersionManager
              modelVersions={
                device.models || []
              }

              onUpload={
                device.uploadModelVersion
              }

              onRefresh={() =>
                device.fetchModels()
              }
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