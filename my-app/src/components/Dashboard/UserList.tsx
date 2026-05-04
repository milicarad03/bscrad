import { Card } from '../../components/UI/Card';
import type {UserDTO} from '../../models/auth.dto'

import { Button } from '../UI/Button';
interface UserListProps{
    users: UserDTO[];
    onDelete:(id:number)=>void;
    onUsers: (e: React.SyntheticEvent) => void;
}

export const UsersList=({users, onDelete, onUsers}:UserListProps)=>{
    return (
    <Card title="Users from backend:">
      <div style={{ marginBottom: '15px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <Button 
                    onClick={onUsers} 
                    style={{ fontSize: '0.8rem', backgroundColor: '#1bb48b' }}
                >
                    Osveži listu korisnika
                </Button>
            </div>
      <div style={{ textAlign: 'left' }}>
        {/* Provera ako je lista prazna */}
        {users.length === 0 ? (
          <p style={{ opacity: 0.5 }}>Nema pronađenih korisnika.</p>
        ) : (
          users.map((user) => (
            <div 
              key={user.id} 
              style={{ 
                borderBottom: '1px solid #1bb48b', 
                padding: '10px 0',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ color: '#1169bc', fontSize: '1rem' }}>
                  {user.name}
                </strong>
                <span style={{ opacity: 0.7, fontSize: '0.85rem', color: '#646cff' }}>
                  {user.email}
                </span>
              </div>
              <Button 
                onClick={() => {
                  if (window.confirm(`Da li ste sigurni da želite da obrišete korisnika ${user.name}?`)) {
                    onDelete(Number(user.id));
                  }
                }}
                style={{ 
                  backgroundColor: '#e74c3c', 
                  padding: '5px 12px', 
                  fontSize: '0.8rem',
                  minWidth: 'auto',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                Obriši
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}