import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GraphQLSchema, buildSchema } from 'graphql';
import { stitchSchemas } from '@graphql-tools/stitch';
import { loadSchema } from '@graphql-tools/load';
import { UrlLoader } from '@graphql-tools/url-loader';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private buildPromise: Promise<GraphQLSchema> | null = null;

  constructor(private readonly configService: ConfigService) {}

  buildSchema(): Promise<GraphQLSchema> {
    if (!this.buildPromise) this.buildPromise = this.doBuild();
    return this.buildPromise;
  }

  private async doBuild(): Promise<GraphQLSchema> {

    const services = [
      {
        name: 'auth',
        url: this.configService.get(
          'AUTH_SERVICE_URL',
          'http://auth-service:3001/graphql',
        ),
      },
      {
        name: 'vehicle',
        url: this.configService.get(
          'VEHICLE_SERVICE_URL',
          'http://vehicle-service:3002/graphql',
        ),
      },
      {
        name: 'traffic',
        url: this.configService.get(
          'TRAFFIC_SERVICE_URL',
          'http://traffic-service:3003/graphql',
        ),
      },
      {
        name: 'incident',
        url: this.configService.get(
          'INCIDENT_SERVICE_URL',
          'http://incident-service:3004/graphql',
        ),
      },
      {
        name: 'notification',
        url: this.configService.get(
          'NOTIFICATION_SERVICE_URL',
          'http://notification-service:3005/graphql',
        ),
      },
    ];

    const subschemas = await Promise.all(
      services.map(async (service) => {
        try {
          const schema = await loadSchema(service.url, {
            loaders: [new UrlLoader()],
          });
          this.logger.log(`Loaded schema from ${service.name} service`);
          return { schema };
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : JSON.stringify(err);
          this.logger.warn(
            `Could not load schema from ${service.name} (${service.url}): ${message}`,
          );
          return null;
        }
      }),
    );

    const validSubschemas = subschemas.filter(Boolean);

    if (validSubschemas.length === 0) {
      this.logger.warn('No services available — using fallback schema');
      return buildSchema(`
        type Query {
          status: String
        }
      `);
    }

    this.logger.log(
      `Stitched ${validSubschemas.length}/${services.length} subschemas`,
    );
    return stitchSchemas({ subschemas: validSubschemas });
  }
}
