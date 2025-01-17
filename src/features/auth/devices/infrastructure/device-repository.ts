import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, MoreThan, Not } from 'typeorm';
import { Device } from '../domain/device-entity';

@Injectable()
export class DeviceRepository {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

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
    ): Promise<Device | null> {
        const deviceRepository = this.dataSource.getRepository(Device);
        const device = await deviceRepository.findOne({
            where: { id: deviceId },
        });
        if (!device) {
            return null;
        }
        device.exp = exp;
        device.iat = iat;
        await deviceRepository.save(device);
        return device;
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

    async findDeviceByIdAndIat(
        deviceId: string,
        iat: Date,
    ): Promise<Device | null> {
        const deviceRepository = this.dataSource.getRepository(Device);

        return await deviceRepository.findOne({
            where: {
                id: deviceId,
                iat: iat,
            },
        });
    }

    async findDeviceById(deviceId: string): Promise<Device> {
        const deviceRepository = this.dataSource.getRepository(Device);

        return await deviceRepository.findOne({
            where: {
                id: deviceId,
                exp: MoreThan(new Date()),
            },
        });
    }

    async deleteAllDevicesForUser(
        userId: string,
        currentDeviceId: string,
    ): Promise<boolean> {
        const newDate = new Date();
        const deviceRepository = await this.dataSource
            .getRepository(Device)
            .update(
                {
                    userId: userId,
                    id: Not(currentDeviceId),
                },
                {
                    iat: newDate,
                    exp: newDate,
                },
            );
        return deviceRepository.affected > 0;
    }

    async deleteDevicesByUserId(userId: string): Promise<boolean> {
        const deviceRepository = this.dataSource.getRepository(Device);

        try {
            await deviceRepository.update(
                {
                    userId: userId,
                    exp: MoreThan(new Date()),
                },
                {
                    exp: new Date(),
                },
            );
            return true;
        } catch (e) {
            console.error('deleteDeviceByUserId error', e);
            return false;
        }
    }
}
