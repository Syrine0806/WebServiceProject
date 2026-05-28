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

export enum IncidentType {
  ACCIDENT = 'ACCIDENT',
  CONSTRUCTION = 'CONSTRUCTION',
  ROAD_CLOSED = 'ROAD_CLOSED',
  TRAFFIC_JAM = 'TRAFFIC_JAM',
}

export enum IncidentStatus {
  REPORTED = 'REPORTED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}

registerEnumType(IncidentType, {
  name: 'IncidentType',
  description: 'Type of traffic incident',
});

registerEnumType(IncidentStatus, {
  name: 'IncidentStatus',
  description: 'Current status of the incident',
});

@ObjectType()
@Entity('incidents')
export class Incident {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => IncidentType)
  @Column({ type: 'enum', enum: IncidentType })
  type: IncidentType;

  @Field(() => IncidentStatus)
  @Column({
    type: 'enum',
    enum: IncidentStatus,
    default: IncidentStatus.REPORTED,
  })
  status: IncidentStatus;

  @Field()
  @Column()
  description: string;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 7, transformer: { to: (v: number) => v, from: (v: string) => Number.parseFloat(v) } })
  latitude: number;

  @Field(() => Float)
  @Column('decimal', { precision: 10, scale: 7, transformer: { to: (v: number) => v, from: (v: string) => Number.parseFloat(v) } })
  longitude: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  vehicleId: string | null;

  @Field({ nullable: true })
  @Column({ nullable: true })
  reportedBy: string | null;

  @Field({ nullable: true })
  @Column({ nullable: true })
  resolvedAt: Date | null;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
