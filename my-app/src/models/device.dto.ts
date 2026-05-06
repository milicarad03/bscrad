export interface DeviceDTO {
  id: string;            // UUID iz baze
  serialNumber: string;  // npr. "SN-100234"
  name?: string;         // Opciono ime (npr. "Senzor u dnevnoj")
  type: string;          // npr. "TEMP_SENSOR"
  apiKey?: string;       // Opciono (vidi napomenu ispod)
  isActive: boolean;
  createdAt: string;     // ISO datum string
}

export interface CreateDeviceDTO {
  serialNumber: string;
  name?: string;
  type?: string;
}