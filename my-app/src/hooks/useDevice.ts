import { useState,useEffect , useCallback, useRef} from 'react';
import type {DeviceDTO} from '../models/device.dto'
import type {CreateDeviceDTO} from '../models/device.dto'
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
  const [models, setModels] = useState<any[]>([]);

  const [hasError, setHasError] = useState(false);
  const resetError = useCallback(() => {
    setHasError(false);
  }, []);


  const fetchModels = useCallback((signal?: AbortSignal)=> {
    if (!token) return;

    apiClient<any[]>(ENDPOINTS.MODEL_VERSIONS.BASE, 'GET', null, token,undefined,signal)
      .then((res: any) => {
        const modelsArray = Array.isArray(res) ? res : res.data || [];
        logger.info(`[DEVICE] Successfully loaded ${modelsArray.length} schema models from configuration tables.`);
        setModels(modelsArray);
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError') return;
        
        logger.error("[DEVICE] Failed to populate schema model blueprints from backend:", err.message);
      });
  }, [token]);


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


  /*const fetchDevices = async (filters?: { status?: string; type?: string[]; userId?: number[]}) => {
    if (!token) {
      logger.warn("[DEVICE] Drop query execution for fetchDevices. Unauthenticated state.");
      return;
    }
    if (loading || hasError) {
    logger.warn("[DEVICE] Fetch aborted: Already loading or in error state.");
    return;
  }
    setLoading(true);

    setHasError(false);

    logger.debug(`[DEVICE] Fetching active devices registry index. Query Filters: ${JSON.stringify(filters || {})}`);
    
    apiClient<{data: DeviceDTO[]; meta : any }>(ENDPOINTS.DEVICE.BASE, 'GET', null, token, filters)
      .then((res) => {
        
        logger.info(`[DEVICE] Registry index pulled successfully. Records bound: ${res.data.length}`);
        setDevices(res.data);
      })
      .catch((err: any) => {
        setHasError(true);
        logger.error("[DEVICE] Failed to synchronous parse server inventory states:", err.message);
        toast.error(err.message || "Failed to fetch devices");
      })
      .finally(() => setLoading(false));
  };*/
  
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


 
  const resetForm = () => {
    logger.debug("[DEVICE] Resetting state bounds on hardware creation form UI inputs.");
    setMessage('');
    setNewDeviceName('');
    setNewSerialNumber('');
    setNewDeviceType('');
  };


return {
    handleCreateDevice, newSerialNumber, setNewSerialNumber, newDeviceName, setNewDeviceName, newDeviceType, setNewDeviceType
,message,setMessage, resetForm, fetchDevices, setDevices, devices,loading, myDevices, setMyDevices, selectedTargetUsers, setSelectedTargetUsers, handleDeleteDevice, setSelectedTypes, selectedTypes, selectedDeviceModel, setSelectedDeviceModel, models, setModels, handleReassignDevice, hasError, resetError};

};
  