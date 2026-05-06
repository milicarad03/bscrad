import { useState } from 'react';
import type {DeviceDTO} from '../models/device.dto'
import type {CreateDeviceDTO} from '../models/device.dto'
import {ENDPOINTS} from '../api/config.ts'
import {apiClient} from '../api/client.ts'
import { toast } from 'react-hot-toast';


export const useDevice = (token: string | null) => {
  // 1. STANJA (State)
  const [device, setDevice] = useState<DeviceDTO[]>([]);

  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('');
  const [loading, setLoading] = useState(false);
  const [myDevices, setMyDevices] = useState<DeviceDTO[]>([]);
  const [devices, setDevices] = useState<DeviceDTO[]>([]);
  const [message, setMessage] = useState('');


const handleCreateDevice = (e: React.SyntheticEvent) => {
  if (!token) return;
  e.preventDefault();

  const dataCreateDevice: CreateDeviceDTO = {
    serialNumber: newSerialNumber,
    name: newDeviceName,
    type:newDeviceType
  };

  apiClient<DeviceDTO>(ENDPOINTS.DEVICE.CREATE, 'POST', dataCreateDevice, token)
    .then((newDeviceFromServer) => {
      setMessage(`Device "${newDeviceFromServer.name}" je uspešno kreiran!`);
      setNewDeviceName('');
      setNewSerialNumber('');
      setNewDeviceType('');
      
    })
    .catch((err: any) => {
      console.error(err);
      toast.error(err.message || "Greška pri kreiranju posta");
    });
};


const fetchDevices = async () => {
   if (!token) return;
   apiClient<DeviceDTO[]>(ENDPOINTS.DEVICE.FEED, 'GET', null, token)
     .then((data) =>{
      setDevices(data);
    })
     .catch ((err:any) => { 
      console.error(err); 
      toast.error(err);
     // setMessage(err.message);
    })
  };

const resetForm = () => {
  setMessage('');
  setNewDeviceName('');
  setNewSerialNumber('');
  setNewDeviceType('');
};

return {
    handleCreateDevice, newSerialNumber, setNewSerialNumber, newDeviceName, setNewDeviceName, newDeviceType, setNewDeviceType
,message,setMessage, resetForm, fetchDevices, setDevices, devices
};

};
  