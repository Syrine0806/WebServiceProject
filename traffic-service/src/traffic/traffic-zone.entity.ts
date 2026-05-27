import {
  ObjectType,
  Field,
  ID,
  Float,
  registerEnumType,
} from '@nestjs/graphql';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CongestionLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

registerEnumType(CongestionLevel, {
  name: 'CongestionLevel',
  description: 'Traffic congestion classification',
});

@ObjectType()
@Entity('traffic_zones')
export class TrafficZone {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  description: string;

  private static readonly decimalTransformer = {
    to: (v: number) => v,
    from: (v: string) => Number.parseFloat(v),
  };

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 7, transformer: TrafficZone.decimalTransformer })
  latitude: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 7, transformer: TrafficZone.decimalTransformer })
  longitude: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 2, transformer: TrafficZone.decimalTransformer })
  radius: number;

  @Field()
  @Column({ default: 0 })
  vehicleCount: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 4, default: 0, transformer: TrafficZone.decimalTransformer })
  density: number;

  @Field(() => CongestionLevel)
  @Column({
    type: 'enum',
    enum: CongestionLevel,
    default: CongestionLevel.LOW,
  })
  congestionLevel: CongestionLevel;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
