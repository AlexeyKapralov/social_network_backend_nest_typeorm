import { CommandHandler, ICommand, ICommandHandler } from '@nestjs/cqrs';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../../base/models/interlayer';
import { RefreshTokenPayloadDto } from '../../../../../common/dto/refresh-token-payload-dto';
import { DeviceService } from '../../../devices/application/device-service';
import { AuthService } from '../auth-service';

export class RefreshTokensCommand implements ICommand {
    constructor(public refreshTokenPayload: RefreshTokenPayloadDto) {}
}

@CommandHandler(RefreshTokensCommand)
export class RefreshTokensUseCase
    implements
        ICommandHandler<
            RefreshTokensCommand,
            InterlayerNotice<RefreshTokensUseCaseResultType>
        >
{
    constructor(
        private deviceService: DeviceService,
        private authService: AuthService,
    ) {}

    async execute(
        command: RefreshTokensCommand,
    ): Promise<InterlayerNotice<RefreshTokensUseCaseResultType | null>> {
        const notice =
            new InterlayerNotice<RefreshTokensUseCaseResultType | null>();

        const iat = command.refreshTokenPayload.iat;

        const deviceId = command.refreshTokenPayload.deviceId;

        const checkDeviceExpirationInterLayer =
            await this.deviceService.checkDeviceExpiration(deviceId, iat);
        if (checkDeviceExpirationInterLayer.hasError()) {
            notice.addError(
                'device not found or already expired',
                'device',
                InterlayerStatuses.FORBIDDEN,
            );
            return notice;
        }

        const tokens = await this.authService.updateDevicesAndCreateTokens(
            '',
            '',
            '',
            deviceId,
        );
        if (!tokens) {
            notice.addError('tokens was not created');
            return notice;
        }

        notice.addData(tokens);

        return notice;
    }
}

export type RefreshTokensUseCaseResultType = {
    accessToken: string;
    refreshToken: string;
};
