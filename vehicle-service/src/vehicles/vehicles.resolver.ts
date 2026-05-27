import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';
import { GpsPosition } from './gps-position.entity';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { RecordPositionInput } from './dto/record-position.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver(() => Vehicle)
@UseGuards(JwtAuthGuard)
export class VehiclesResolver {
  constructor(private vehiclesService: VehiclesService) {}

  @Mutation(() => Vehicle, { description: 'Add a new vehicle' })
  async addVehicle(
    @Args('input') input: CreateVehicleInput,
  ): Promise<Vehicle> {
    return this.vehiclesService.create(input);
  }

  @Query(() => [Vehicle], { description: 'Get all vehicles' })
  async vehicles(): Promise<Vehicle[]> {
    return this.vehiclesService.findAll();
  }

  @Query(() => Vehicle, { description: 'Get vehicle by ID' })
  async vehicle(@Args('id') id: string): Promise<Vehicle> {
    return this.vehiclesService.findOne(id);
  }

  @Mutation(() => GpsPosition, { description: 'Record GPS position for a vehicle' })
  async recordGpsPosition(
    @Args('input') input: RecordPositionInput,
  ): Promise<GpsPosition> {
    return this.vehiclesService.recordPosition(input);
  }

  @Query(() => [GpsPosition], { description: 'Get movement history for a vehicle' })
  async vehicleHistory(
    @Args('vehicleId') vehicleId: string,
  ): Promise<GpsPosition[]> {
    return this.vehiclesService.getHistory(vehicleId);
  }
}
