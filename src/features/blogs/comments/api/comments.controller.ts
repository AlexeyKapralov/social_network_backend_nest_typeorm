import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Put,
    Req,
    UnauthorizedException,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/auth/guards/jwt-auth-guard';
import { AccessTokenPayloadDto } from '../../../../common/dto/access-token-payload-dto';
import { CommentsService } from '../application/comments.service';
import { CommentInputDto } from './dto/input/comment-input.dto';
import { InterlayerStatuses } from '../../../../base/models/interlayer';
import { LikeInputDto } from '../../likes/api/dto/input/like-input.dto';
import { ValidateOptionalJwtGuard } from '../../../auth/auth/guards/validate-optional-jwt-guard.service';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @UseGuards(ValidateOptionalJwtGuard)
    @Get(':commentId')
    async getOneComment(
        @Req() req: any,
        @Param('commentId') commentId: string,
    ) {
        let userId: string;
        if (req.user) {
            if (req.user.userId) {
                userId = req.user.userId;
            }
        }

        const createCommentInterlayer =
            await this.commentsService.findOneComment(commentId, userId);
        if (createCommentInterlayer.hasError()) {
            throw new NotFoundException();
        }
        return createCommentInterlayer.data;
    }

    @UseGuards(JwtAuthGuard)
    @Put(':commentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateComment(
        @Req() req: any,
        @Param('commentId') commentId: string,
        @Body() commentInputDto: CommentInputDto,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        const createCommentInterlayer =
            await this.commentsService.updateComment(
                commentInputDto,
                commentId,
                accessTokenPayload.userId,
            );
        if (createCommentInterlayer.code === InterlayerStatuses.NOT_FOUND) {
            throw new NotFoundException();
        }
        if (createCommentInterlayer.code === InterlayerStatuses.FORBIDDEN) {
            throw new ForbiddenException();
        }
        if (createCommentInterlayer.code === InterlayerStatuses.BAD_REQUEST) {
            throw new BadRequestException();
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':commentId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteComment(
        @Req() req: any,
        @Param('commentId') commentId: string,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        const createCommentInterlayer =
            await this.commentsService.deleteComment(
                commentId,
                accessTokenPayload.userId,
            );
        if (createCommentInterlayer.code === InterlayerStatuses.NOT_FOUND) {
            throw new NotFoundException();
        }
        if (createCommentInterlayer.code === InterlayerStatuses.FORBIDDEN) {
            throw new ForbiddenException();
        }
        if (createCommentInterlayer.code === InterlayerStatuses.BAD_REQUEST) {
            throw new BadRequestException();
        }
    }

    @UseGuards(JwtAuthGuard)
    @Put(':commentId/like-status')
    @HttpCode(HttpStatus.NO_CONTENT)
    async updateLikeStatus(
        @Req() req: any,
        @Param('commentId') commentId: string,
        @Body() likeInputDto: LikeInputDto,
    ) {
        const accessTokenPayload: AccessTokenPayloadDto = req.user.payload;
        if (!accessTokenPayload.userId) {
            throw new UnauthorizedException();
        }

        const updateLikeStatusInterlayer =
            await this.commentsService.updateLikeStatus(
                commentId,
                accessTokenPayload.userId,
                likeInputDto,
            );

        if (updateLikeStatusInterlayer.hasError()) {
            throw new NotFoundException();
        }
    }
}
