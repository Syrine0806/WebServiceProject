import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Notification } from './notification.entity';
import { SendNotificationInput } from './dto/send-notification.input';
import { PUB_SUB } from './pub-sub.provider';

export const NOTIFICATION_ADDED = 'notificationAdded';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async send(input: SendNotificationInput): Promise<Notification> {
    const notif = this.notifRepo.create(input);
    const saved = await this.notifRepo.save(notif);
    // Publish real-time event via WebSocket
    await this.pubSub.publish(NOTIFICATION_ADDED, { notificationAdded: saved });
    return saved;
  }

  async findAll(): Promise<Notification[]> {
    return this.notifRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Notification> {
    const notif = await this.notifRepo.findOne({ where: { id } });
    if (!notif) throw new NotFoundException(`Notification ${id} not found`);
    return notif;
  }

  async markAsRead(id: string): Promise<Notification> {
    const notif = await this.findOne(id);
    notif.isRead = true;
    return this.notifRepo.save(notif);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.notifRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
    return result.affected || 0;
  }

  getNotificationAddedIterator() {
    return this.pubSub.asyncIterator(NOTIFICATION_ADDED);
  }
}
