import { Card } from '../components/UI/Card';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';
import {usePosts} from '../hooks/usePosts'
import {useAuth} from '../hooks/useAuth'
import {UsersList} from '../components/Dashboard/UserList'
import {PostForm} from '../components/Dashboard/PostForm'
import {PostList} from '../components/Dashboard/PostList'
import {DraftList} from '../components/Dashboard/DraftList'
import { useState } from 'react';
import { Sidebar } from '../components/Dashboard/Sidebar';

interface DashboardProps {
  post:ReturnType<typeof usePosts>
  auth:ReturnType<typeof useAuth>
}



export const Dashboard = ({ auth, post }: DashboardProps) => {
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
            <h2>Korisnički Profil</h2>
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
            <p>Prazna strana za uređaje.</p>
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