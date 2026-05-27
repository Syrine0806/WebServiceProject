import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

@InputType()
export class RecordPositionInput {
  @Field()
  @IsNotEmpty()
  vehicleId: string;

  @Field(() => Float)
  @IsNumber()
  latitude: number;

  @Field(() => Float)
  @IsNumber()
  longitude: number;

  @Field({ nullable: true })
  @IsOptional()
  speed?: number;
}
