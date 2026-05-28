import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PubSub } from 'graphql-subscriptions';
import { Incident, IncidentStatus } from './incident.entity';
import { DeclareIncidentInput } from './dto/declare-incident.input';
import { UpdateIncidentStatusInput } from './dto/update-status.input';
import { PUB_SUB } from './pub-sub.provider';

export const INCIDENT_DECLARED = 'incidentDeclared';
export const INCIDENT_UPDATED = 'incidentStatusChanged';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident) private readonly incidentRepo: Repository<Incident>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  async declare(input: DeclareIncidentInput): Promise<Incident> {
    const incident = this.incidentRepo.create(input);
    const saved = await this.incidentRepo.save(incident);
    await this.pubSub.publish(INCIDENT_DECLARED, { incidentDeclared: saved });
    return saved;
  }

  async findAll(status?: IncidentStatus): Promise<Incident[]> {
    if (status) {
      return this.incidentRepo.find({
        where: { status },
        order: { createdAt: 'DESC' },
      });
    }
    return this.incidentRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentRepo.findOne({ where: { id } });
    if (!incident) throw new NotFoundException(`Incident ${id} not found`);
    return incident;
  }

  async updateStatus(input: UpdateIncidentStatusInput): Promise<Incident> {
    const incident = await this.findOne(input.incidentId);
    incident.status = input.status;
    if (input.status === IncidentStatus.RESOLVED) {
      incident.resolvedAt = new Date();
    }
    const saved = await this.incidentRepo.save(incident);
    await this.pubSub.publish(INCIDENT_UPDATED, { incidentStatusChanged: saved });
    return saved;
  }

  getIncidentDeclaredIterator() {
    return this.pubSub.asyncIterator(INCIDENT_DECLARED);
  }

  getIncidentUpdatedIterator() {
    return this.pubSub.asyncIterator(INCIDENT_UPDATED);
  }
}
