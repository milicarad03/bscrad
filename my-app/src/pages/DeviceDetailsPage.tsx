import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Sidebar } from '../components/Dashboard/Sidebar';
import { useDeviceTelemetry } from '../hooks/useDeviceTelemetry';
import { useAuth } from '../hooks/useAuth';
import { useDevice } from '../hooks/useDevice';
import { toast } from 'react-hot-toast';
import '../styles/layouts/deviceDetailsPage.css';
import type { CommandMetadata } from '../models/device.dto';
import { CommandCard } from '../components/DeviceCommands/CommandCard';
import { TelemetryChart } from '../styles/components/charts/TelemetryChart';
import { TelemetryAggregationCard } from "../styles/components/agregation/TelemetryAgregation"
import { transformTelemetryForCharts } from '../utils/telemetryTransformer';
import { DynamicDeviceDashboard, type DashboardConfig } from 'device-dashboard-ui-plugin';
import { registerDashboardRenderer } from 'device-dashboard-ui-plugin/registry';
import { OilGaugeRenderer } from '../components/CustomRenderers/OilGaugeRenderer';
import { useDevicesStatuses } from '../hooks/useDeviceStatus';


/*registerDashboardRenderer(
  'oil-gauge',
  OilGaugeRenderer,
);*/
registerDashboardRenderer('oil-gauge', new OilGaugeRenderer());

/*const testDashboardConfig: DashboardConfig = {
  sections: [
    {
      id: 'current-metrics',
      title: 'CURRENT METRICS FROM UI PLUGIN',
      columns: 4,
      items: [
        {
          id: 'uptime',
          component: 'value-card',
          bind: 'uptime',
          title: 'Uptime',
        },
        {
          id: 'op-mode',
          component: 'value-card',
          bind: 'opMode',
          title: 'Operating Mode',
        },
        {
          id: 'led',
          component: 'value-card',
          bind: 'led',
          title: 'LED State',
        },
        {
          id: 'led-switch',
          component: 'switch',
          bind: 'led',
          title: 'LED Control',
          command: 'SET_LED',
          commandField: 'state',
        },
        {
          id: 'rpm-control',
          component: 'numeric-input',
          title: 'RPM Control',
          command: 'SET_RPM',
          commandField: 'rpm',
          min: 0,
          max: 5000,
          step: 100,
        },
        {
          id: 'wide-card',
          component: 'value-card',
          bind: 'uptime',
          title: 'Wide Card',
          colSpan: 2,
        },
        {
          id: 'uptime-chart',
          component: 'line-chart',
          bind: 'uptime',
          title: 'Uptime History',
          colSpan: 2,
        },
        {
          id: 'uptime-table',
          component: 'table',
          bind: 'uptime',
          title: 'Uptime Table',
          colSpan: 2,
        },
        {
          id: 'visible-test',
          component: 'value-card',
          bind: 'led',
          title: 'VISIBLE ONLY WHEN LED IS ON',
          visibleWhen: {
            bind: 'led',
            equals: true,
          },
        }
     ],
    },
  ],
};
const testTelemetry = {
  temperature: 23.5,
};
*/



