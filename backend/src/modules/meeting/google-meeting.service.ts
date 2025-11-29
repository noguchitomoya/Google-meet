import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, calendar_v3 } from 'googleapis';
import { GaxiosError } from 'googleapis-common';
import { JWT } from 'google-auth-library';
import { MeetingService } from './meeting.service';

@Injectable()
export class GoogleMeetingService implements MeetingService {
  private readonly logger = new Logger(GoogleMeetingService.name);
  private readonly calendar: calendar_v3.Calendar;
  private readonly calendarId: string | null;
  private readonly isReady: boolean;

  constructor(private readonly configService: ConfigService) {
    const clientEmail = configService.get<string>('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const privateKey = configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY');
    this.calendarId = this.normalize(configService.get<string>('GOOGLE_CALENDAR_ID')) ?? null;
    const subject = this.normalize(configService.get<string>('GOOGLE_IMPERSONATED_USER'));

    if (!clientEmail || !privateKey || !this.calendarId) {
      this.logger.warn('Google Meeting integration is not fully configured. Falling back to stub service.');
      this.isReady = false;
      this.calendar = google.calendar({ version: 'v3' });
      return;
    }

    const jwtClient = new JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
      subject,
    });

    this.calendar = google.calendar({ version: 'v3', auth: jwtClient });
    this.isReady = true;
  }

  async createMeeting(params: { startAt: Date; endAt: Date; title?: string }) {
    if (!this.isReady || !this.calendarId) {
      throw new Error('Google Meet integration is not configured.');
    }

    const timeZone = this.normalize(this.configService.get<string>('GOOGLE_CALENDAR_TIMEZONE')) ?? 'Asia/Tokyo';

    const requestBody: calendar_v3.Schema$Event = {
      summary: params.title ?? 'Online Coaching Session',
      start: {
        dateTime: params.startAt.toISOString(),
        timeZone,
      },
      end: {
        dateTime: params.endAt.toISOString(),
        timeZone,
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
        },
      },
    };

    let response;
    try {
      response = await this.calendar.events.insert({
        calendarId: this.calendarId,
        requestBody,
        conferenceDataVersion: 1,
        sendUpdates: 'none',
      });
    } catch (error) {
      if (error instanceof GaxiosError && error.response) {
        this.logger.error(`Google Calendar API error (${error.response.status}): ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }

    const event = response.data;
    const meetUrl =
      event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri ??
      event.hangoutLink;

    if (!event.id || !meetUrl) {
      throw new Error('Google Calendar API did not return a Meet URL.');
    }

    this.logger.log(`Created Google Meet ${meetUrl} for event ${event.id}`);

    return {
      meetUrl,
      externalId: event.id,
    };
  }
  private normalize(value?: string | null) {
    if (!value) {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
}
