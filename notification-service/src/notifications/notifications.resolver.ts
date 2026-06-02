import { Resolver, Query, Mutation, Args, Int, Subscription, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Notification } from './notification.entity';
import { SendNotificationInput } from './dto/send-notification.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver(() => Notification)
export class NotificationsResolver {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Mutation(() => Notification, { description: 'Send a notification to a user' })
  @UseGuards(JwtAuthGuard)
  async sendNotification(
    @Args('input') input: SendNotificationInput,
  ): Promise<Notification> {
    return this.notificationsService.send(input);
  }

  @Query(() => [Notification], { description: 'Get all notifications' })
  @UseGuards(JwtAuthGuard)
  async notifications(): Promise<Notification[]> {
    return this.notificationsService.findAll();
  }

  @Query(() => [Notification], { description: 'Get notifications for the authenticated user' })
  @UseGuards(JwtAuthGuard)
  async myNotifications(
    @Context() ctx: any,
  ): Promise<Notification[]> {
    const userId = ctx.req.user?.sub;
    return this.notificationsService.findByUser(userId);
  }

  @Mutation(() => Notification, { description: 'Mark a notification as read' })
  @UseGuards(JwtAuthGuard)
  async markNotificationAsRead(@Args('id') id: string): Promise<Notification> {
    return this.notificationsService.markAsRead(id);
  }

  @Mutation(() => Int, { description: 'Mark all notifications as read for the authenticated user' })
  @UseGuards(JwtAuthGuard)
  async markAllNotificationsAsRead(
    @Context() ctx: any,
  ): Promise<number> {
    const userId = ctx.req.user?.sub;
    return this.notificationsService.markAllAsRead(userId);
  }

  // ─── WebSocket Subscription (no auth guard — read-only, demo purpose) ──────
  @Subscription(() => Notification, {
    description: 'Receive new notifications in real-time via WebSocket',
  })
  notificationAdded() {
    return this.notificationsService.getNotificationAddedIterator();
  }
}
