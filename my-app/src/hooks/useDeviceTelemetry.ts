// src/hooks/useDeviceTelemetry.ts

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient} from '../api/client';
import {ENDPOINTS, WS_BASE_URL} from '../api/config.ts'
import type { DeviceTelemetryDTO } from '../models/device-telemetry.dto';
import log from 'loglevel';
const logger = log.getLogger('useDeviceTelemetry');
if (import.meta.env.DEV) {
  logger.setLevel('debug');
} else {
  logger.setLevel('warn');
}
type UseDeviceTelemetryParams = {
  deviceId?: string;
  token?: string | null;
};

export const useDeviceTelemetry = ({ deviceId, token }: UseDeviceTelemetryParams) => {
  const [latestTelemetry, setLatestTelemetry] = useState<DeviceTelemetryDTO| null>(null);
  const [telemetryHistory, setTelemetryHistory] = useState<DeviceTelemetryDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;

    setLoading(true);

    logger.debug(`[TELEMETRY] Triggering dual matrix synchronization for device allocation key: ${deviceId}`);
    Promise.all([
        apiClient<DeviceTelemetryDTO | null>(ENDPOINTS.DEVICE.TELEMETRY_LATEST(deviceId),'GET', undefined,token),
        apiClient<DeviceTelemetryDTO[]>(ENDPOINTS.DEVICE.TELEMETRY(deviceId),'GET', undefined, token)])
        .then(([latest, history]) => {
          logger.info(`[TELEMETRY] Successfully populated hardware analytics. History stack size: ${history.length}`);
            setLatestTelemetry(latest);
            setTelemetryHistory(history);
        })
        .catch((error: any) => {
            logger.error(`[TELEMETRY] Critical connection dropped during HTTP synchronization for node [${deviceId}]:`, error.message);
            console.error('[Telemetry] Failed to fetch telemetry:', error);
        })
            .finally(() => {
            setLoading(false);
        });
    }, [deviceId, token]);


  useEffect(() => {
    if (!deviceId) return;
    logger.debug(`[WS] Initializing real-time stream pipeline container towards: ${WS_BASE_URL}`);

    const socket: Socket = io(WS_BASE_URL, {
      withCredentials: true,

      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      timeout: 5000,

    });

    socket.on('connect', () => {
      logger.info(`[WS] WebSocket handshaking pipeline verified. Session identifier: ${socket.id}`);
      
      logger.debug(`[WS] Dispatching live subscribe frame command for device telemetry allocation: ${deviceId}`);

      socket.emit('device:subscribe', {
        deviceId,
      });
    });

    socket.on('telemetry:update', (telemetry: DeviceTelemetryDTO) => {
      logger.info(`[WS] Hot telemetry telemetry delta package intercepted for device: ${deviceId}`);
      logger.debug(`[WS] Telemetry structural frame payload: ${JSON.stringify(telemetry.data)}`);

      setLatestTelemetry(telemetry);

      setTelemetryHistory((previous) => {
        const updated = [telemetry, ...previous];
        return updated.slice(0, 5);
      });
    });

    socket.on('disconnect', () => {
      logger.warn(`[WS] Connection socket interface closed or dropped by peer destination target.`);
    });

    return () => {
      logger.debug(`[WS] Destruction hook called. Tearing down active stream pipe connection for device: ${deviceId}`);
      socket.disconnect();
    };
  }, [deviceId]);

  return {
    latestTelemetry,
    telemetryHistory,
    loading,
  };
};