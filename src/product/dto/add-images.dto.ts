import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class AddImagesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  images: string[];
}
