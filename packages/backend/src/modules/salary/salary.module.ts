import { Module } from '@nestjs/common';
import { SalaryService } from './salary.service';
import { SalaryController } from './salary.controller';
import { InstagramModule } from '../instagram/instagram.module';

@Module({
  imports: [InstagramModule],
  controllers: [SalaryController],
  providers: [SalaryService],
  exports: [SalaryService]
})
export class SalaryModule {}

