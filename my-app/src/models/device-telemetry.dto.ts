export interface DeviceTelemetryDTO {
  id?: string;
  deviceId: string;
  timestamp: string;
  data: Record<string, unknown>;
  createdAt?: string;




  led?: boolean;     
  ledColor?: string; 
  humidity?: number;
  pressure?: number;
  temperature?: number;

  status?: {
    ledState?: boolean;
    ledColor?: string;
  };
}