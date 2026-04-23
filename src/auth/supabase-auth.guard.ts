import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // 1. verify token
    const { data, error } =
      await this.supabaseService.client.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid token');
    }

    // 2. load profile
    const { data: profile } = await this.supabaseService.client
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    // 3. block only when there is an active ban row
    const nowIso = new Date().toISOString();
    const { data: activeBans, error: activeBanError } =
      await this.supabaseService.client
        .from('ban_users')
        .select('ban_id, reason, unban_date')
        .eq('user_id', data.user.id)
        .or(`unban_date.is.null,unban_date.gt.${nowIso}`)
        .order('ban_date', { ascending: false })
        .limit(1);

    if (activeBanError) {
      throw new ForbiddenException(activeBanError.message);
    }

    const activeBan = activeBans?.[0] ?? null;
    const shouldBeBanned = Boolean(activeBan);

    // Keep profile flag in sync with real active-ban state.
    if (profile.is_banned !== shouldBeBanned) {
      await this.supabaseService.client
        .from('profiles')
        .update({ is_banned: shouldBeBanned })
        .eq('id', data.user.id);
      profile.is_banned = shouldBeBanned;
    }

    if (activeBan) {
      throw new ForbiddenException('User is banned');
    }

    // attach to request
    req.user = data.user;
    req.profile = profile;

    return true;
  }
}
