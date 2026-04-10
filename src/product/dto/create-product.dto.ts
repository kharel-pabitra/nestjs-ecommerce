import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'Product name should not be empty' })
  @IsString()
  @MinLength(2, { message: 'Product name is too short' })
  @MaxLength(500, { message: 'Product name is too long' })
  name: string;

  @IsNotEmpty({ message: 'Price is required' })
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  price: number;

  @IsNotEmpty({ message: 'Units in stock is required' })
  @IsNumber({}, { message: 'Units in stock must be a number' })
  @Min(0, { message: 'Units in stock cannot be negative' })
  unitsInStock: number;
}
