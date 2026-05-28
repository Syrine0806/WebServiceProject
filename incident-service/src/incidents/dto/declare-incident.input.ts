import { InputType, Field, Float } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { IncidentType } from '../incident.entity';

@InputType()
export class DeclareIncidentInput {
  @Field(() => IncidentType)
  @IsEnum(IncidentType)
  type: IncidentType;

  @Field()
  @IsNotEmpty()
  description: string;

  @Field(() => Float)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @Field(() => Float)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID('4')
  vehicleId?: string;

  @Field({ nullable: true })
  @IsOptional()
  reportedBy?: string;
}
