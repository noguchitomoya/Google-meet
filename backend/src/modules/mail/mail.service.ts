export interface MailService {
  sendSessionNotification(params: {
    to: string;
    studentName: string;
    coachName: string;
    startAt: string;
    endAt: string;
    meetUrl: string;
    title?: string;
  }): Promise<{ success: boolean; errorMessage?: string }>;
}

export const MAIL_SERVICE = Symbol('MAIL_SERVICE');

