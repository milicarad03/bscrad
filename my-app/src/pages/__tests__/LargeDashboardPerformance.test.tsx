import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import largeMapper from '../../../../server/schema/modelLarge/mapper.json';
import { DeviceDetailsPage } from '../../pages/DeviceDetailsPage';

vi.mock('device-dashboard-ui-plugin', () => ({
  DynamicDeviceDashboard: () => (
    <div data-testid="dynamic-dashboard">Mocked Dynamic Dashboard</div>
  ),
  BaseDashboardRenderer: class {
    validate() {
      return null;
    }
    render() {
      return null;
    }
  },
  registerDashboardRenderer: vi.fn(),
}));

vi.mock('device-dashboard-ui-plugin/registry', () => ({
  registerDashboardRenderer: vi.fn(),
}));

vi.mock('../../hooks/useDeviceTelemetry', () => ({
  useDeviceTelemetry: () => ({ latestTelemetry: null }),
}));

vi.mock('../../hooks/useDevice', () => ({
  useDevice: () => ({
    fetchDevices: vi.fn().mockResolvedValue([]),
    sendDeviceCommand: vi.fn().mockResolvedValue({ success: true }),
    devices: [
      {
        id: 'large-dev-1',
        name: 'Large Pump Test',
        serialNumber: 'LG-999-X',
        status: 'ONLINE',
        type: 'modelLarge',
        modelVersion: {
          modelId: 'modelLarge',
          version: '1.0.0',
          mapping: largeMapper,
          schema: {},
        },
        attributes: {
          serialNumber: 'LG-999-X',
          firmware: 'v1.0.0',
          hardwareModel: 'LargePump-Pro',
          location: 'Sector 7G',
        },
      },
    ],
    loading: false,
    updateDeviceStatus: vi.fn(),
  }),
}));

vi.mock('../../hooks/useDeviceStatus', () => ({
  useDevicesStatuses: vi.fn(),
}));

describe('Large Dashboard Performance & Integration', () => {
  const sections = largeMapper.dashboard.sections;
  const allItems = sections.flatMap((section) => section.items) as any[];

  it('should contain 7 sections', () => {
    expect(sections).toHaveLength(7);
  });

  it('should contain 30 dashboard items', () => {
    expect(allItems.length).toBe(30);
  });

  it('should contain alerts section', () => {
    expect(sections.some((section) => section.id === 'alerts-section')).toBe(true);
  });

  it('should contain device information section', () => {
    expect(sections.some((section) => section.id === 'device-info')).toBe(true);
  });

  it('should contain telemetry analytics section', () => {
    expect(
      sections.some((section) => section.id === 'telemetry-analytics'),
    ).toBe(true);
  });

  it('should contain all required component types', () => {
    const types = allItems.map((item) => item.component);

    expect(types).toContain('value-card');
    expect(types).toContain('switch');
    expect(types).toContain('numeric-input');
    expect(types).toContain('line-chart');
    expect(types).toContain('table');
  });

  it('should have unique component ids', () => {
    const ids = allItems.map((item) => item.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should validate chart layout colSpan', () => {
    const charts = allItems.filter(
      (item) => item.component === 'line-chart' || item.component === 'table',
    );

    expect(charts.length).toBe(6);

    charts.forEach((chart) => {
      expect(chart.colSpan).toBe(2);
    });
  });

  it('should validate all binds exist', () => {
    const fields = Object.keys(largeMapper.fields);

    allItems.forEach((item) => {
      if (item.bind) {
        expect(fields).toContain(item.bind);
      }
    });
  });

  it('should validate command components', () => {
    const commandComponents = allItems.filter((item) => item.command);

    expect(commandComponents.length).toBe(2);
    expect(
      commandComponents.some((item) => item.command === 'SET_PUMP_STATE'),
    ).toBe(true);
    expect(
      commandComponents.some((item) => item.command === 'SET_FLOW_TARGET'),
    ).toBe(true);
  });

  it('should validate section column configuration', () => {
    sections.forEach((section) => {
      expect(section.columns).toBeGreaterThan(0);
    });
  });

  it('should validate analytics components count', () => {
    const analyticsSection = sections.find(
      (section) => section.id === 'telemetry-analytics',
    );

    expect(analyticsSection).toBeDefined();
    expect(analyticsSection?.items.length).toBe(6);
  });

  it('should validate dashboard processing performance', () => {
    const start = performance.now();

    for (let i = 0; i < 1000; i++) {
      sections.flatMap((section) => section.items.map((item) => item.id));
    }

    const end = performance.now();

    expect(end - start).toBeLessThan(1000);
  });

  it('should process multiple updates under 500ms', () => {
    const start = performance.now();

    for (let i = 0; i < 5000; i++) {
      allItems.forEach((item) => {
        JSON.stringify(item);
      });
    }

    const end = performance.now();

    expect(end - start).toBeLessThan(500);
  });

  it('should render DeviceDetailsPage with dashboard sections successfully', () => {
    render(
      <MemoryRouter initialEntries={['/devices/large-dev-1']}>
        <Routes>
          <Route
            path="/devices/:id"
            element={
              <DeviceDetailsPage
                auth={{
                  token: 'mock-token',
                  profile: { name: 'Milica' },
                  handleLogout: () => {},
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Device details')).toBeTruthy();
    expect(screen.getByText('LG-999-X')).toBeTruthy();
    expect(screen.getByTestId('dynamic-dashboard')).toBeTruthy();
  });
});