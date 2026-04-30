import { Card } from '../../components/UI/Card';
import type {UserDTO} from '../../models/auth.dto'

interface UserListProps{
    users: UserDTO[];
}

export const UsersList=({users}:UserListProps)=>{
    return (
    <Card title="Users from backend:">
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
              <strong style={{ color: '#1169bc', fontSize: '1rem' }}>
                {user.name}
              </strong>
              <span style={{ 
                opacity: 0.7, 
                fontSize: '0.85rem', 
                color: '#646cff' 
              }}>
                {user.email}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}