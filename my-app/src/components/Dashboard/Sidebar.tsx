// components/Dashboard/Sidebar.tsx
export const Sidebar = ({ auth }: { auth: any }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">DEVICE.IO</div>
      
      <nav className="sidebar-nav">
        <a href="#" className="nav-item active">📊 Dashboard</a>
        <a href="#" className="nav-item">📱 Moji Uređaji</a>
        <a href="#" className="nav-item">📝 Objave</a>

        {/* Sekcija samo za Admina */}
        {auth.profile?.role === 'ADMIN' && (
          <>
            <p className="admin-label">Administracija</p>
            <a href="#" className="nav-item">👥 Korisnici</a>
            <a href="#" className="nav-item">⚙️ Podešavanja sistema</a>
          </>
        )}
      </nav>

      <button 
        onClick={auth.handleLogout} 
        className="nav-item" 
        style={{ border: 'none', background: 'none', marginTop: 'auto', color: '#ef4444', cursor: 'pointer' }}
      >
        🚪 Odjavi se
      </button>
    </aside>
  );
};