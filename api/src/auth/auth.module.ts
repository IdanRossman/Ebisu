import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Module({
  imports: [DatabaseModule],
  providers: [SupabaseAuthGuard],
  exports: [SupabaseAuthGuard],
})
export class AuthModule {}
