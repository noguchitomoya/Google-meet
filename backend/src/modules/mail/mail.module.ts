import { Module } from '@nestjs/common';
import { ConsoleMailService } from './console-mail.service';
import { MAIL_SERVICE } from './mail.service';

@Module({
  providers: [
    {
      provide: MAIL_SERVICE,
      useClass: ConsoleMailService,
    },
  ],
  exports: [MAIL_SERVICE],
})
export class MailModule {}

