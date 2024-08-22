import {
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth-guard';
import { DeviceQueryRepository } from '../infrastructure/device-query-repository';
import { RefreshTokenPayloadDto } from '../../../../common/dto/refresh-token-payload-dto';
import { DeleteDevicesCommand } from '../application/usecases/delete-devices-usecase';
import { CommandBus } from '@nestjs/cqrs';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../../base/models/interlayer';
import { DeviceService } from '../application/device-service';

@Controller('security')
export class DeviceController {
    constructor(
        private readonly deviceQueryRepository: DeviceQueryRepository,
        private readonly commandBus: CommandBus,
        private readonly deviceService: DeviceService,
    ) {}

    @UseGuards(JwtAuthGuard)
    @Get('devices')
    @HttpCode(HttpStatus.OK)
    async getDevicesForCurrentUser(@Req() req: any) {
        const refreshTokenPayload: RefreshTokenPayloadDto = req.user.payload;
        if (!refreshTokenPayload.deviceId) {
            throw new UnauthorizedException();
        }

        return await this.deviceQueryRepository.findAllDevices(
            refreshTokenPayload.deviceId,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Delete('devices')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteOtherDevicesForCurrentUser(@Req() req: any) {
        const refreshTokenPayload: RefreshTokenPayloadDto = req.user.payload;
        if (!refreshTokenPayload.deviceId) {
            throw new UnauthorizedException();
        }

        const command = new DeleteDevicesCommand(refreshTokenPayload);

        const deleteDevicesInterlayer = await this.commandBus.execute<
            DeleteDevicesCommand,
            InterlayerNotice
        >(command);
        if (deleteDevicesInterlayer.hasError()) {
            throw new UnauthorizedException();
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete('devices/:deviceId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteSpecificDevice(
        @Req() req: any,
        @Param('deviceId') deviceId: string,
    ) {
        const refreshTokenPayload: RefreshTokenPayloadDto = req.user.payload;
        if (!refreshTokenPayload.deviceId) {
            throw new UnauthorizedException();
        }

        const deviceInterlayer = await this.deviceService.deleteDevice(
            deviceId,
            refreshTokenPayload.deviceId,
        );
        if (deviceInterlayer.code === InterlayerStatuses.NOT_FOUND) {
            throw new NotFoundException();
        }
        if (deviceInterlayer.code === InterlayerStatuses.FORBIDDEN) {
            throw new ForbiddenException();
        }
    }
}
