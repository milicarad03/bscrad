import { useState } from 'react';
import type {DeviceDTO} from '../models/device.dto'
import type {CreateDeviceDTO} from '../models/device.dto'
import {ENDPOINTS} from '../api/config.ts'
import {apiClient} from '../api/client.ts'
import { toast } from 'react-hot-toast';


export const useDevice = (token: string | null) => {
  // 1. STANJA (State)
  

  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('');
  const [loading, setLoading] = useState(false);
  const [myDevices, setMyDevices] = useState<DeviceDTO[]>([]);
  const [devices, setDevices] = useState<DeviceDTO[]>([]);
  const [message, setMessage] = useState('');
  const [selectedTargetUser, setSelectedTargetUser] = useState<string | number>('');


const handleCreateDevice = (e: React.SyntheticEvent) => {
  if (!token) return;
  e.preventDefault();
  setLoading(true);

  const dataCreateDevice: CreateDeviceDTO = {
    serialNumber: newSerialNumber,
    name: newDeviceName,
    type:newDeviceType,
    targetUserId: selectedTargetUser ? Number(selectedTargetUser) : undefined
  };

  apiClient<DeviceDTO>(ENDPOINTS.DEVICE.BASE, 'POST', dataCreateDevice, token)
    .then((newDeviceFromServer) => {
      setMessage(`Device "${newDeviceFromServer.name}" created successfully!`);
      setDevices(prev => [newDeviceFromServer, ...prev]);
      setNewDeviceName('');
      setNewSerialNumber('');
      setNewDeviceType('');
      setSelectedTargetUser('');
      
    })
    .catch((err: any) => {
      console.error(err);
      toast.error(err.message || "Error creating device");
    })
     .finally(() => {
        setLoading(false);
      });
};


  const fetchDevices = async (filters?: { status?: string; type?: string; own?: boolean }) => {
    if (!token) return;
    setLoading(true);

    
    apiClient<DeviceDTO[]>(ENDPOINTS.DEVICE.BASE, 'GET', null, token, filters)
      .then((data) => {
        setDevices(data);
      })
      .catch((err: any) => {
        toast.error(err.message || "Failed to fetch devices");
      })
      .finally(() => setLoading(false));
  };


  const handleDeleteDevice = (id:  string) => {
    apiClient(ENDPOINTS.DEVICE.DELETE(id), 'DELETE', null, token)
        .then(() => {
            toast.success("Device deleted");
            setDevices(prev => prev.filter(u => u.id !== id));
        })
        .catch(err => toast.error(err.message));
};
const resetForm = () => {
  setMessage('');
  setNewDeviceName('');
  setNewSerialNumber('');
  setNewDeviceType('');
};

return {
    handleCreateDevice, newSerialNumber, setNewSerialNumber, newDeviceName, setNewDeviceName, newDeviceType, setNewDeviceType
,message,setMessage, resetForm, fetchDevices, setDevices, devices,loading, myDevices, setMyDevices, selectedTargetUser, setSelectedTargetUser, handleDeleteDevice
};

};
  