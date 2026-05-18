// src/hooks/useDeviceTelemetry.ts

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { apiClient} from '../api/client';
import {ENDPOINTS, WS_BASE_URL} from '../api/config.ts'
import type { DeviceTelemetryDTO } from '../models/device-telemetry.dto';
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

    Promise.all([
        apiClient<DeviceTelemetryDTO | null>(ENDPOINTS.DEVICE.TELEMETRY_LATEST(deviceId),'GET', undefined,token),
        apiClient<DeviceTelemetryDTO[]>(ENDPOINTS.DEVICE.TELEMETRY(deviceId),'GET', undefined, token)])
            .then(([latest, history]) => {
            setLatestTelemetry(latest);
            setTelemetryHistory(history);
        })
            .catch((error: any) => {
            console.error('[Telemetry] Failed to fetch telemetry:', error);
        })
            .finally(() => {
            setLoading(false);
        });
    }, [deviceId, token]);


  useEffect(() => {
    if (!deviceId) return;

    const socket: Socket = io(WS_BASE_URL, {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('[WS] Connected:', socket.id);

      socket.emit('device:subscribe', {
        deviceId,
      });
    });

    socket.on('telemetry:update', (telemetry: DeviceTelemetryDTO) => {
      console.log('[WS] Telemetry update:', telemetry);

      setLatestTelemetry(telemetry);

      setTelemetryHistory((previous) => {
        const updated = [telemetry, ...previous];
        return updated.slice(0, 20);
      });
    });

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [deviceId]);

  return {
    latestTelemetry,
    telemetryHistory,
    loading,
  };
};