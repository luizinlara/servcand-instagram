import {
  IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum,
  IsDateString, IsBoolean
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePersonPublicDto {
  @ApiProperty() @IsString() @IsNotEmpty() firstName: string;
  @ApiProperty() @IsString() @IsNotEmpty() lastName: string;
  @ApiProperty() @IsString() @IsNotEmpty() phone: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEmail() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cpf?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() whatsapp?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() instagramUsername?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() zipCode?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() number?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() complement?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() neighborhood?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() city?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() state?: string;
  @ApiProperty({ description: 'ID da empresa' }) @IsString() @IsNotEmpty() companyId: string;
  @ApiProperty({ description: 'ID da região (bairro)', required: false }) @IsOptional() @IsString() regionId?: string;
}

export class CreatePersonInternalDto extends CreatePersonPublicDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() rg?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() birthDate?: string;
  @ApiProperty({ enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'], required: false })
  @IsOptional()
  @IsEnum(['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: string;
}

export class UpdatePersonDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() firstName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() lastName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEmail() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cpf?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() rg?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() whatsapp?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() birthDate?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() instagramUsername?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() instagramId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() regionId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() zipCode?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() number?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() complement?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() neighborhood?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() city?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() state?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() photoUrl?: string;
  @ApiProperty({ enum: ['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'], required: false })
  @IsOptional()
  @IsEnum(['PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status?: string;
}

export class ApprovePersonDto {
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  @IsEnum(['ACTIVE', 'INACTIVE', 'SUSPENDED'])
  status: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() regionId?: string;
}
