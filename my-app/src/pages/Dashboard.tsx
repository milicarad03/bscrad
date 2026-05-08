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


  const navigate=useNavigate();
 

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
          {/* 1. Ovu celu kontrolnu tablu prikazujemo SAMO adminima */}
          {auth.profile?.role === 'ADMIN' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="btn-primary-neon" 
                  onClick={() => device.fetchDevices()} 
                >
                  SHOW_ALL_DATABASE
                </button>

                <button 
                  className="btn-primary-neon" 
                  onClick={() => device.fetchDevices({ own: true })}
                >
                  VIEW_MY_HARDWARE
                </button>
              </div>

              <button 
                className="btn-primary-neon"
                onClick={() => setActiveTab('register-device')}
                style={{ backgroundColor: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}
              >
                + REGISTER_NEW_UNIT
              </button>
            </div>
          )}

          {/* 2. Ako korisnik NIJE admin, možemo mu ostaviti samo naslov ili prazan prostor */}
          {auth.profile?.role !== 'ADMIN' && (
            <div style={{ marginBottom: '15px' }}>
              <h2 style={{ color: 'var(--accent-neon)' }}>MY_ASSIGNED_DEVICES</h2>
            </div>
          )}

          <DeviceList 
            device={device.devices}
            onDelete={device.handleDeleteDevice} 
            onDevice={() => device.fetchDevices()}
            isAdmin={auth.profile?.role === "ADMIN"}
            onDeviceClick={(dev) => navigate(`/device/${dev.serialNumber}`)}
            currentUserId={auth.profile?.id}
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
              onApprove={auth.handleApproveUser}
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