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
  message:string;
  onCancel:() => void;
}

export const DeviceForm = ({ onSubmit, serialNumber, setSerialNumber, name, setName, type, setType, message , onCancel}: DeviceFormProps) => (
  <Card title="Register new device">
    <form onSubmit={onSubmit} className="auth-form">
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
        <Button type="submit" className="btn-save">Sačuvaj</Button>
        <Button type="button" className="btn-cancel" variant="secondary" onClick={onCancel}>Otkaži</Button>
         
      </div>
       {message && <p className={`status-message ${message.includes('Uspešan') ? 'success' : 'warning'}`}>{message}</p>}
      
    
    </form>
  </Card>
);