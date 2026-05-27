import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { VehiclesService } from './vehicles.service';
import { VehiclesResolver } from './vehicles.resolver';
import { Vehicle } from './vehicle.entity';
import { GpsPosition } from './gps-position.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle, GpsPosition]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET', 'traffic_jwt_secret_2024'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [VehiclesService, VehiclesResolver, JwtAuthGuard],
})
export class VehiclesModule {}
