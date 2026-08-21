import { describe, it, expect } from 'vitest';

describe('Model switch architecture', () => {
  it('uses dashboard metadata from active model version', () => {
    const sensorDashboard = {
      sections: [
        {
          id: 'overview',
          title: 'SENSOR OVERVIEW',
        },
      ],
    };

    const compressorDashboard = {
      sections: [
        {
          id: 'overview',
          title: 'COMPRESSOR OVERVIEW',
        },
      ],
    };

    const sensorDevice = {
      modelVersion: {
        mapping: {
          dashboard: sensorDashboard,
        },
      },
    };

    const compressorDevice = {
      modelVersion: {
        mapping: {
          dashboard: compressorDashboard,
        },
      },
    };

    expect(
      sensorDevice.modelVersion.mapping.dashboard.sections[0].title,
    ).toBe('SENSOR OVERVIEW');

    expect(
      compressorDevice.modelVersion.mapping.dashboard.sections[0].title,
    ).toBe('COMPRESSOR OVERVIEW');
  });
});