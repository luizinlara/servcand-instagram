import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PersonsModule } from './modules/persons/persons.module';
import { RegionsModule } from './modules/regions/regions.module';
import { LeadershipModule } from './modules/leadership/leadership.module';
import { MissionsModule } from './modules/missions/missions.module';
import { InstagramModule } from './modules/instagram/instagram.module';
import { SalaryModule } from './modules/salary/salary.module';
import { ParametersModule } from './modules/parameters/parameters.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    CompaniesModule,
    UsersModule,
    ProfilesModule,
    PersonsModule,
    RegionsModule,
    LeadershipModule,
    MissionsModule,
    InstagramModule,
    SalaryModule,
    ParametersModule,
  ],
})
export class AppModule {}
