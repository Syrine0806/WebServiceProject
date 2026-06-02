import { Resolver, Query, Mutation, Args, Subscription } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { Incident, IncidentStatus } from './incident.entity';
import { DeclareIncidentInput } from './dto/declare-incident.input';
import { UpdateIncidentStatusInput } from './dto/update-status.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Resolver(() => Incident)
export class IncidentsResolver {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Mutation(() => Incident, { description: 'Declare a new incident' })
  @UseGuards(JwtAuthGuard)
  async declareIncident(
    @Args('input') input: DeclareIncidentInput,
  ): Promise<Incident> {
    return this.incidentsService.declare(input);
  }

  @Query(() => [Incident], { description: 'Get all incidents, optionally filtered by status' })
  @UseGuards(JwtAuthGuard)
  async incidents(
    @Args('status', { type: () => IncidentStatus, nullable: true })
    status?: IncidentStatus,
  ): Promise<Incident[]> {
    return this.incidentsService.findAll(status);
  }

  @Query(() => Incident, { description: 'Get incident by ID' })
  @UseGuards(JwtAuthGuard)
  async incident(@Args('id') id: string): Promise<Incident> {
    return this.incidentsService.findOne(id);
  }

  @Mutation(() => Incident, { description: 'Update the status of an incident' })
  @UseGuards(JwtAuthGuard)
  async updateIncidentStatus(
    @Args('input') input: UpdateIncidentStatusInput,
  ): Promise<Incident> {
    return this.incidentsService.updateStatus(input);
  }

  // ─── WebSocket Subscriptions (no auth guard — read-only, demo purpose) ─────
  @Subscription(() => Incident, {
    description: 'Receive new incidents in real-time via WebSocket',
  })
  incidentDeclared() {
    return this.incidentsService.getIncidentDeclaredIterator();
  }

  @Subscription(() => Incident, {
    description: 'Receive incident status changes in real-time via WebSocket',
  })
  incidentStatusChanged() {
    return this.incidentsService.getIncidentUpdatedIterator();
  }
}
