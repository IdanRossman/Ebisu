import { InternalServerErrorException } from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';

export function throwIfSupabaseError(error: PostgrestError | null) {
  if (error) {
    throw new InternalServerErrorException(error.message);
  }
}
