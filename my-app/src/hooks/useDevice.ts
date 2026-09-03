import { useState,useEffect , useCallback, useRef} from 'react';
import type {
  DeviceDTO,
  CreateDeviceDTO,
  CommandMetadata,
  ModelVersionDTO,
} from '../models/device.dto';
import type {
  BulkDeviceImportManifestDTO,
  BulkDeviceImportResultDTO,
} from '../models/device-bulk-import.dto';
import {ENDPOINTS} from '../api/config.ts'
import {apiClient} from '../api/client.ts'
import { toast } from 'react-hot-toast';

import log from 'loglevel';
const logger = log.getLogger('useDevice');
if (import.meta.env.DEV) {
  logger.setLevel('debug');
} else {
  logger.setLevel('warn');
}

type ApplyModelVersionResponse = {
  success: boolean;
  staged: boolean;
  restartRequired: boolean;

  deviceId: string;
  serialNumber: string;

  model: string;
  version: string;
  modelVersionId: string;
};

type DeviceCommandResponse = {
  success: boolean;
  correlationId: string;
  status: 'DISPATCHED' | 'NOOP';
  reason?: 'ALREADY_APPLIED';
  observedAt?: string;
  performance?: {
    clientStartedAt: number;
    serverReceivedAt: number;
    uiToServerMs: number;
  };
};


