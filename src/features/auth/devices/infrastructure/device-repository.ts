import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Device } from '../domain/device-entity';

@Injectable()
export class DeviceRepository {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

    async createDevice(
        userId: string,
        deviceName: string,
        ip: string,
        exp: Date,
        iat: Date,
    ): Promise<Device> {
        const deviceRepository = this.dataSource.getRepository(Device);
        const device = new Device();

        device.userId = userId;
        device.deviceName = deviceName;
        device.exp = exp;
        device.ip = ip;
        device.iat = iat;
        await deviceRepository.save(device);
        return device;
    }

    async updateDevice(
        deviceId: string,
        exp: Date,
        iat: Date,
    ): Promise<boolean> {
        const deviceRepository = this.dataSource.getRepository(Device);
        const isUpdated = await deviceRepository.update(
            {
                id: deviceId,
            },
            {
                iat: iat,
                exp: exp,
            },
        );
        return isUpdated.affected === 1;
    }

    async findDevice(userId: string, deviceName: string, ip: string) {
        const deviceRepository = this.dataSource.getRepository(Device);

        return await deviceRepository.findOne({
            where: {
                userId: userId,
                deviceName: deviceName,
                ip: ip,
            },
        });
    }
}
