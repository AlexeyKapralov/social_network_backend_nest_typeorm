import {
    BadGatewayException,
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import { BlogsService } from '../application/blogs-service';
import { BasicAuthGuard } from '../../auth/auth/guards/basic-auth-guard';
import { BlogInputDto } from './dto/input/blog-input-dto';

@Controller('sa/blogs')
export class BlogsSaController {
    constructor(private readonly blogService: BlogsService) {}

    @UseGuards(BasicAuthGuard)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createBlog(@Body() blogInputDto: BlogInputDto) {
        const createBlogInterlayer =
            await this.blogService.createBlog(blogInputDto);
        if (createBlogInterlayer.hasError()) {
            throw new BadGatewayException();
        }
        return createBlogInterlayer.data;
    }
}
