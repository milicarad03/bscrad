// src/components/Dashboard/PostForm.tsx
import { Card } from '../UI/Card';
import { Input } from '../UI/Input';
import { Button } from '../UI/Button';

interface DeviceFormProps {
  onSubmit: (e: React.SyntheticEvent) => void;
  serialNumber: string;
  setSerialNumber: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  type: string;
  setType: (val: string) => void;


  selectedTargetUser: string | number;
  setSelectedTargetUser: (val: string) => void;
  users: any[];
  isAdmin: boolean;
  message:string;
  onCancel:() => void;
  loading:boolean;
  
}

export const DeviceForm = ({ onSubmit, serialNumber, setSerialNumber, name, setName, type, setType, selectedTargetUser,setSelectedTargetUser, users, isAdmin, message , onCancel,loading}: DeviceFormProps) => (
  <Card title="Register new device">
    <form onSubmit={onSubmit} className="auth-form">
      {isAdmin && (
        <div className="input-group" style={{ marginBottom: '15px' }}>
          <label className="input-label" style={{ display: 'block', marginBottom: '5px' }}>
            Assign to User (Admin only)
          </label>
          <select 
            className="btn-save" 
            value={selectedTargetUser}
            onChange={(e) => setSelectedTargetUser(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px' }}
          >
            <option value=""> Me </option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.email})
              </option>
            ))}
          </select>
        </div>
      )}
      <Input 
        label="Serial Number"
        placeholder="npr. SN-100"
        value={serialNumber}
        onChange={setSerialNumber}
        required
      />
      <Input 
        label="Name"
        placeholder="npr. sensor 1"
        value={name}
         onChange={setName}
        required
      />
      <Input 
        label="Type"
        placeholder="npr. TEMP_SENSOR"
        value={type}
        onChange={setType}
        required
      />
      
    <div className="form-actions">
        <Button type="submit" className="btn-save" disabled={loading} > {loading ? 'Sending..': 'Save'}</Button>
        <Button type="button" className="btn-cancel" disabled={loading} variant="secondary" onClick={onCancel}>Cancel</Button>
         
      </div>
       {message && <p className={`status-message ${message.includes('success') ? 'successfully' : 'warning'}`}>{message}</p>}
      
    
    </form>
  </Card>
);