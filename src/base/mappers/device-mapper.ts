import { Device } from '../../features/auth/devices/domain/device-entity';
import { DeviceViewDto } from '../../features/auth/devices/api/output/device-view-dto';

export const toDeviceDtoMapper = (device: Device): DeviceViewDto => {
    return {
        ip: device.ip,
        deviceId: device.id,
        lastActiveDate: device.iat,
        title: device.deviceName,
    };
};
