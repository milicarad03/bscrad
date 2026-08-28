import type {UserDTO} from './auth.dto'
import type { DeviceTelemetryDTO } from './device-telemetry.dto';


export interface DeviceDTO {
  id: string;            
  serialNumber: string; 
  name?: string;        
  type: string;         
  apiKey?: string;       
  isActive: boolean;
  createdAt: string; 
  userId:number;   
  user?: UserDTO;
  lastseen: string; 
  status: 'ONLINE' | 'OFFLINE' | 'UNINITIALIZED';
  telemetryState?: 'ACTIVE' | 'IDLE';
  telemetryStateUpdatedAt?: string | null;
  attributes?: {
    serialNumber?: string;
    firmware?: string;
    hardwareModel?: string;
    [key: string]: any;
  } | null;
  
  modelVersion?: {
    id: string;
    version: string;
    modelId?: string;
    model?: {
      id: string;
      name: string;
      description?: string;
    };
    schema?: {
      commands?: Record<string, any>;
    };
    mapping?: Record<string, any>;
  };
  latestTelemetry?: DeviceTelemetryDTO | null;
}

export interface CreateDeviceDTO {
  serialNumber: string;
  name?: string;
  type?: string;
  targetUserId?: number;
  modelVersionId? : string;
}

export interface CommandFieldMetadata {
  name: string;
  path: string;
  type: string;
  required: boolean;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  default?: any;
  description?: string;
}

export interface CommandMetadata {
  command: string;
  fields: CommandFieldMetadata[];
}
export interface ModelVersionDTO {
  id: string;
  version: string;
  modelId: string;
  schema?: Record<string, any>;
  mapping?: Record<string, any>;
}
