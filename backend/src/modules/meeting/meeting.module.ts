import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleMeetingService } from './google-meeting.service';
import { StubMeetingService } from './stub-meeting.service';
import { MEETING_SERVICE, MeetingService } from './meeting.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: GoogleMeetingService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => new GoogleMeetingService(configService),
    },
    {
      provide: StubMeetingService,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => new StubMeetingService(configService),
    },
    {
      provide: MEETING_SERVICE,
      inject: [ConfigService, GoogleMeetingService, StubMeetingService],
      useFactory: (
        configService: ConfigService,
        googleMeetingService: GoogleMeetingService,
        stubMeetingService: StubMeetingService,
      ): MeetingService => {
        const isGoogleConfigured =
          !!configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL') &&
          !!configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY') &&
          !!configService.get<string>('GOOGLE_CALENDAR_ID');
        return isGoogleConfigured ? googleMeetingService : stubMeetingService;
      },
    },
  ],
  exports: [MEETING_SERVICE],
})
export class MeetingModule {}
