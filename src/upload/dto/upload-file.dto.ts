import { IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';

export enum UploadType {
  AVATAR = 'avatar',
  PRODUCT = 'product',
}

export class UploadFileDto {
  @IsNotEmpty()
  @IsEnum(UploadType)
  type: UploadType;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  count: number;
}
