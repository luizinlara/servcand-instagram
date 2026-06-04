import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, IsBoolean, IsObject, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMissionDto {
  @ApiProperty() @IsString() @IsNotEmpty() companyId: string;
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ enum: ['POST_PHOTO', 'TAG_COMPANY', 'COMMENT_POST', 'SHARE_POST', 'REACH_FOLLOWERS', 'CUSTOM'] })
  @IsEnum(['POST_PHOTO', 'TAG_COMPANY', 'COMMENT_POST', 'SHARE_POST', 'REACH_FOLLOWERS', 'CUSTOM'])
  type: string;
  @ApiProperty({ default: 10 }) @IsOptional() @IsInt() points?: number;
  @ApiProperty({ default: 0.00 }) @IsOptional() @IsNumber() rewardValue?: number;
  @ApiProperty({ default: false }) @IsOptional() @IsBoolean() isRequired?: boolean;
  @ApiProperty({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty({ required: false }) @IsOptional() metadata?: any;
}

export class UpdateMissionDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() points?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() rewardValue?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isRequired?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty({ required: false }) @IsOptional() metadata?: any;
}

export class ValidateMissionDto {
  @ApiProperty() @IsString() @IsNotEmpty() personId: string;
  @ApiProperty() @IsString() @IsNotEmpty() missionId: string;
  @ApiProperty() @IsInt() weekNumber: number;
  @ApiProperty() @IsInt() year: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() evidence?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() notes?: string;
}
