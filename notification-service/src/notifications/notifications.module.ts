import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsResolver } from './notifications.resolver';
import { Notification } from './notification.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pubSubProvider } from './pub-sub.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'traffic_jwt_secret_2024'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [NotificationsService, NotificationsResolver, JwtAuthGuard, pubSubProvider],
})
export class NotificationsModule {}
