export interface TelemetryData {
  led?: boolean;
  ledColor?: string;
  humidity?: number;
  pressure?: number;
  temperature?: number;
  
  system?: {
      status?: {
        operatingProfile?: 'NORMAL' | 'BOOST' | 'ECONOMY';
      };
    };

}



export interface DeviceTelemetryDTO {
  id?: string;
  deviceId: string;
  timestamp: string;
  //data: Record<string, unknown>;
  data: TelemetryData;
  createdAt?: string;
 /* led?: boolean;     
  ledColor?: string; 
  humidity?: number;
  pressure?: number;
  temperature?: number;*/

  status?: {
    ledState?: boolean;
    ledColor?: string;
  };
}