import { 
  LayoutDashboard, 
  Cpu, 
  Bell, 
  Users, 
  User, 
  LogOut,
  PackagePlus,
  Gauge,
} from 'lucide-react';
import { Button } from '../UI/Button';

interface SidebarProps {
  profile: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar = ({ profile, activeTab, setActiveTab, onLogout }: SidebarProps) => {

  const menuItems = [
    { id: 'profile', label: 'My Account', icon: <User size={18} /> },
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'devices', label: 'Device Management', icon: <Cpu size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
  ];

 if (
  profile?.role ===
  'ADMIN'
) {
  menuItems.push({
    id: 'users',

    label: 'Users',

    icon:
      <Users size={18} />,
  });

  menuItems.push({
    id: 'model-versions',

    label:
      'Model Versions',

    icon:
      <PackagePlus
        size={18}
      />,
  });
}
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark" aria-hidden="true">
          <Gauge size={17} />
        </span>
        <span className="sidebar-brand-copy">
          <span className="sidebar-brand-title">IoT Control</span>
          <span className="sidebar-brand-subtitle">Operations console</span>
        </span>
      </div>

      <div className="sidebar-user-info">
        <h3 title={profile?.email}>{profile?.email?.split('@')[0] || 'User'}</h3>
        <span className="role-badge">{profile?.role}</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <Button  data-cy="logoutbtn" variant="danger" onClick={onLogout} className="logout-btn">
        <LogOut size={18} style={{ marginRight: '8px' }} />
        Logout
      </Button>
    </aside>
  );
};