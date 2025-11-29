import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { MeetingModule } from '../meeting/meeting.module';
import { StudentsModule } from '../students/students.module';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

@Module({
  imports: [StudentsModule, MeetingModule, MailModule],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}

