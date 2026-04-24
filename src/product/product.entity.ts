import { OrderItem } from 'src/order/orderItem.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 500 })
  name: string;

  @Column()
  price: number;

  @Column()
  unitsInStock: number;

  @Column({ default: 0 })
  unitsReserved: number;

  @Column('text', { array: true, default: [] })
  images: string[];

  @OneToMany(() => OrderItem, (item) => item.product)
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
