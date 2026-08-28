import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  DynamicDeviceDashboard,
  type DashboardConfig,
} from 'device-dashboard-ui-plugin';

type ModelVersionFixture = {
  id: string;
  version: string;
  schema: Record<string, unknown>;
  mapping: {
    fields: Record<string, { path: string }>;
    dashboard: DashboardConfig;
  };
};

const firstModelVersion: ModelVersionFixture = {
  id: 'mv-1',
  version: '1.1.3',
  schema: {},
  mapping: {
    fields: {
      flowRate: { path: 'metrics.flowRate' },
    },
    dashboard: {
      sections: [
        {
          id: 'legacy-overview',
          title: 'MODEL 1.1.3 OVERVIEW',
          columns: 1,
          items: [
            {
              id: 'flow-rate',
              component: 'value-card',
              bind: 'flowRate',
              title: 'Legacy Flow Rate',
              unit: 'L/min',
            },
          ],
        },
      ],
    },
  },
};

const secondModelVersion: ModelVersionFixture = {
  id: 'mv-2',
  version: '1.1.4',
  schema: {
    commands: {
      SET_PUMP: {
        payload: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
          },
          required: ['enabled'],
        },
      },
    },
  },
  mapping: {
    fields: {
      pumpEnabled: { path: 'system.status.pumpEnabled' },
    },
    dashboard: {
      sections: [
        {
          id: 'updated-controls',
          title: 'MODEL 1.1.4 CONTROLS',
          columns: 1,
          items: [
            {
              id: 'pump-switch',
              component: 'switch',
              bind: 'pumpEnabled',
              title: 'Updated Pump Switch',
              command: 'SET_PUMP',
              commandField: 'enabled',
            },
          ],
        },
      ],
    },
  },
};

function ModelSwitchHarness() {
  const [activeVersion, setActiveVersion] =
    useState<ModelVersionFixture>(firstModelVersion);

  return (
    <>
      <button
        type="button"
        onClick={() => setActiveVersion(secondModelVersion)}
      >
        Apply model 1.1.4
      </button>

      <DynamicDeviceDashboard
        deviceId="SN-1"
        config={activeVersion.mapping.dashboard}
        telemetry={{
          flowRate: 180.6,
          pumpEnabled: false,
        }}
        schema={activeVersion.schema}
        availableBindings={Object.keys(activeVersion.mapping.fields)}
        onCommand={() => undefined}
      />
    </>
  );
}

describe('Model switch scenario', () => {
  it('rebuilds dashboard sections and renderers from the active model version', () => {
    render(<ModelSwitchHarness />);

    expect(
      screen.getByRole('heading', {
        name: 'MODEL 1.1.3 OVERVIEW',
      }),
    ).toBeDefined();
    expect(screen.getByText('Legacy Flow Rate')).toBeDefined();
    expect(screen.getByText('180.6')).toBeDefined();
    expect(
      screen.queryByRole('heading', {
        name: 'MODEL 1.1.4 CONTROLS',
      }),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Apply model 1.1.4',
      }),
    );

    expect(
      screen.queryByRole('heading', {
        name: 'MODEL 1.1.3 OVERVIEW',
      }),
    ).toBeNull();
    expect(screen.queryByText('Legacy Flow Rate')).toBeNull();
    expect(
      screen.getByRole('heading', {
        name: 'MODEL 1.1.4 CONTROLS',
      }),
    ).toBeDefined();
    expect(screen.getByText('Updated Pump Switch')).toBeDefined();
    expect(screen.getByText('INACTIVE')).toBeDefined();
  });
});
