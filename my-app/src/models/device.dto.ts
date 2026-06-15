import type {UserDTO} from './auth.dto'
import type { DeviceTelemetryDTO } from './device-telemetry.dto';


export interface DeviceDTO {
  id: string;            // UUID iz baze
  serialNumber: string;  // npr. "SN-100234"
  name?: string;         // Opciono ime (npr. "Senzor u dnevnoj")
  type: string;          // npr. "TEMP_SENSOR"
  apiKey?: string;       // Opciono (vidi napomenu ispod)
  isActive: boolean;
  createdAt: string; 
 
  userId:number;   
  user?: UserDTO;

  lastseen: string; 
  status: 'ONLINE' | 'OFFLINE' | 'UNINITIALIZED';
  latestTelemetry?: DeviceTelemetryDTO | null;
  
}

export interface CreateDeviceDTO {
  serialNumber: string;
  name?: string;
  type?: string;
  targetUserId?: number;
  modelVersionId? : string;
}