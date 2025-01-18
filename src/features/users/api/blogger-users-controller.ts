import {
    Body,
    Controller,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Put,
    Query,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { QueryDtoWithLogin } from '../../../common/dto/query-dto';
import { ValidateJwtGuard } from '../../auth/auth/guards/validate-jwt-guard';
import { BanUserForSpecificBlogInputDto } from './dto/input/ban-user-input-dto';
import { AccessTokenPayloadDto } from '../../../common/dto/access-token-payload-dto';
import {
    InterlayerNotice,
    InterlayerStatuses,
} from '../../../base/models/interlayer';
import { UsersService } from '../application/users-service';

@Controller('blogger/users')
export class BloggerUsersController {
    constructor(private readonly usersService: UsersService) {}

    @UseGuards(ValidateJwtGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Put(':userId/ban')
    async banUser(
        @Req() req: any,
        @Param('userId', ParseUUIDPipe) userId: string,
        @Body() banUserForSpecificBlogInputDto: BanUserForSpecificBlogInputDto,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        if (accessTokenPayload.userId === userId) {
            throw new ForbiddenException();
        }

        const interlayerBanUser: InterlayerNotice =
            await this.usersService.banUserForSpecificBlog(
                accessTokenPayload.userId,
                userId,
                banUserForSpecificBlogInputDto,
            );

        if (interlayerBanUser.hasError()) {
            if (
                interlayerBanUser.extensions[0].code ===
                InterlayerStatuses.FORBIDDEN
            ) {
                throw new ForbiddenException();
            }
            console.log(interlayerBanUser.extensions);
            throw new NotFoundException();
        }
    }

    @UseGuards(ValidateJwtGuard)
    @Get('blog/:blogId')
    @HttpCode(HttpStatus.OK)
    async getBannedUsersForBlog(
        @Req() req: any,
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Query() queryUsers: QueryDtoWithLogin,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        const bannedUsersInterlayer = await this.usersService.findBannedUsers(
            queryUsers,
            blogId,
            accessTokenPayload.userId,
        );
        if (bannedUsersInterlayer.hasError()) {
            if (
                bannedUsersInterlayer.extensions[0].code ===
                InterlayerStatuses.NOT_FOUND
            ) {
                throw new NotFoundException();
            }
            if (
                bannedUsersInterlayer.extensions[0].code ===
                InterlayerStatuses.FORBIDDEN
            ) {
                throw new ForbiddenException();
            }
        }
        return bannedUsersInterlayer.data;
    }
}
