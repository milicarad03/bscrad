import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import type { DeviceDTO } from '../../models/device.dto';


interface DeviceDetailsModalProps {
  device: DeviceDTO | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceDetailsModal = ({ device, isOpen, onClose }: DeviceDetailsModalProps) => {
  
  if (!isOpen || !device) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <Card title={`DEVICE_DETAILS: ${device.serialNumber}`}>
          <div style={{ padding: '20px', minHeight: '200px' }}>
            <h3 style={{ color: '#81a4e4' }}>{device.name}</h3>
            <p><strong>Type:</strong> {device.type}</p>
            <hr style={{ opacity: 0.2, margin: '15px 0' }} />
            
            <p style={{ opacity: 0.5, fontStyle: 'italic' }}>
              No additional characteristics defined for this unit...
            </p>
            
            <Button 
              className="btn-save"
              onClick={onClose} 
              style={{ marginTop: '20px' }}
            >
              CLOSE_WINDOW
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};