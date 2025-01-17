import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Put,
    Query,
    Req,
    UseGuards,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { QueryDtoWithLogin } from '../../../common/dto/query-dto';
import { ValidateJwtGuard } from '../../auth/auth/guards/validate-jwt-guard';
import { BloggerService } from '../../blogs/blogs/application/blogger-service';
import { BasicAuthGuard } from '../../auth/auth/guards/basic-auth-guard';
import { BanUserInputDto } from './dto/input/ban-user-input-dto';

@Controller('blogger/users')
export class BloggerController {
    constructor(
        private readonly bloggerService: BloggerService,
        private readonly queryBus: QueryBus,
    ) {}

    @UseGuards(ValidateJwtGuard)
    @UseGuards(BasicAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT)
    @Put(':userId/ban')
    async banUser(
        @Param('userId', ParseUUIDPipe) userId: string,
        @Body() banUserInputDto: BanUserInputDto,
    ) {
        // const interlayerBanUser = await this.userService.banUser(
        //     userId,
        //     banUserInputDto,
        // );
        //
        // if (interlayerBanUser.hasError()) {
        //     console.log(interlayerBanUser.extensions);
        //     throw new NotFoundException();
        // }
    }

    @UseGuards(ValidateJwtGuard)
    @Get(':blogId/posts')
    @HttpCode(HttpStatus.OK)
    async getBannedUsersForBlog(
        @Req() req: any,
        @Param('blogId', ParseUUIDPipe) blogId: string,
        @Query() query: QueryDtoWithLogin,
    ) {
        // const accessTokenPayload: AccessTokenPayloadDto = req.user;
        // if (!accessTokenPayload.userId) {
        //     throw new UnauthorizedException();
        // }
        // const queryPayload = new GetPostsForBlogPayload(query, blogId);
        // const posts = await this.queryBus.execute<
        //     GetPostsForBlogPayload,
        //     GetPostsResultType
        // >(queryPayload);
        // if (!posts) {
        //     throw new NotFoundException();
        // }
        // return posts;
    }
}
