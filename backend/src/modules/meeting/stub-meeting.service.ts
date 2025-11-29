import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeetingService } from './meeting.service';

@Injectable()
export class StubMeetingService implements MeetingService {
  private readonly logger = new Logger(StubMeetingService.name);

  constructor(private readonly configService: ConfigService) {}

  async createMeeting(params: { startAt: Date; endAt: Date; title?: string }) {
    const domain = this.configService.get<string>('MEET_DOMAIN') ?? 'https://meet.google.com';
    const slug = this.generateSlug();
    const meetUrl = `${domain.replace(/\/$/, '')}/${slug}`;
    this.logger.log(`(Stub) Generated Meet URL ${meetUrl} for "${params.title ?? 'Coaching Session'}"`);
    return {
      meetUrl,
      externalId: `stub-${Date.now()}`,
    };
  }

  private generateSlug() {
    const charset = 'abcdefghijklmnopqrstuvwxyz';
    const random = () =>
      Array.from({ length: 3 })
        .map(() => charset[Math.floor(Math.random() * charset.length)])
        .join('');
    return `${random()}-${random()}-${random()}`;
  }
}

