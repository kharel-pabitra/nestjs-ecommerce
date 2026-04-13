import { Module } from '@nestjs/common';
import { Product } from './product.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from 'src/order/orderItem.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, OrderItem])],
  providers: [ProductService],
  controllers: [ProductController],
})
export class ProductModule {}
