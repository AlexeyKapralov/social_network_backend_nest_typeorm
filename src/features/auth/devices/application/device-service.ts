import { Injectable } from '@nestjs/common';
import { Device } from '../domain/device-entity';
import { DeviceRepository } from '../infrastructure/device-repository';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../base/models/interlayer';

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
        const notice = new InterlayerNotice<Device | null>();

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
            notice.addData(device);
            return notice;
        }

        const updatedDevice = await this.deviceRepository.updateDevice(
            isExistDevice.id,
            exp,
            iat,
        );
        if (!updatedDevice) {
            notice.addError('device did not update');
        }
        notice.addData(updatedDevice);
        return notice;
    }

    /*
     * проверка на то, валидный ли девайс
     * @param {string} deviceId - uuid в строке
     * @param {number} iat - дата
     * */
    async checkDeviceExpiration(deviceId: string, iat: Date) {
        const notice = new InterlayerNotice();

        const device = await this.deviceRepository.findDeviceByIdAndIat(
            deviceId,
            iat,
        );
        if (!device) {
            notice.addError(
                'device not found',
                'device',
                InterlayerStatuses.NOT_FOUND,
            );
        }

        return notice;
    }

    /**
     * обновит существующий девайс
     * **/
    async updateDevice(
        deviceId: string,
        exp: Date,
        iat: Date,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const isUpdated = await this.deviceRepository.updateDevice(
            deviceId,
            iat,
            exp,
        );
        if (!isUpdated) {
            notice.addError('device did not update');
            return notice;
        }
        return notice;
    }

    async deleteDevice(
        deviceId: string,
        deviceIdFromToken: string,
    ): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();

        const deviceByToken =
            await this.deviceRepository.findDeviceById(deviceIdFromToken);
        if (!deviceByToken) {
            notice.addError(
                'device was not found',
                'device',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }
        const device = await this.deviceRepository.findDeviceById(deviceId);
        if (!device) {
            notice.addError(
                'device was not found',
                'device',
                InterlayerStatuses.NOT_FOUND,
            );
            return notice;
        }
        if (device.userId !== deviceByToken.userId) {
            notice.addError(
                'user is not owner for device',
                'user',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const newDate = new Date(Math.trunc(Date.now() / 1000) * 1000);

        await this.deviceRepository.updateDevice(deviceId, newDate, newDate);

        return notice;
    }
}
