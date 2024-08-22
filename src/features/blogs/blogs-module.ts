import { BlogsSaController } from './api/blogs-sa-controller';
import { Module } from '@nestjs/common';
import { BlogsService } from './application/blogs-service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Blog } from './domain/blog-entity';
import { BlogsRepository } from './infrastructure/blogs-repository';
import { BlogsQueryRepository } from './infrastructure/blogs-query-repository';

@Module({
    imports: [TypeOrmModule.forFeature([Blog])],
    controllers: [BlogsSaController],
    providers: [BlogsService, BlogsRepository, BlogsQueryRepository],
    exports: [BlogsService, BlogsQueryRepository],
})
export default class BlogsModule {}
