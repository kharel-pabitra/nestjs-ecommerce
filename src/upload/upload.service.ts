import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UploadFileDto } from './dto/upload-file.dto';

@Injectable()
export class UploadService {
  private bucketUrl = process.env.S3_BUCKET_URL || 'https://mock-bucket.com';

  /**
   * Generate unique file path
   */
  private generateFileKey(type: 'avatar' | 'product'): string {
    const id = randomUUID();

    switch (type) {
      case 'avatar':
        return `users/avatar/${id}.jpg`;

      case 'product':
        return `products/images/${id}.jpg`;

      default:
        return `misc/${id}.jpg`;
    }
  }

  /**
   * Generate upload URLs (S3-ready design)
   */
  //   async generateUploadUrls(dto: { type: 'avatar' | 'product'; count: number }) {
  generateUploadUrls(dto: UploadFileDto) {
    const { type, count } = dto;

    const uploadUrls: string[] = [];
    const fileUrls: string[] = [];

    for (let i = 0; i < count; i++) {
      const key = this.generateFileKey(type);

      // const uploadUrl = await this.s3.getSignedUrl(...)
      const uploadUrl = `${this.bucketUrl}/upload/${key}`;

      const fileUrl = `${this.bucketUrl}/${key}`;

      uploadUrls.push(uploadUrl);
      fileUrls.push(fileUrl);
    }

    return {
      uploadUrls,
      fileUrls,
    };
  }
}
