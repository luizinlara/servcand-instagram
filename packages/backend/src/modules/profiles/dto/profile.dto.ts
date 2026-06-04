import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty() @IsString() @IsNotEmpty() companyId: string;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() permissionIds?: string[];
}

export class UpdateProfileDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() permissionIds?: string[];
}
