import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { GpsPosition } from './gps-position.entity';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { RecordPositionInput } from './dto/record-position.input';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle) private vehicleRepo: Repository<Vehicle>,
    @InjectRepository(GpsPosition)
    private positionRepo: Repository<GpsPosition>,
  ) {}

  async create(input: CreateVehicleInput): Promise<Vehicle> {
    const existing = await this.vehicleRepo.findOne({
      where: { licensePlate: input.licensePlate },
    });
    if (existing) throw new ConflictException('License plate already exists');
    const vehicle = this.vehicleRepo.create(input);
    return this.vehicleRepo.save(vehicle);
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepo.find();
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async recordPosition(input: RecordPositionInput): Promise<GpsPosition> {
    await this.findOne(input.vehicleId);
    const position = this.positionRepo.create(input);
    return this.positionRepo.save(position);
  }

  async getHistory(vehicleId: string): Promise<GpsPosition[]> {
    await this.findOne(vehicleId);
    return this.positionRepo.find({
      where: { vehicleId },
      order: { timestamp: 'DESC' },
    });
  }
}
