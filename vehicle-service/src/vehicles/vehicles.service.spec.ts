import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Vehicle, VehicleType, VehicleStatus } from './vehicle.entity';
import { GpsPosition } from './gps-position.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let vehicleRepo: any;
  let positionRepo: any;

  const mockVehicle: Vehicle = {
    id: 'vehicle-uuid-123',
    licensePlate: 'TN-123-456',
    model: 'Corolla',
    brand: 'Toyota',
    type: VehicleType.CAR,
    status: VehicleStatus.ACTIVE,
    ownerId: 'user-uuid',
    positions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPosition: GpsPosition = {
    id: 'pos-uuid-123',
    vehicleId: 'vehicle-uuid-123',
    vehicle: mockVehicle,
    latitude: 36.8065,
    longitude: 10.1815,
    speed: 60,
    timestamp: new Date(),
  };

  beforeEach(async () => {
    vehicleRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    positionRepo = {
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: vehicleRepo },
        { provide: getRepositoryToken(GpsPosition), useValue: positionRepo },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  describe('create', () => {
    it('should create a vehicle successfully', async () => {
      vehicleRepo.findOne.mockResolvedValue(null);
      vehicleRepo.create.mockReturnValue(mockVehicle);
      vehicleRepo.save.mockResolvedValue(mockVehicle);

      const result = await service.create({
        licensePlate: 'TN-123-456',
        model: 'Corolla',
        brand: 'Toyota',
        type: VehicleType.CAR,
      });

      expect(result.licensePlate).toBe('TN-123-456');
    });

    it('should throw ConflictException for duplicate license plate', async () => {
      vehicleRepo.findOne.mockResolvedValue(mockVehicle);

      await expect(
        service.create({ licensePlate: 'TN-123-456', model: 'Corolla' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by id', async () => {
      vehicleRepo.findOne.mockResolvedValue(mockVehicle);
      const result = await service.findOne('vehicle-uuid-123');
      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException if vehicle not found', async () => {
      vehicleRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recordPosition', () => {
    it('should record a GPS position', async () => {
      vehicleRepo.findOne.mockResolvedValue(mockVehicle);
      positionRepo.create.mockReturnValue(mockPosition);
      positionRepo.save.mockResolvedValue(mockPosition);

      const result = await service.recordPosition({
        vehicleId: 'vehicle-uuid-123',
        latitude: 36.8065,
        longitude: 10.1815,
        speed: 60,
      });

      expect(result.latitude).toBe(36.8065);
    });
  });

  describe('getHistory', () => {
    it('should return GPS history for a vehicle', async () => {
      vehicleRepo.findOne.mockResolvedValue(mockVehicle);
      positionRepo.find.mockResolvedValue([mockPosition]);

      const result = await service.getHistory('vehicle-uuid-123');
      expect(result).toHaveLength(1);
    });
  });
});
