import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    Object.assign(product, updateProductDto);

    return this.productRepository.save(product);
  }

  async addImages(id: string, images: string[]) {
    const product = await this.findOne(id);

    product.images = [...(product.images || []), ...images];

    return this.productRepository.save(product);
  }
  async remove(id: string): Promise<{ message: string }> {
    const product = await this.findOne(id);

    await this.productRepository.remove(product);

    return { message: 'Product deleted successfully' };
  }

  async removeImages(productId: string, imagesToRemove: string[]) {
    if (!imagesToRemove.length) {
      throw new BadRequestException('No images provided');
    }

    const product = await this.findOne(productId);

    const existingImages = product.images || [];

    const removed: string[] = [];
    const notFound: string[] = [];

    for (const img of imagesToRemove) {
      if (existingImages.includes(img)) {
        removed.push(img);
      } else {
        notFound.push(img);
      }
    }

    product.images = existingImages.filter((img) => !removed.includes(img));

    await this.productRepository.save(product);

    return {
      removed,
      notFound,
      product,
    };
  }
}
