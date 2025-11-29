import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SafeUser } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';

@UseGuards(JwtAuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  list(@CurrentUser() user: SafeUser) {
    return this.sessionsService.listForCoach(user.id);
  }

  @Post()
  create(@CurrentUser() user: SafeUser, @Body() dto: CreateSessionDto) {
    return this.sessionsService.createSession(user, dto);
  }
}

