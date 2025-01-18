import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import { RefreshTokenPayloadDto } from '../../../../../common/dto/refresh-token-payload-dto';
import { InterlayerNotice } from '../../../../../base/models/interlayer';
import { DeviceRepository } from '../../infrastructure/device-repository';

export class DeleteDevicesCommand implements ICommand {
    constructor(public refreshTokenPayloadDto: RefreshTokenPayloadDto) {}
}

@CommandHandler(DeleteDevicesCommand)
export class DeleteDevicesUseCase
    implements ICommandHandler<DeleteDevicesCommand, InterlayerNotice>
{
    constructor(private readonly deviceRepository: DeviceRepository) {}

    async execute(command: DeleteDevicesCommand): Promise<InterlayerNotice> {
        const notice = new InterlayerNotice();
        const { iat, deviceId } = command.refreshTokenPayloadDto;

        const device = await this.deviceRepository.findDeviceByIdAndIat(
            deviceId,
            iat,
        );
        if (!device) {
            notice.addError('device was not found');
            return notice;
        }
        const isDevicesDeleted =
            await this.deviceRepository.deleteAllDevicesForUser(
                device.userId,
                deviceId,
            );
        if (!isDevicesDeleted) {
            notice.addError('devices were not deleted');
            return notice;
        }

        return notice;
    }
}
