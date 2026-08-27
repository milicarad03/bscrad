import { useState } from 'react';
import { Card } from '../../components/UI/Card';
import type { UserDTO } from '../../models/auth.dto';
import { Button } from '../UI/Button';
import { RotateCw, Trash2, Check, X } from 'lucide-react';

interface UserListProps {
  users: UserDTO[];
  onDelete: (id: number) => void;
  onApprove: (id: number | string, status: 'APPROVED' | 'REJECTED') => void;
  onUsers: (e: React.SyntheticEvent) => void;
}

export const UsersList = ({ users, onDelete, onUsers, onApprove }: UserListProps) => {
  const [isRotating, setIsRotating] = useState(false);

  const handleClick = (e: React.SyntheticEvent) => {
    setIsRotating(true);
    onUsers(e);
    // Zaustavljamo animaciju nakon 600ms da bi mogla ponovo da se pokrene na sledeći klik
    setTimeout(() => {
      setIsRotating(false);
    }, 600);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>User Management</h2>
        <Button 
          onClick={handleClick} 
          className="btn-refresh" 
          title="Refresh list"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)', 
            border: '1px solid rgba(139, 189, 176, 0.3)', 
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <RotateCw 
            size={18} 
            style={{ 
              transition: 'transform 0.6s ease',
              transform: isRotating ? 'rotate(360deg)' : 'rotate(0deg)' 
            }} 
          />
        </Button>
      </div>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {users.length === 0 ? (
            <p style={{ opacity: 0.5, textAlign: 'center' }}>No users found.</p>
          ) : (
            users.map((user) => (
              <div 
                key={user.id} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between', 
                  border: '1px solid rgba(139, 189, 176, 0.2)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ color: '#81a4e4', fontWeight: 'bold', fontSize: '0.95rem' }}>
                    {user.name || 'No name'}
                  </span>
                  <span style={{ opacity: 0.6, fontSize: '0.8rem', color: '#e0e867' }}>
                    {user.email}
                  </span>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0', opacity: 0.4 }}>
                    {user.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {user.status === 'PENDING' && (
                    <>
                      <button 
                        data-cy={`approve-user-${user.id}`}
                        onClick={() => { if (window.confirm(`Approve user ${user.name}?`)) { onApprove(user.id, 'APPROVED'); } }}
                        title="Approve"
                        style={{ 
                          backgroundColor: '#2e7d32', 
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Check size={16} />
                      </button>
                      
                      <button 
                        data-cy={`decline-user-${user.id}`}
                        onClick={() => { if (window.confirm(`Decline user ${user.name}?`)) { onApprove(user.id, 'REJECTED'); } }}
                        title="Decline"
                        style={{ 
                          backgroundColor: '#d32f2f', 
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          width: '32px',
                          height: '32px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}

                  <button 
                    onClick={() => {
                      if (window.confirm(`Delete user ${user.name}?`)) {
                        onDelete(Number(user.id));
                      }
                    }}
                    title="Delete"
                    style={{ 
                      backgroundColor: 'transparent', 
                      color: '#ff5252',
                      border: '1px solid #ff5252',
                      borderRadius: '4px',
                      width: '32px',
                      height: '32px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: '8px'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
};