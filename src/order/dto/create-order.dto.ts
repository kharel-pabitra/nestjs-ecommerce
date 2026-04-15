import {
  IsArray,
  IsNotEmpty,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductsDto)
  orderItems: OrderProductsDto[];
}
export class OrderProductsDto {
  @IsUUID()
  @IsNotEmpty()
  product: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