export const useDevice = (token: string | null) => { 

  //dodato useRef
  const isSubmittingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('');
  const [loading, setLoading] = useState(false);
  const [myDevices, setMyDevices] = useState<DeviceDTO[]>([]);
  const [devices, setDevices] = useState<DeviceDTO[]>([]);
  const [message, setMessage] = useState('');
  const [selectedTargetUsers, setSelectedTargetUsers] = useState<number[]>([]);
  const [selectedDeviceModel,setSelectedDeviceModel]=useState<string[]>([]);


  const [selectedTypes, setSelectedTypes] = useState<string[]>([]); 
  const [models, setModels] = useState<ModelVersionDTO[]>([]);
  const [hasError, setHasError] = useState(false);
  const resetError = useCallback(() => {
    setHasError(false);
  }, []);


  const fetchModels =
  useCallback(
    async (
      signal?: AbortSignal,
    ) => {
      if (!token) {
        return;
      }

      try {
        const res =
          await apiClient<
            ModelVersionDTO[]
          >(
            ENDPOINTS
              .MODEL_VERSIONS
              .BASE,

            'GET',
            null,
            token,
            undefined,
            signal,
          );

        const modelsArray =
          Array.isArray(res)
            ? res
            : [];

        logger.info(
          `[DEVICE] Successfully loaded ${modelsArray.length} model versions.`,
        );

        setModels(
          modelsArray,
        );
      } catch (err: any) {
        if (
          err?.name ===
          'AbortError'
        ) {
          return;
        }

        logger.error(
          '[DEVICE] Failed to load model versions:',
          err.message,
        );
      }
    },

    [token],
  );


  useEffect(() => {
    setSelectedTypes([]);
    setSelectedTargetUsers([]);
    setSelectedDeviceModel([]);
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
 
    if (token) {
      fetchModels(controller.signal); 
    }

  /*  if (token) {
      fetchModels(); 
    }*/
       return () => {
      controller.abort();
    };

    
  }, [token, fetchModels]); 

const handleCreateDevice = (e: React.SyntheticEvent) => {
  if (!token) {
      logger.warn("[DEVICE] Provisioning pipeline aborted. Session token missing.");
      return;
    }
  e.preventDefault();

 if (isSubmittingRef.current) return;

  isSubmittingRef.current = true;

  if(loading) return;
  setLoading(true);

  const dataCreateDevice: CreateDeviceDTO = {
    serialNumber: newSerialNumber,
    name: newDeviceName,
    type:newDeviceType,
    targetUserId: selectedTargetUsers.length > 0 ? selectedTargetUsers[0] : undefined,
    modelVersionId: selectedDeviceModel.length > 0 ? selectedDeviceModel[0]: undefined
  };
 logger.info(`[DEVICE] Attempting to provision new hardware node. SN: ${dataCreateDevice.serialNumber}`);
  apiClient<DeviceDTO>(ENDPOINTS.DEVICE.BASE, 'POST', dataCreateDevice, token)
    .then((newDeviceFromServer) => {
      logger.info(`[DEVICE] Hardware node provisioned successfully. ID assigned: ${newDeviceFromServer.id}`);
      setMessage(`Device "${newDeviceFromServer.name}" created successfully!`);
      setDevices(prev => [newDeviceFromServer, ...prev]);
      fetchDevices();
      fetchModels();
      resetError();
      setNewDeviceName('');
      setNewSerialNumber('');
      setNewDeviceType('');
      setSelectedTargetUsers([]);
      setSelectedTypes([]);
      setSelectedDeviceModel([]);
      
    })
    .catch((err: any) => {
      logger.error(`[DEVICE] Node provisioning transaction rejected for SN [${dataCreateDevice.serialNumber}]:`, err.message);
      toast.error(err.message || "Error creating device");
    })
     .finally(() => {
        setLoading(false);
        isSubmittingRef.current = false;
      });
};

const fetchDevices = useCallback(async (filters?: any, signal?: AbortSignal) => {
  if (loading || hasError) return;
  setLoading(true);
  setHasError(false);

  apiClient<{data: DeviceDTO[]; meta: any }>(ENDPOINTS.DEVICE.BASE, 'GET', null, token, filters, signal)
    .then((res) => {
      setDevices(res.data);
    })
    .catch((err: any) => {
      if (err?.name === 'AbortError') return;
      setHasError(true);
      toast.error(err.message || "Failed to fetch devices");
      logger.error('[DEVICE] Fetch devices failed:', err.message);
    })
    .finally(() => {
       if (!signal?.aborted) setLoading(false);
    });
}, [token, loading, hasError]); 


  const handleDeleteDevice = (id:  string) => {
    logger.warn(`[DEVICE] Dispatched hard destruction payload command for target node ID: ${id}`);
    apiClient(ENDPOINTS.DEVICE.DELETE(id), 'DELETE', null, token)
        .then(() => {
          logger.info(`[DEVICE] Node identifier [${id}] successfully expunged from system layout database.`);
            toast.success("Device deleted");
            setDevices(prev => prev.filter(u => u.id !== id));
        })
        .catch((err) => {
        logger.error(`[DEVICE] Data table purge sequence failed for targeted node allocation key [${id}]:`, err.message);
        toast.error(err.message);
      });
  };
  const handleReassignDevice = (deviceId: string, targetUserId: number) => {
  logger.info(`[DEVICE] Initiating transfer for device [${deviceId}] to user ID: ${targetUserId}`);
  
  apiClient(ENDPOINTS.DEVICE.REASSIGN(deviceId), 'PATCH', { targetUserId }, token)
    .then(() => {
      logger.info(`[DEVICE] Transfer successful for device ${deviceId}`);
      toast.success("Device successfully reassigned!");
      fetchDevices(); 
    })
    .catch((err) => {
      logger.error(`[DEVICE] Transfer failed for device ${deviceId}:`, err.message);
      toast.error(err.message || "Failed to reassign device");
    });
};
const sendDeviceCommand = async (deviceId: string, command: string, payload?: any, silent = false) => {
  const clientStartedAt = Date.now();
  logger.info(`[COMMAND] Sending ${command} to device ${deviceId}`);


  console.log(
    "[API SEND]",
    deviceId,
    command,
    payload
  );
  return apiClient<DeviceCommandResponse>(
    ENDPOINTS.DEVICE.COMMAND(deviceId),
    'POST',
    { command, payload },
    token,
    undefined,
    undefined,
    {
      'X-UI-Command-Started-At': String(clientStartedAt),
    },
  )
    .then((response) => {
      if (response.performance) {
        logger.info(
          `[PERFORMANCE] UI to server for ${command}: ` +
            `${response.performance.uiToServerMs} ms`,
        );
      }

      if (!silent) {
        toast.success(
          response.status === 'NOOP'
            ? 'Requested state is already applied.'
            : 'Command confirmed by device.',
        );
      }
      return response;
    })
    .catch((err) => {
      console.log("COMMAND ERROR:", err);
      console.log("COMMAND ERROR MESSAGE:", err.message);

      if (err.message === 'Device unreachable' || err.message === 'Request Timeout') {
        throw new Error('DEVICE_OFFLINE');
      }

      if ( err.message?.toLowerCase().includes('offline')) {
        throw new Error('DEVICE_OFFLINE');
      }
     if (!silent) toast.error(err.message || "Failed to send command");
      throw err;
    });
};
/*const getCommandMetadata = async ( deviceId: string) => {

  logger.info(`[COMMAND METADATA] Loading metadata for device ${deviceId}`);

  return apiClient<CommandMetadata[]>(ENDPOINTS.DEVICE.COMMAND_METADATA(deviceId),'GET', null, token)
    .then((response) => {
      logger.info(`[COMMAND METADATA] Loaded metadata for device ${deviceId}`);

      return response;
    })
    .catch((err) => {

      logger.error( `[COMMAND METADATA] Failed loading metadata for device ${deviceId}:`, err.message );
      throw err;
    });ac
};*/
const getCommandMetadata = useCallback(async (deviceId: string) => {
  logger.info(`[COMMAND METADATA] Loading metadata for device ${deviceId}`);

  return apiClient<CommandMetadata[]>(ENDPOINTS.DEVICE.COMMAND_METADATA(deviceId), 'GET', null, token)
    .then((response) => {
      logger.info(`[COMMAND METADATA] Loaded metadata for device ${deviceId}`);
      return response;
    })
    .catch((err) => {
      logger.error(`[COMMAND METADATA] Failed loading metadata for device ${deviceId}:`, err.message);
      throw err;
    });
}, [token]); // Dodaj token u zavisnosti


const updateDeviceStatus = useCallback((deviceId: string, newStatus: 'ONLINE' | 'OFFLINE' | 'UNINITIALIZED' ) => {

  console.log( "[STATUS UPDATE]", deviceId, newStatus);

    setDevices(prev =>
      prev.map(d =>
        d.id === deviceId ||
        d.serialNumber === deviceId
          ? { ...d, status: newStatus }
          : d
      )
    );
  },[]);
  const uploadModelVersion =
  useCallback(
    async (params: {
      modelName: string;

      version: string;

      schemaFile: File;

      mappingFile: File;
    }) => {
      if (!token) {
        throw new Error(
          'Unauthorized',
        );
      }

      const formData =
        new FormData();

      formData.append(
        'modelName',
        params.modelName,
      );

      formData.append(
        'version',
        params.version,
      );

      formData.append(
        'schema',
        params.schemaFile,
      );

      formData.append(
        'mapping',
        params.mappingFile,
      );

      try {
        const created =
          await apiClient<ModelVersionDTO>(
            ENDPOINTS
              .MODEL_VERSIONS
              .UPLOAD,

            'POST',
            formData,
            token,
          );

        toast.success(
          `Model version ${params.modelName}:${params.version} uploaded`,
        );

        /*
         * Posle uspešnog uploada
         * ponovo učitaj listu verzija.
         */
        await fetchModels();

        return created;
      } catch (err: any) {
        logger.error(
          '[MODEL VERSION] Upload failed:',
          err.message,
        );

        toast.error(
          err.message ||
            'Model version upload failed',
        );

        throw err;
      }
    },

    [
      token,
      fetchModels,
    ],
  );
  const applyModelVersion =
  useCallback(
    async (
      deviceId: string,
      modelVersionId: string,
    ) => {
      if (!token) {
        throw new Error(
          'Unauthorized',
        );
      }

      try {
        logger.info(
          `[MODEL VERSION] Applying modelVersionId=${modelVersionId} to device=${deviceId}`,
        );

        const result =
          await apiClient<ApplyModelVersionResponse>(
            ENDPOINTS.DEVICE
              .APPLY_MODEL_VERSION(
                deviceId,
              ),

            'PATCH',

            {
              modelVersionId,
            },

            token,
          );

        logger.info(
          `[MODEL VERSION] Device ${result.serialNumber} switched to ${result.model}:${result.version}`,
        );

        if (
          result.restartRequired
        ) {
          toast.success(
            `Model ${result.model}:${result.version} applied. Device must be restarted.`,
          );
        } else {
          toast.success(
            `Model ${result.model}:${result.version} applied.`,
          );
        }

        /*
         * DB je sada promenjen na
         * novu ModelVersion, pa
         * osvežavamo listu uređaja.
         */
        await fetchDevices();

        return result;
      } catch (err: any) {
        logger.error(
          '[MODEL VERSION] Device update failed:',
          err.message,
        );

        toast.error(
          err.message ||
            'Failed to update device version',
        );

        throw err;
      }
    },

    [
      token,
      fetchDevices,
    ],
  );

  const bulkImportDevices = useCallback(
    async (
      manifest: BulkDeviceImportManifestDTO,
    ): Promise<BulkDeviceImportResultDTO> => {
      if (!token) {
        throw new Error('Unauthorized');
      }

      try {
        const result = await apiClient<BulkDeviceImportResultDTO>(
          ENDPOINTS.DEVICE.BULK_IMPORT,
          'POST',
          manifest,
          token,
        );

        toast.success(
          `${result.created} devices created, ${result.skipped} skipped.`,
        );
        await fetchDevices();
        return result;
      } catch (err: any) {
        logger.error(
          '[DEVICE BULK IMPORT] Import failed:',
          err.message,
        );
        toast.error(err.message || 'Device import failed');
        throw err;
      }
    },
    [token, fetchDevices],
  );


 
  const resetForm = () => {
    logger.debug("[DEVICE] Resetting state bounds on hardware creation form UI inputs.");
    setMessage('');
    setNewDeviceName('');
    setNewSerialNumber('');
    setNewDeviceType('');
  };


return {
    handleCreateDevice, newSerialNumber, setNewSerialNumber, newDeviceName, setNewDeviceName, newDeviceType, setNewDeviceType
,message, applyModelVersion, bulkImportDevices, fetchModels, uploadModelVersion, setMessage, resetForm, fetchDevices, setDevices, devices,loading, myDevices, setMyDevices, selectedTargetUsers, setSelectedTargetUsers, handleDeleteDevice, setSelectedTypes, selectedTypes, selectedDeviceModel, setSelectedDeviceModel, models, setModels, handleReassignDevice, hasError, resetError, sendDeviceCommand, updateDeviceStatus, getCommandMetadata};

};
