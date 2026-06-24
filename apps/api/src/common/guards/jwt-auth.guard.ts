import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Thin alias around Passport's JWT strategy so route decorators read
// cleanly: @UseGuards(JwtAuthGuard).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
