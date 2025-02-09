export class BlogImagesViewDto {
    wallpaper: PhotoSizeViewDto;
    main: PhotoSizeViewDto[];
}

export class PhotoSizeViewDto {
    url: string;
    width: number;
    height: number;
    fileSize: number;
}
