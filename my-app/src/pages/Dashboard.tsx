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
import { useState,useEffect } from 'react';
import { Sidebar } from '../components/Dashboard/Sidebar';
import { DeviceDetailsModal} from '../components/Dashboard/DeviceDetailsModal';
import {useNavigate,useLocation} from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
interface DashboardProps {
  post:ReturnType<typeof usePosts>
  auth:ReturnType<typeof useAuth>
  device:ReturnType<typeof useDevice>
}



export const Dashboard = ({ auth, post, device }: DashboardProps) => {
  
  
  const [selectedDevice, setSelectedDevice] = useState<any>(null); 
  const [showModal, setShowModal] = useState(false); 

  const openDetails = (dev: any) => {
    setSelectedDevice(dev);
    setShowModal(true);
  };
  const navigate=useNavigate();
  const location=useLocation();
  //const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'profile');
  const [searchParams, setSearchParams]=useSearchParams();
  const activeTab=searchParams.get('tab') || 'profile' ;
  const setActiveTab = (tabName: string) => {
    setSearchParams({ tab: tabName });
  };


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
            <h2>Device Management</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         
              {/* Dugme koje vodi na formu za registraciju */}
              {auth.profile?.role === 'ADMIN' && (
                <button 
                  className="btn-primary-neon" 
                  onClick={() => setActiveTab('register-device')}
                >
                  + INITIALIZE_REGISTRATION
                </button>
              )}
            </div>
            <div className="view-section">
        
            <DeviceList 
              device={auth.profile?.role=="ADMIN" ? device.devices : device.myDevices} 
              onDelete={auth.handleDeleteUser} 
              onDevice={auth.profile?.role=="ADMIN" ? device.fetchDevices : device.fetchMyDevices}
              isAdmin={auth.profile?.role === "ADMIN"} 
              onDeviceClick={(dev) => {
              navigate(`/device/${dev.serialNumber}`); 
            }}
            />
          
          </div>
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
                selectedTargetUser={device.selectedTargetUser}
                setSelectedTargetUser={device.setSelectedTargetUser}
            />
            
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="view-section">
            <h2>Obaveštenja</h2>
            <p>No notifications at the moment</p>
          </div>
        )}

        {activeTab === 'users' && auth.profile?.role === 'ADMIN' && (
          <div className="view-section">
            <h2>User management</h2>
            <UsersList 
              users={auth.users} 
              onDelete={auth.handleDeleteUser} 
              onUsers={auth.fetchUsers}
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