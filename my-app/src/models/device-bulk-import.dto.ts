export interface BulkDeviceDefinitionDTO {
  serialNumber: string;
  name: string;
  type: string;
  model: string;
  version: string;
}

export interface BulkDeviceImportManifestDTO {
  targetUserEmail: string;
  devices: BulkDeviceDefinitionDTO[];
}

export interface BulkDeviceImportResultDTO {
  total: number;
  created: number;
  skipped: number;
  failed: number;
  targetUser: {
    id: number;
    email: string;
  };
  skippedSerialNumbers: string[];
  concurrentSkips: number;
}

export interface BulkDeviceModelSummaryDTO {
  model: string;
  version: string;
  count: number;
}
