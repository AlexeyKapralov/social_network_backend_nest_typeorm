import { Blog } from '../../features/blogs/blogs/domain/blog-entity';
import { BlogViewDto } from '../../features/blogs/blogs/api/dto/output/blog-view-dto';
import { PhotoSizeViewDto } from '../../features/blogs/blogs/api/dto/output/post-images-view.dto';
import { FileTypeEnum } from '../../features/files/api/enum/file-type.enum';
import { File } from '../../features/files/domain/s3-storage.entity';

export const blogViewDtoMapper = (
    blog: Blog,
    files: Pick<
        File,
        'fileKey' | 'fileSize' | 'height' | 'width' | 'typeFile'
    >[],
): BlogViewDto => {
    const mainArr: PhotoSizeViewDto[] = [];
    let wallpaper: PhotoSizeViewDto = null;

    if (!files.length) {
        return {
            id: blog.id,
            name: blog.name,
            createdAt: blog.createdAt.toISOString(),
            description: blog.description,
            isMembership: blog.isMembership,
            websiteUrl: blog.websiteUrl,
            images: {
                main: mainArr,
                wallpaper: wallpaper,
            },
        };
    }

    files.forEach((file) => {
        if (file.typeFile === FileTypeEnum.wallpaper) {
            const wallpaperMapped: PhotoSizeViewDto = {
                fileSize: Number(file.fileSize),
                url: file.fileKey,
                width: Number(file.width),
                height: Number(file.height),
            };
            wallpaper = wallpaperMapped;
        } else if (file.typeFile === FileTypeEnum.main) {
            const mainMapped: PhotoSizeViewDto = {
                fileSize: Number(file.fileSize),
                url: file.fileKey,
                width: Number(file.width),
                height: Number(file.height),
            };
            mainArr.push(mainMapped);
        }
    });

    console.log('files', files);
    console.log('wallpaper', wallpaper);

    return {
        id: blog.id,
        name: blog.name,
        createdAt: blog.createdAt.toISOString(),
        description: blog.description,
        isMembership: blog.isMembership,
        websiteUrl: blog.websiteUrl,
        images: {
            main: mainArr,
            wallpaper: wallpaper,
        },
    };
};
