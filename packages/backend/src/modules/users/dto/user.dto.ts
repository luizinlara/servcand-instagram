import { IsString, IsNotEmpty, IsEmail, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@empresa.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'uuid-of-company' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ example: 'uuid-of-profile' })
  @IsString()
  @IsNotEmpty()
  profileId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  personId?: string;
}

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  profileId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  personId?: string;
}
