import { Test, TestingModule } from '@nestjs/testing';
import { IncidentsService } from './incidents.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Incident, IncidentType, IncidentStatus } from './incident.entity';
import { NotFoundException } from '@nestjs/common';

describe('IncidentsService', () => {
  let service: IncidentsService;
  let incidentRepo: any;

  const mockIncident: Incident = {
    id: 'incident-uuid-123',
    type: IncidentType.ACCIDENT,
    status: IncidentStatus.REPORTED,
    description: 'Accident sur la route principale',
    latitude: 36.8065,
    longitude: 10.1815,
    vehicleId: null,
    reportedBy: 'user-uuid',
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    incidentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        { provide: getRepositoryToken(Incident), useValue: incidentRepo },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
  });

  describe('declare', () => {
    it('should declare a new incident', async () => {
      incidentRepo.create.mockReturnValue(mockIncident);
      incidentRepo.save.mockResolvedValue(mockIncident);

      const result = await service.declare({
        type: IncidentType.ACCIDENT,
        description: 'Accident sur la route principale',
        latitude: 36.8065,
        longitude: 10.1815,
      });

      expect(result.type).toBe(IncidentType.ACCIDENT);
      expect(result.status).toBe(IncidentStatus.REPORTED);
    });
  });

  describe('findAll', () => {
    it('should return all incidents', async () => {
      incidentRepo.find.mockResolvedValue([mockIncident]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });

    it('should filter incidents by status', async () => {
      incidentRepo.find.mockResolvedValue([mockIncident]);
      const result = await service.findAll(IncidentStatus.REPORTED);
      expect(result[0].status).toBe(IncidentStatus.REPORTED);
    });
  });

  describe('updateStatus', () => {
    it('should update incident status to IN_PROGRESS', async () => {
      incidentRepo.findOne.mockResolvedValue(mockIncident);
      incidentRepo.save.mockResolvedValue({
        ...mockIncident,
        status: IncidentStatus.IN_PROGRESS,
      });

      const result = await service.updateStatus({
        incidentId: 'incident-uuid-123',
        status: IncidentStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(IncidentStatus.IN_PROGRESS);
    });

    it('should set resolvedAt when status is RESOLVED', async () => {
      incidentRepo.findOne.mockResolvedValue(mockIncident);
      const resolvedIncident = {
        ...mockIncident,
        status: IncidentStatus.RESOLVED,
        resolvedAt: new Date(),
      };
      incidentRepo.save.mockResolvedValue(resolvedIncident);

      const result = await service.updateStatus({
        incidentId: 'incident-uuid-123',
        status: IncidentStatus.RESOLVED,
      });

      expect(result.resolvedAt).toBeDefined();
    });

    it('should throw NotFoundException for non-existent incident', async () => {
      incidentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus({
          incidentId: 'nonexistent',
          status: IncidentStatus.IN_PROGRESS,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
