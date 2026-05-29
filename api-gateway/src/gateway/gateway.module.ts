import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GatewayService } from './gateway.service';

@Module({
  imports: [ConfigModule],
  providers: [GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}
