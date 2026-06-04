import { IsOptional, IsNumber, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateParametersDto {
  @ApiProperty({ description: 'Salário mensal base (R$)', example: 1000, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyBaseSalary?: number;

  @ApiProperty({ description: 'Valor disponível por semana (R$)', example: 250, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weeklyAmount?: number;

  @ApiProperty({ description: 'Número de semanas por mês', example: 4, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  weeksPerMonth?: number;

  @ApiProperty({ description: 'Percentual de bônus por nível (%)', example: 10, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  levelBonusPercentage?: number;

  @ApiProperty({ description: 'Pontos necessários para subir de nível', example: 100, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  missionPointsToLevel?: number;

  @ApiProperty({ description: 'Missões obrigatórias por semana', example: 3, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  missionsRequiredPerWeek?: number;
}
