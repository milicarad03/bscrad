import type {
  BulkDeviceDefinitionDTO,
  BulkDeviceImportManifestDTO,
} from '../models/device-bulk-import.dto';

const SERIAL_NUMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const REQUIRED_DEVICE_FIELDS: Array<keyof BulkDeviceDefinitionDTO> = [
  'serialNumber',
  'name',
  'type',
  'model',
  'version',
];

const requireText = (
  value: unknown,
  field: string,
  row?: number,
): string => {
  if (typeof value !== 'string' || !value.trim()) {
    const location = row === undefined ? field : `device ${row}, ${field}`;
    throw new Error(`Missing required value: ${location}.`);
  }

  return value.trim();
};

export const validateDeviceBulkImportManifest = (
  value: unknown,
): BulkDeviceImportManifestDTO => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('The manifest must contain a JSON object.');
  }

  const candidate = value as Record<string, unknown>;
  const targetUserEmail = requireText(
    candidate.targetUserEmail,
    'targetUserEmail',
  );

  if (!Array.isArray(candidate.devices) || candidate.devices.length === 0) {
    throw new Error('The manifest must contain at least one device.');
  }
  if (candidate.devices.length > 1000) {
    throw new Error('A single manifest can contain at most 1000 devices.');
  }

  const serialNumbers = new Set<string>();
  const devices = candidate.devices.map((value, index) => {
    const row = index + 1;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`Device ${row} must be a JSON object.`);
    }

    const device = value as Record<string, unknown>;
    const normalized = Object.fromEntries(
      REQUIRED_DEVICE_FIELDS.map((field) => [
        field,
        requireText(device[field], field, row),
      ]),
    ) as unknown as BulkDeviceDefinitionDTO;

    if (!SERIAL_NUMBER_PATTERN.test(normalized.serialNumber)) {
      throw new Error(
        `Device ${row} has an invalid serial number: ${normalized.serialNumber}.`,
      );
    }
    if (serialNumbers.has(normalized.serialNumber)) {
      throw new Error(
        `Duplicate serial number in manifest: ${normalized.serialNumber}.`,
      );
    }
    serialNumbers.add(normalized.serialNumber);

    return normalized;
  });

  return { targetUserEmail, devices };
};

export const readDeviceBulkImportFile = async (
  file: File,
): Promise<BulkDeviceImportManifestDTO> => {
  if (!file.name.toLowerCase().endsWith('.json')) {
    throw new Error('Select a JSON manifest file.');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('The selected file does not contain valid JSON.');
  }

  return validateDeviceBulkImportManifest(parsed);
};
