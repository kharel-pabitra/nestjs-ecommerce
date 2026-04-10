import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Product name is too short' })
  @MaxLength(500, { message: 'Product name is too long' })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Units in stock must be a number' })
  @Min(0, { message: 'Units in stock cannot be negative' })
  unitsInStock?: number;
}
