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
} from 'typeorm';

export enum NotificationType {
  INCIDENT = 'INCIDENT',
  TRAFFIC = 'TRAFFIC',
  SYSTEM = 'SYSTEM',
  ALERT = 'ALERT',
}

registerEnumType(NotificationType, {
  name: 'NotificationType',
  description: 'Type of notification',
});

@ObjectType()
@Entity('notifications')
export class Notification {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  userId: string;

  @Field()
  @Column()
  message: string;

  @Field(() => NotificationType)
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Field()
  @Column({ default: false })
  isRead: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  referenceId: string | null;

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
