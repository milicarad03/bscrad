import { useState } from 'react';
import type { DeviceDTO } from '../models/device.dto';

export const useDeviceFilters = (devices: DeviceDTO[]) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDevices = devices.filter(dev => {
    const term = searchTerm.toLowerCase();
    return (
      dev.name?.toLowerCase().includes(term) ||
      dev.type.toLowerCase().includes(term) ||
      dev.serialNumber.toLowerCase().includes(term) ||
      dev.user?.email?.toLowerCase().includes(term)
    );
  });

  return { searchTerm, setSearchTerm, filteredDevices };
};