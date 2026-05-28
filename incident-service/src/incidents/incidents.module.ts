import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IncidentsService } from './incidents.service';
import { IncidentsResolver } from './incidents.resolver';
import { Incident } from './incident.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { pubSubProvider } from './pub-sub.provider';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incident]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'traffic_jwt_secret_2024'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [IncidentsService, IncidentsResolver, JwtAuthGuard, pubSubProvider],
})
export class IncidentsModule {}
