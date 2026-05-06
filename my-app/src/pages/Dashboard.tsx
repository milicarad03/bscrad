import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
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
import { useState } from 'react';
import { Sidebar } from '../components/Dashboard/Sidebar';

interface DashboardProps {
  post:ReturnType<typeof usePosts>
  auth:ReturnType<typeof useAuth>
  device:ReturnType<typeof useDevice>
}



export const Dashboard = ({ auth, post, device }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState('profile'); // Default strana

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
            <p>Ovde će biti statistika...</p>
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
              device={device.devices} 
              onDelete={auth.handleDeleteUser} 
              onDevice={device.fetchDevices}
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
              serialNumber={device.newSerialNumber}
              setSerialNumber={device.setNewSerialNumber}
              name={device.newDeviceName}
              setName={device.setNewDeviceName}
              type={device.newDeviceType}
              setType={device.setNewDeviceType}
              message={device.message}
              onCancel={() => {device.resetForm(); setActiveTab('devices');}}
            />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="view-section">
            <h2>Obaveštenja</h2>
            <p>Trenutno nema novih obaveštenja.</p>
          </div>
        )}

        {activeTab === 'users' && auth.profile?.role === 'ADMIN' && (
          <div className="view-section">
            <h2>Upravljanje korisnicima</h2>
            <UsersList 
              users={auth.users} 
              onDelete={auth.handleDeleteUser} 
              onUsers={auth.fetchUsers}
            />
          </div>
        )}
      </main>
    </div>
  );
};