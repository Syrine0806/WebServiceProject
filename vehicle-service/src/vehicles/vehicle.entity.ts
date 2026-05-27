import {
  ObjectType,
  Field,
  ID,
  registerEnumType,
} from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { GpsPosition } from './gps-position.entity';

export enum VehicleType {
  CAR = 'CAR',
  TRUCK = 'TRUCK',
  MOTORCYCLE = 'MOTORCYCLE',
  BUS = 'BUS',
  EMERGENCY = 'EMERGENCY',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

registerEnumType(VehicleType, { name: 'VehicleType' });
registerEnumType(VehicleStatus, { name: 'VehicleStatus' });

@ObjectType()
@Entity('vehicles')
export class Vehicle {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  licensePlate: string;

  @Field()
  @Column()
  model: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  brand: string;

  @Field(() => VehicleType)
  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.CAR })
  type: VehicleType;

  @Field(() => VehicleStatus)
  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.ACTIVE })
  status: VehicleStatus;

  @Field({ nullable: true })
  @Column({ nullable: true })
  ownerId: string;

  @OneToMany(() => GpsPosition, (pos) => pos.vehicle, { eager: false })
  positions: GpsPosition[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
