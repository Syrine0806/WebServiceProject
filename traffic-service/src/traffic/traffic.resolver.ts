import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TrafficService } from './traffic.service';
import { TrafficZone } from './traffic-zone.entity';
import { CreateZoneInput } from './dto/create-zone.input';
import { UpdateDensityInput } from './dto/update-density.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver(() => TrafficZone)
@UseGuards(JwtAuthGuard)
export class TrafficResolver {
  constructor(private trafficService: TrafficService) {}

  @Mutation(() => TrafficZone, { description: 'Create a new traffic zone' })
  async createTrafficZone(
    @Args('input') input: CreateZoneInput,
  ): Promise<TrafficZone> {
    return this.trafficService.createZone(input);
  }

  @Query(() => [TrafficZone], { description: 'Get all traffic zones' })
  async trafficZones(): Promise<TrafficZone[]> {
    return this.trafficService.findAll();
  }

  @Query(() => TrafficZone, { description: 'Get traffic zone by ID' })
  async trafficZone(@Args('id') id: string): Promise<TrafficZone> {
    return this.trafficService.findOne(id);
  }

  @Mutation(() => TrafficZone, { description: 'Update traffic density for a zone' })
  async updateTrafficDensity(
    @Args('input') input: UpdateDensityInput,
  ): Promise<TrafficZone> {
    return this.trafficService.updateDensity(input);
  }

  @Query(() => [TrafficZone], { description: 'Get all high-congestion zones' })
  async congestedZones(): Promise<TrafficZone[]> {
    return this.trafficService.getCongestedZones();
  }
}