export const DeviceDetailsPage = ({ auth }: { auth: any }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { latestTelemetry, telemetryHistory, loading: telemetryLoading, chartData } = useDeviceTelemetry({ deviceId: id, token: auth?.token });
  const { users, fetchUsers } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  //const [stylePreset, setStylePreset] = useState<'default' | 'modern' | 'compact'>('default');
  const [streamStatus, setStreamStatus] = useState<'ACTIVE' | 'IDLE'>('IDLE');
  const [commandMetadata, setCommandMetadata] = useState<CommandMetadata[]>([]);
  const units: Record<string, string> = {
    temperature: "°C",
    humidity: "%",
    pressure: "hPa",
    flow: "l/min",
    vibration: "mm/s",
    rpm: "rpm"
  };

  const { handleReassignDevice, fetchDevices, sendDeviceCommand, devices, loading: devicesLoading, getCommandMetadata, updateDeviceStatus} = useDevice(auth?.token);

  const currentDevice = devices.find((d) => String(d.id) === String(id) || String(d.serialNumber) === String(id));
  console.log(
  'DEVICE STATUS:',
  currentDevice?.status,
);
  
  
  
  const isDeviceConnected = currentDevice?.status === 'ONLINE';
  const isAdmin = auth?.profile?.role === 'ADMIN';
  const ledColorSamples = latestTelemetry?.data?.ledColor ?? [];

  const displayLedColor =Array.isArray(ledColorSamples) && ledColorSamples.length > 0 ? ledColorSamples[ledColorSamples.length - 1][0]: "N/A";

  const ledSamples = latestTelemetry?.data?.led ?? [];

  const displayLedState = Array.isArray(ledSamples) && ledSamples.length > 0 ? ledSamples[ledSamples.length - 1][0] : false;
  const currentProfile = latestTelemetry?.data?.system?.status?.operatingProfile ?? 'NORMAL';
  const historicalData = latestTelemetry?.data? transformTelemetryForCharts(latestTelemetry.data) : [];

  const dashboardConfig = currentDevice?.modelVersion?.mapping?.dashboard as DashboardConfig
  console.log('DASHBOARD CONFIG', dashboardConfig);
  
  const filteredHistoricalData =  historicalData.filter(item =>
    Object.entries(item).some(
      ([key, value]) =>
        key !== "timestamp" &&
        typeof value === "number"
    )
  );
    console.log("historicalData",historicalData.slice(0, 100));
       const telemetryFields = Array.from(
        new Set(
          historicalData.flatMap(item =>
            Object.keys(item).filter(
              key =>
                key !== "timestamp" &&
                typeof item[key] === "number"
            )
          )
        )
      );
 
  const currentMetrics = Object.entries(latestTelemetry?.data ?? {})
      .map(([key, values]) => {
        if (!Array.isArray(values)) return null;
    
        const last = values[values.length - 1];
        if (!last) return null;
        return {
          key,
          value: last[0]
        };
      })
      .filter(
        metric =>
          metric !== null &&
          typeof metric.value !== "boolean"
      );

  const pluginTelemetry = Object.entries( latestTelemetry?.data ?? {}).reduce<Record<string, unknown>>(
    (result, [field, values]) => {
      if (!Array.isArray(values) || values.length === 0) {
        return result;
      }

      const last = values[values.length - 1];

      if (!Array.isArray(last)) {
        return result;
      }

      result[field] = last[0];

      return result;
    },
    {},
  );
  const dashboardCommandHandler = async (
  command: string,
  payload: Record<string, unknown>,
) => {
  await sendDeviceCommand(
    id!,
    command,
    payload,
  );
};

/*
useDevicesStatuses({
  onStatusUpdate: (
    deviceId,
    newStatus,
  ) => {
    updateDeviceStatus(
      deviceId,
      newStatus,
    );
  },
});
*/
useDevicesStatuses({
  onStatusUpdate: (deviceId, newStatus) => {
    updateDeviceStatus(deviceId, newStatus);
  },
});
  const executeCommand = async (command: string, payload: any) => {
      try {
        await sendDeviceCommand(id!, command, payload);
        toast.success(`${command} executed`);
      } catch {
        toast.error('Command failed');
      }
    };

  const handleCommand = async (command: string, payload: any, setter: (val: boolean) => void) => {
    setter(true);
    try {
      await sendDeviceCommand(id!, command, payload);
      setStreamStatus(payload.state);
      toast.success(`System state set to ${payload.state}`);
    } catch (err: any) {
      if (err.message !== 'DEVICE_OFFLINE') toast.error('Failed to execute command.');
    } finally {
      setter(false);
    }
  };

  const onTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedUserId) return;
    if (window.confirm(`TRANSFER OWNERSHIP OF NODE ${id}?`)) {
      await handleReassignDevice(id, Number(selectedUserId));
      setSelectedUserId('');
    }
  };
  useEffect(() => {
  
    if (!id || !isDeviceConnected) return;


    sendDeviceCommand(id, 'SET_STATE', { state: 'ACTIVE' })
      .then(() => {
        setStreamStatus('ACTIVE');
        toast.success('Telemetry stream initiated');
      })
      .catch((err) => {
   
        if (err.message !== 'DEVICE_OFFLINE') {
          toast.error('Failed to auto-start stream');
        }
      });

    
    return () => {
      if (isDeviceConnected) {
        sendDeviceCommand( id, 'SET_STATE', { state: 'IDLE' }, true).catch(() => {});
      }
    };

  }, [id, isDeviceConnected]);

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin]);
  useEffect(() => { if (auth?.token) fetchDevices(); }, [auth?.token]);
  useEffect(() => { if (id) getCommandMetadata(id).then(setCommandMetadata).catch(console.error); }, [id, getCommandMetadata]);

  if (devicesLoading) return <div className="dashboard-layout">Loading system data...</div>;
  if (!currentDevice) return <div className="dashboard-layout">Device not found</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar profile={auth.profile} activeTab="devices" setActiveTab={() => navigate('/dashboard')} onLogout={auth.handleLogout} />

      <main className="dashboard-content">
        <header className="dd-header">
          <button className="dd-back" onClick={() => navigate('/dashboard?tab=devices')}>RETURN_TO_SYSTEM_REGISTRY</button>
          <h1 className="dd-title">SYSTEM_NODE: <span className="highlight">{id}</span></h1>
        </header>

        <div className="dd-grid">
          <Card title="SYSTEM_CONTROLS">
            <div className="dd-row">
              <Button className={`dd-btn dd-btn--row ${streamStatus === 'ACTIVE' ? 'dd-btn--on' : ''}`} onClick={() => handleCommand('SET_STATE', { state: 'ACTIVE' }, setIsStarting)} disabled={isStarting || !isDeviceConnected}>
                {isStarting ? 'ACTIVATING...' : 'START_STREAM'}
              </Button>
              <Button className={`dd-btn dd-btn--row ${streamStatus === 'IDLE' ? 'dd-btn--on' : ''}`} onClick={() => handleCommand('SET_STATE', { state: 'IDLE' }, setIsStopping)} disabled={isStopping || !isDeviceConnected}>
                {isStopping ? 'STOPPING...' : 'STOP_STREAM'}
              </Button>
            </div>
            {isAdmin && (
              <form onSubmit={onTransferSubmit} className="dd-transfer">
                <label className="dd-transfer-label">TRANSFER_OWNERSHIP</label>
                <div className="dd-row">
                  <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="dd-select" required>
                    <option value="">SELECT_USER</option>
                    {users.filter(u => u.status === 'APPROVED').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <Button type="submit" className="dd-btn">TRANSFER</Button>
                </div>
              </form>
            )}
          </Card>

          
          <Card title="DEVICE_STATUS">
            <div className="dd-state-grid">
              <div className="dd-state-card">
                <span className="dd-state-label">LED STATE</span>
                <span className={displayLedState ? 'dd-indicator-on' : 'dd-indicator-off'}>{displayLedState ? 'ON' : 'OFF'}</span>
              </div>
              <div className="dd-state-card">
                <span className="dd-state-label">LED COLOR</span>
                <div className="dd-led-color-display">
                  <span className="dd-led-dot" style={{ background: displayLedColor?.toLowerCase() === 'n/a' ? '#333' : displayLedColor?.toLowerCase() }} />
                  <span>{displayLedColor}</span>
                </div>
              </div>
              <div className="dd-state-card">
                <span className="dd-state-label">PROFILE</span>
                <span className={currentProfile === 'BOOST' ? 'dd-indicator-on' : 'dd-indicator-off'}>{currentProfile}</span>
              </div>
            </div>
          </Card>
        </div>
  
        {dashboardConfig && (

        <DynamicDeviceDashboard
        deviceId={id ?? 'unknown-device'}
        config={dashboardConfig}
        telemetry={pluginTelemetry}
        history={historicalData}
        onCommand={dashboardCommandHandler}
        disabled={!isDeviceConnected}
        schema={currentDevice?.modelVersion?.schema}
        />
        )}
         <Card title="CURRENT_METRICS">
          <div className="dd-state-grid">
            {currentMetrics.map(metric => (
              <div
                key={metric!.key}
                className="dd-state-card"
              >
                <span className="dd-state-label">
                  {metric!.key.toUpperCase()}
                </span>

                <strong>
                  {metric!.value}
                  {" "}
                  {units[metric!.key] ?? ""}
                </strong>
              </div>
            ))}
          </div>
        </Card>
        <TelemetryAggregationCard
          historicalData={historicalData}
          title="TELEMETRY_ANALYTICS"
        />
        <Card title="DEVICE_COMMANDS">
          <div className="dd-commands-container">
            {commandMetadata.map(command => (
              <div key={command.command} className="dd-command-wrapper">
                <CommandCard 
                  command={command} 
                  disabled={!isDeviceConnected} 
                  latestTelemetry={latestTelemetry?.data} 
                  onExecute={executeCommand} 
                />
              </div>
            ))}
          </div>
        </Card>
        <div className="dd-grid" style={{ marginTop: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
          
          <Card title="LATEST_TELEMETRY">
            <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '0.85rem' }}>
              {latestTelemetry ? (
                <pre>{JSON.stringify(latestTelemetry.data, null, 2)}</pre>
              ) : (
                <p>No telemetry data available.</p>
              )}
            </div>
          </Card>
          {telemetryFields.map(field => (
            <Card
              key={field}
              title={`${field.toUpperCase()}_HISTORY`}
            >
              <TelemetryChart
                data={historicalData}
                field={field}
                label={field}
                unit={units[field] ?? ""}
              />
            </Card>
          ))}
          <Card title="AVAILABLE_COMMANDS">
          {commandMetadata.map(command => (
                  <div
                    key={command.command}
                    className="dd-section"
                     >
                    <strong>
                    {command.command}
                    </strong>

                    {command.fields.map(field => (
                      <div key={field.path}>
                                  {field.name}
                                  {" | "}
                                  {field.type}
                                </div>
                              ))}
                            </div>
                          ))}
          </Card>
        </div>

        <div style={{ marginTop: '20px' }}>
        <Card title="TELEMETRY_HISTORY">
          <div style={{ overflowX: "auto" }}>
            <table className="dd-table">
              <thead>
                <tr>
                  <th>Timestamp</th>

                  {telemetryFields.map(field => (
                    <th key={field}>
                      {field.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredHistoricalData.reverse().map(item => (
                  <tr key={item.timestamp}>
                    <td>
                      {new Date(
                        item.timestamp
                      ).toLocaleString()}
                    </td>

                    {telemetryFields.map(field => (
                      <td key={field}>
                        {String(
                          item[field] ?? "N/A"
                        )}
                        {" "}
                        {units[field] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        </div>
      </main>
    </div>
  );
};