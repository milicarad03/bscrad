import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { WS_BASE_URL } from '../api/config.ts';
import log from 'loglevel';

const logger = log.getLogger('useDevicesStatuses');
if (import.meta.env.DEV) {
  logger.setLevel('debug');
} else {
  logger.setLevel('warn');
}

type StatusUpdatePayload = {
  deviceId: string;
  status: 'ONLINE' | 'OFFLINE' | 'UNINITIALIZED';
};

interface UseDevicesStatusesParams {
  onStatusUpdate: (deviceId: string, newStatus: 'ONLINE' | 'OFFLINE' | 'UNINITIALIZED') => void;
}

export const useDevicesStatuses = ({ onStatusUpdate }: UseDevicesStatusesParams) => {
  useEffect(() => {
    logger.debug(`[WS-STATUS] Initializing global status stream container towards: ${WS_BASE_URL}`);

    const socket: Socket = io(WS_BASE_URL, {
      withCredentials: true,
    });

    socket.on('connect', () => {
      logger.info(`[WS-STATUS] Connected. Dispatching global status subscribe command.`);

      console.log(
          '[WS-STATUS] Connected:',
          socket.id
        );

      
   
      socket.emit('devices:subscribe_statuses');
    });


    socket.on('device:status_update', (payload: StatusUpdatePayload) => {
       console.count('STATUS_EVENT');
      logger.info(`[WS-STATUS] Status delta captured for node [${payload.deviceId}] -> ${payload.status}`);
      
    
      onStatusUpdate(payload.deviceId, payload.status);
    });

    socket.on('disconnect', (reason) => {
      logger.warn(`[WS-STATUS] Global status pipeline closed.`);

      console.log(
          '[WS-STATUS] Disconnected:',
          socket.id,
          reason
        );

      
    });

    return () => {
      logger.debug(`[WS-STATUS] Tearing down active global status pipe.`);
      socket.disconnect();
    };
  }, [onStatusUpdate]);
};