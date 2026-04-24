import { Body, Controller, Post } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadFileDto } from './dto/upload-file.dto';

@Controller('media')
export class UplaodController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload-url')
  generateUploadUrls(
    @Body()
    dto: UploadFileDto,
  ) {
    return this.uploadService.generateUploadUrls(dto);
  }
}
