import { describe, expect, it } from 'vitest';
import { validateDeviceBulkImportManifest } from './deviceBulkImport';

const device = (serialNumber: string) => ({
  serialNumber,
  name: `Device ${serialNumber}`,
  type: 'sensor',
  model: 'modelA',
  version: '10.0.0',
});

describe('device bulk import manifest validation', () => {
  it('normalizes a valid manifest', () => {
    expect(
      validateDeviceBulkImportManifest({
        targetUserEmail: ' owner@example.com ',
        devices: [device('fleet-a-001')],
      }),
    ).toEqual({
      targetUserEmail: 'owner@example.com',
      devices: [device('fleet-a-001')],
    });
  });

  it('rejects duplicate serial numbers', () => {
    expect(() =>
      validateDeviceBulkImportManifest({
        targetUserEmail: 'owner@example.com',
        devices: [device('fleet-a-001'), device('fleet-a-001')],
      }),
    ).toThrow('Duplicate serial number in manifest: fleet-a-001.');
  });

  it('rejects an incomplete device row', () => {
    expect(() =>
      validateDeviceBulkImportManifest({
        targetUserEmail: 'owner@example.com',
        devices: [
          {
            serialNumber: 'fleet-a-001',
            model: 'modelA',
            version: '10.0.0',
          },
        ],
      }),
    ).toThrow('Missing required value: device 1, name.');
  });
});
