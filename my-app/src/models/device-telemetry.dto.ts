/*export interface TelemetryData {
  led?: boolean;
  ledColor?: string;
  humidity?: number;
  pressure?: number;
  temperature?: number;
  historicalTelemetry?: HistoricalTelemetryPoint[];
  system?: {
      status?: {
        operatingProfile?: 'NORMAL' | 'BOOST' | 'ECONOMY';
      };
    };

}*/
/*export interface HistoricalTelemetryPoint {

timestamp: string;
temperature: number;
humidity: number;
pressure: number;
led: boolean;


}*/

export interface TelemetryData {
  historicalTelemetry?: HistoricalTelemetryPoint[];

  led?: boolean;
  ledColor?: string;

  system?: {
    status?: {
      operatingProfile?: 'NORMAL' | 'BOOST' | 'ECONOMY';
    };
  };

  [key: string]: unknown;
}
export interface HistoricalTelemetryPoint {
  timestamp: string;
  [key: string]: unknown;
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