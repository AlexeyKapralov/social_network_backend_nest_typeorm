export class PostImagesViewDto {
    main: PhotoSizeViewDto[];
}

export class PhotoSizeViewDto {
    url: string;
    width: number;
    height: number;
    fileSize: number;
}
