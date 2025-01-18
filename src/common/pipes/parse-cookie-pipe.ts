import {
    ArgumentMetadata,
    Injectable,
    PipeTransform,
    UnauthorizedException,
} from '@nestjs/common';
import { RefreshTokenPayloadDto } from '../dto/refresh-token-payload-dto';
import { JwtService } from '@nestjs/jwt';
import { DeviceService } from '../../features/auth/devices/application/device-service';

@Injectable()
export class ParseCookiePipe
    implements
        PipeTransform<
            { [key: string]: string },
            Promise<RefreshTokenPayloadDto>
        >
{
    constructor(
        private readonly jwtService: JwtService,
        private readonly deviceService: DeviceService,
    ) {}

    async transform(
        value: { [key: string]: string },
        metadata: ArgumentMetadata,
    ): Promise<RefreshTokenPayloadDto> {
        let refreshTokenPayload: RefreshTokenPayloadDto;
        try {
            refreshTokenPayload = this.jwtService.verify(value.refreshToken);
        } catch (e) {
            throw new UnauthorizedException();
        }

        if (!refreshTokenPayload) {
            throw new UnauthorizedException();
        }

        refreshTokenPayload.exp = new Date(
            Number(refreshTokenPayload.exp) * 1000,
        );
        refreshTokenPayload.iat = new Date(
            Number(refreshTokenPayload.iat) * 1000,
        );

        const checkingInterlayer =
            await this.deviceService.checkDeviceExpiration(
                refreshTokenPayload.deviceId,
                refreshTokenPayload.iat,
            );

        if (checkingInterlayer.hasError()) {
            throw new UnauthorizedException();
        }

        return refreshTokenPayload;
    }
}
