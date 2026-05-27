import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { VehicleType } from '../vehicle.entity';

@InputType()
export class CreateVehicleInput {
  @Field()
  @IsNotEmpty()
  licensePlate: string;

  @Field()
  @IsNotEmpty()
  model: string;

  @Field({ nullable: true })
  @IsOptional()
  brand?: string;

  @Field(() => VehicleType, { nullable: true })
  @IsOptional()
  @IsEnum(VehicleType)
  type?: VehicleType;

  @Field({ nullable: true })
  @IsOptional()
  ownerId?: string;
}
