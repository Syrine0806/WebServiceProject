import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

@InputType()
export class UpdateDensityInput {
  @Field()
  @IsNotEmpty()
  zoneId: string;

  @Field()
  @IsNumber()
  @Min(0)
  vehicleCount: number;
}
