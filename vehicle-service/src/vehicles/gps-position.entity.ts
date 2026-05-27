import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

@ObjectType()
@Entity('gps_positions')
export class GpsPosition {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  vehicleId: string;

  @ManyToOne(() => Vehicle, (v) => v.positions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicleId' })
  vehicle: Vehicle;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 7, transformer: { to: (v: number) => v, from: (v: string) => Number.parseFloat(v) } })
  latitude: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 7, transformer: { to: (v: number) => v, from: (v: string) => Number.parseFloat(v) } })
  longitude: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  speed: number;

  @Field()
  @CreateDateColumn()
  timestamp: Date;
}
