import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from '../components/Dashboard/Sidebar';
import { useDeviceTelemetry } from '../hooks/useDeviceTelemetry';
import { useDevice } from '../hooks/useDevice';
import { toast } from 'react-hot-toast';
import '../styles/layouts/deviceDetailsPage.css';
import { transformTelemetryForCharts } from '../utils/telemetryTransformer';
import { DynamicDeviceDashboard } from 'device-dashboard-ui-plugin';
import { useDevicesStatuses } from '../hooks/useDeviceStatus';
import { registerDashboardRenderer } from 'device-dashboard-ui-plugin/registry';
import { OilGaugeRenderer } from '../components/CustomRenderers/OilGaugeRenderer';
import { ArrowLeft, Wifi, WifiOff } from 'lucide-react';
export const DeviceDetailsPage = ({ auth }: { auth: any }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { latestTelemetry } = useDeviceTelemetry({ deviceId: id, token: auth?.token });
  const { fetchDevices, sendDeviceCommand, devices, loading: devicesLoading, updateDeviceStatus } = useDevice(auth?.token);
  const currentDevice = devices.find((d) => String(d.id) === String(id) || String(d.serialNumber) === String(id));
  const isDeviceConnected = currentDevice?.status === 'ONLINE';
  const historicalData = latestTelemetry?.data ? transformTelemetryForCharts(latestTelemetry.data) : [];
  const dashboardConfig = currentDevice?.modelVersion?.mapping?.dashboard;

  registerDashboardRenderer('oil-gauge', new OilGaugeRenderer());


  const pluginTelemetry = {
    // 3. Raspakuj telemetriju iz merenja i statusa preko mapera
    ...Object.entries(latestTelemetry?.data ?? {}).reduce<Record<string, unknown>>(
      (result, [field, values]) => {
        if (!Array.isArray(values) || values.length === 0) {
          if (values !== undefined && values !== null) {
            result[field] = values;
          }
          return result;
        }

        const last = values[values.length - 1];

        if (Array.isArray(last) && last.length >= 2) {
          const [elem0, elem1] = last;
          const isElem0Timestamp = typeof elem0 === 'number' && elem0 > 1000000000;
          result[field] = isElem0Timestamp ? elem1 : elem0;
        } else if (last && typeof last === 'object' && 'value' in last) {
          result[field] = (last as any).value;
        } else {
          result[field] = last;
        }

        return result;
      },
      {},
    ),
    // Device attributes are the latest authoritative metadata snapshot.
    ...(currentDevice?.attributes ?? {}),
    serialNumber:
      currentDevice?.attributes?.serialNumber ??
      currentDevice?.serialNumber,
    firmware:
      currentDevice?.attributes?.firmware ??
      currentDevice?.modelVersion?.version,
  };
  const dashboardCommandHandler = async (
    command: string,
    payload: Record<string, unknown>,
  ) => {
    try {
      await sendDeviceCommand(
        id!,
        command,
        payload,
      );

      toast.success(`${command} executed`);
    } catch {
      toast.error(`${command} failed`);
    }
  };

  useDevicesStatuses({
    onStatusUpdate: (deviceId, newStatus) => {
      updateDeviceStatus(deviceId, newStatus);
    },
  });

  useEffect(() => {
    if (!id || !isDeviceConnected) return;

    sendDeviceCommand(id, 'SET_STATE', { state: 'ACTIVE' })
      .then(() => {
        toast.success('Telemetry stream initiated');
      })
      .catch((err) => {
        if (err.message !== 'DEVICE_OFFLINE') {
          toast.error('Failed to auto-start stream');
        }
      });

    return () => {
      if (isDeviceConnected) {
        sendDeviceCommand(id, 'SET_STATE', { state: 'IDLE' }, true).catch(() => {});
      }
    };
  }, [id, isDeviceConnected]);

  useEffect(() => { if (auth?.token) fetchDevices(); }, [auth?.token]);

  if (devicesLoading) return <div className="dashboard-layout">Loading system data...</div>;
  if (!currentDevice) return <div className="dashboard-layout">Device not found</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar profile={auth.profile} activeTab="devices" setActiveTab={() => navigate('/dashboard')} onLogout={auth.handleLogout} />

      <main className="dashboard-content">
        <header className="dd-header">
          <button className="dd-back" onClick={() => navigate('/dashboard?tab=devices')}>
            <ArrowLeft size={15} aria-hidden="true" />
            All devices
          </button>

          <div className="dd-heading-row">
            <div className="dd-heading-copy">
              <span className="dd-eyebrow">Device details</span>
              <h1 className="dd-title">
                <span className="highlight">{currentDevice.name || id}</span>
              </h1>
              <div className="dd-device-meta">
                <span>{currentDevice.serialNumber}</span>
                <span className="dd-device-meta-separator" aria-hidden="true">/</span>
                <span>{currentDevice.modelVersion?.modelId || currentDevice.type}</span>
                {currentDevice.modelVersion?.version && (
                  <>
                    <span className="dd-device-meta-separator" aria-hidden="true">/</span>
                    <span>v{currentDevice.modelVersion.version}</span>
                  </>
                )}
              </div>
            </div>

            <span className={`dd-connection ${isDeviceConnected ? 'dd-connection--online' : 'dd-connection--offline'}`}>
              {isDeviceConnected ? <Wifi size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />}
              {isDeviceConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </header>
        {dashboardConfig && (
          <DynamicDeviceDashboard
            deviceId={id ?? 'unknown-device'}
            config={dashboardConfig}
            telemetry={pluginTelemetry}
            history={historicalData}
            onCommand={dashboardCommandHandler}
            disabled={!isDeviceConnected}
            schema={currentDevice?.modelVersion?.schema}
            availableBindings={Object.keys(
              currentDevice?.modelVersion?.mapping?.fields ?? {},
            )}
            stylePreset="dark"
          />
        )}
      </main>
    </div>
  );
};