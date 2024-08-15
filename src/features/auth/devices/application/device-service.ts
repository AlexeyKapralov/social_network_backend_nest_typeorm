import { Injectable } from '@nestjs/common';
import { Device } from '../domain/device-entity';
import { DeviceRepository } from '../infrastructure/device-repository';
import { InterlayerNotice } from '../../../../base/models/interlayer';

@Injectable()
export class DeviceService {
    constructor(private deviceRepository: DeviceRepository) {}
    async createDeviceOrUpdate(
        userId: string,
        deviceName: string,
        ip: string,
        exp: Date,
        iat: Date,
    ): Promise<InterlayerNotice<Device>> {
        const notice = new InterlayerNotice<Device>();

        const isExistDevice = await this.deviceRepository.findDevice(
            userId,
            deviceName,
            ip,
        );
        if (!isExistDevice) {
            const device = await this.deviceRepository.createDevice(
                userId,
                deviceName,
                ip,
                exp,
                iat,
            );
            if (!device) {
                notice.addError('device did not create');
            }
            return notice;
        }

        const isUpdateDevice = await this.deviceRepository.updateDevice(
            isExistDevice.id,
            exp,
            iat,
        );
        if (!isUpdateDevice) {
            notice.addError('device did not update');
        }
        return notice;
    }
}
