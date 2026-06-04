import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeadershipDto {
  @ApiProperty() @IsString() @IsNotEmpty() regionId: string;
  @ApiProperty() @IsString() @IsNotEmpty() personId: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() endDate?: string;
}

export class UpdateLeadershipDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() regionId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() endDate?: string;
}
