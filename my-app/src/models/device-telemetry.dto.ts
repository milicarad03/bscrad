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
  data: TelemetryData;
  createdAt?: string;
  status?: {
    ledState?: boolean;
    ledColor?: string;
  };
}