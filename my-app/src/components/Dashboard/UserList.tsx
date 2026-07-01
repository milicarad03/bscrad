import { Card } from '../../components/UI/Card';
import type {UserDTO} from '../../models/auth.dto'

import { Button } from '../UI/Button';
import { RotateCw, Trash2, Check, X } from 'lucide-react'; 
interface UserListProps{
    users: UserDTO[];
    onDelete:(id:number)=>void;
    onApprove:(id:number | string , status :'APPROVED' | 'REJECTED')=>void;
    onUsers: (e: React.SyntheticEvent) => void;
}

export const UsersList = ({ users, onDelete, onUsers, onApprove }: UserListProps) => {
  return (
    <Card title="User Management">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
        <Button onClick={onUsers} className="btn-refresh" title="Osveži listu">
          <RotateCw size={18} />
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {users.length === 0 ? (
          <p style={{ opacity: 0.5, textAlign: 'center' }}>Nema pronađenih korisnika.</p>
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
                  {user.name || 'Nema imena'}
                </span>
                <span style={{ opacity: 0.6, fontSize: '0.8rem', color: '#e0e867' }}>
                  {user.email}
                </span>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.4 }}>
                  {user.status}
                </span>
              </div>

             
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                
                {user.status === 'PENDING' && (
                  <>
                    <button 
                    data-cy={`approve-user-${user.id}`}
                      onClick={() => {if (window.confirm(`Approve user ${user.name}?`)) {onApprove(user.id, 'APPROVED')}}}
                      title="Odobri"
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
                      onClick={() =>  {if (window.confirm(`Decline user ${user.name}?`)) {onApprove(user.id, 'REJECTED')}}}
                      title="Odbij"
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
                  title="Obriši"
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
  );
}