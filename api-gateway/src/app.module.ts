import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GatewayModule } from './gateway/gateway.module';
import { GatewayService } from './gateway/gateway.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [GatewayModule],
      useFactory: async (gatewayService: GatewayService) => ({
        playground: process.env.NODE_ENV !== 'production',
        introspection: process.env.NODE_ENV !== 'production',
        schema: await gatewayService.buildSchema(),
        context: ({ req }) => ({ req }),
      }),
      inject: [GatewayService],
    }),
  ],
})
export class AppModule {}
