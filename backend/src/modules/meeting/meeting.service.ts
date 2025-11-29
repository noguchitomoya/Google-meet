export interface MeetingService {
  createMeeting(params: {
    startAt: Date;
    endAt: Date;
    title?: string;
  }): Promise<{ meetUrl: string; externalId?: string }>;
}

export const MEETING_SERVICE = Symbol('MEETING_SERVICE');

