import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrafficZone, CongestionLevel } from './traffic-zone.entity';
import { CreateZoneInput } from './dto/create-zone.input';
import { UpdateDensityInput } from './dto/update-density.input';

@Injectable()
export class TrafficService {
  constructor(
    @InjectRepository(TrafficZone)
    private zoneRepo: Repository<TrafficZone>,
  ) {}

  async createZone(input: CreateZoneInput): Promise<TrafficZone> {
    const zone = this.zoneRepo.create({
      ...input,
      vehicleCount: 0,
      density: 0,
      congestionLevel: CongestionLevel.LOW,
    });
    return this.zoneRepo.save(zone);
  }

  async findAll(): Promise<TrafficZone[]> {
    return this.zoneRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<TrafficZone> {
    const zone = await this.zoneRepo.findOne({ where: { id } });
    if (!zone) throw new NotFoundException(`Traffic zone ${id} not found`);
    return zone;
  }

  async updateDensity(input: UpdateDensityInput): Promise<TrafficZone> {
    const zone = await this.findOne(input.zoneId);
    const area = Math.PI * Math.pow(zone.radius, 2);
    const density = area > 0 ? input.vehicleCount / area : 0;
    zone.vehicleCount = input.vehicleCount;
    zone.density = density;
    zone.congestionLevel = this.classifyCongestion(density, zone.radius);
    return this.zoneRepo.save(zone);
  }

  async getCongestedZones(): Promise<TrafficZone[]> {
    return this.zoneRepo.find({
      where: { congestionLevel: CongestionLevel.HIGH },
      order: { density: 'DESC' },
    });
  }

  private classifyCongestion(density: number, radius: number): CongestionLevel {
    const normalizedDensity = density * radius;
    if (normalizedDensity < 0.5) return CongestionLevel.LOW;
    if (normalizedDensity < 2) return CongestionLevel.MEDIUM;
    return CongestionLevel.HIGH;
  }
}
