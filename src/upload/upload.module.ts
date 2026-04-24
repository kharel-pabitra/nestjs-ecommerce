import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UplaodController } from './upload.controller';

@Module({
  providers: [UploadService],
  controllers: [UplaodController],
})
export class UploadModule {}
