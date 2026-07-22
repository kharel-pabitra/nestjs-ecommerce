import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { RemoveImagesDto } from './dto/remove-images.dto';
import { AddImagesDto } from './dto/add-images.dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);

    const savedProduct = await this.productRepository.save(product);

    this.logger.log(`Product created: ${savedProduct.id}`);

    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      this.logger.warn(`Product not found: ${id}`);
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

    const updatedProduct = await this.productRepository.save(product);

    this.logger.log(`Product updated: ${updatedProduct.id}`);

    return updatedProduct;
  }

  async addImages(id: string, addImagesDto: AddImagesDto) {
    const images = addImagesDto.images;

    const product = await this.findOne(id);

    product.images = [...(product.images || []), ...images];

    const savedProduct = await this.productRepository.save(product);

    this.logger.log(`Added ${images.length} images to product ${id}`);

    return savedProduct;
  }
  async remove(id: string): Promise<{ message: string }> {
    const product = await this.findOne(id);

    await this.productRepository.remove(product);

    this.logger.log(`Product deleted: ${id}`);

    return { message: 'Product deleted successfully' };
  }

  async removeImages(productId: string, removeImagesDto: RemoveImagesDto) {
    const imagesToRemove = removeImagesDto.images;

    if (imagesToRemove.length === 0) {
      this.logger.warn(
        `Remove images failed. No images provided for product ${productId}`,
      );
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

    this.logger.log(
      `Removed ${removed.length} images from product ${productId}`,
    );

    return {
      removed,
      notFound,
      product,
    };
  }
}
