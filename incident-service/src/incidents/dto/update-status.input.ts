import { InputType, Field } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { IncidentStatus } from '../incident.entity';

@InputType()
export class UpdateIncidentStatusInput {
  @Field()
  @IsUUID('4')
  @IsNotEmpty()
  incidentId: string;

  @Field(() => IncidentStatus)
  @IsEnum(IncidentStatus)
  status: IncidentStatus;
}
