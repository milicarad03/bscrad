export interface DeviceTelemetryDTO {
  id?: string;
  deviceId: string;
  timestamp: string;
  data: Record<string, unknown>;
  createdAt?: string;
}