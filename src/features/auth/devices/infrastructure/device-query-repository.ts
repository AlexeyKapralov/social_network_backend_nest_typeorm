import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, LessThan, MoreThan } from 'typeorm';
import { Device } from '../domain/device-entity';
import { DeviceViewDto } from '../api/output/device-view-dto';
import { toDeviceDtoMapper } from '../../../../base/mappers/device-mapper';

@Injectable()
export class DeviceQueryRepository {
    constructor(@InjectDataSource() private dataSource: DataSource) {}

    async findDeviceByIdAndIat(
        deviceId: string,
        iat: Date,
    ): Promise<DeviceViewDto> {
        const deviceRepository = this.dataSource.getRepository(Device);

        const device = await deviceRepository.findOne({
            where: {
                id: deviceId,
                iat: iat,
            },
        });

        return toDeviceDtoMapper(device);
    }

    async findDeviceById(deviceId: string): Promise<DeviceViewDto> {
        const deviceRepository = this.dataSource.getRepository(Device);

        const device = await deviceRepository.findOne({
            where: {
                id: deviceId,
            },
        });

        return toDeviceDtoMapper(device);
    }

    async findAllDevices(deviceId: string): Promise<DeviceViewDto[]> {
        const deviceRepository = this.dataSource.getRepository(Device);

        const deviceUserId = await deviceRepository.findOne({
            select: {
                userId: true,
            },
            where: {
                id: deviceId,
                exp: MoreThan(new Date()),
            },
        });
        if (!deviceUserId) {
            return [];
        }

        const devices = await deviceRepository.find({
            select: {
                ip: true,
                deviceName: true,
                iat: true,
                id: true,
            },
            where: {
                userId: deviceUserId.userId,
                exp: MoreThan(new Date()),
            },
        });
        return devices.map((d) => {
            return toDeviceDtoMapper(d);
        });
    }
}
