import { BlogImagesViewDto } from './blog-images-view.dto';

export class BlogViewDto {
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
    createdAt: string;
    isMembership: boolean;
    images: BlogImagesViewDto;
}
