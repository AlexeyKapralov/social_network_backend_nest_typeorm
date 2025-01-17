import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from '../application/users-service';
import { UserInputDto } from './dto/input/user-input-dto';
import { AuthGuard } from '@nestjs/passport';
import { BasicAuthGuard } from '../../auth/auth/guards/basic-auth-guard';
import { QueryDtoWithEmailLogin } from '../../../common/dto/query-dto';
import { BanUserInputDto } from './dto/input/ban-user-input-dto';

@Controller('sa/users')
export class UsersSaController {
    constructor(private readonly userService: UsersService) {}

    //можно так, а можно создать отдельный guard, который implement этот AuthGuard: @UseGuards(BasicAuthGuard)
    @UseGuards(AuthGuard('basic'))
    // @UseInterceptors(ClassSerializerInterceptor)//можно использовать для отдельного контроллера, а также это можно для всего приложения в main.ts
    @Post()
    async createUser(@Body() userBody: UserInputDto) {
        const createdUserInterlayer =
            await this.userService.createUser(userBody);

        if (createdUserInterlayer.hasError()) {
            throw new BadRequestException(
                createdUserInterlayer.extensions.map((error) => {
                    return {
                        message: error.message,
                        field: error.key,
                    };
                }),
            );
        }

        return createdUserInterlayer.data;
    }

    @UseGuards(BasicAuthGuard)
    // @UseInterceptors(ClassSerializerInterceptor)//можно использовать для отдельного контроллера, а также это можно для всего приложения в main.ts
    @Get()
    async findUsers(@Query() queryUsers: QueryDtoWithEmailLogin) {
        const interLayerFindUsers =
            await this.userService.findUsers(queryUsers);

        return interLayerFindUsers.data;
    }

    @UseGuards(BasicAuthGuard)
    // @UseInterceptors(ClassSerializerInterceptor)//можно использовать для отдельного контроллера, а также это можно для всего приложения в main.ts
    @HttpCode(HttpStatus.NO_CONTENT)
    @Delete(':userId')
    async deleteUser(@Param('userId', ParseUUIDPipe) userId: string) {
        const interlayerDeletedUser = await this.userService.deleteUser(userId);

        if (interlayerDeletedUser.hasError()) {
            throw new NotFoundException();
        }
    }

    @UseGuards(BasicAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Post(':userId/ban')
    async banUser(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Body() banUserInputDto: BanUserInputDto,
    ) {
        const interlayerBanUser = await this.userService.banUser(
            userId,
            banUserInputDto,
        );

        if (interlayerBanUser.hasError()) {
            throw new NotFoundException();
        }
    }
}
