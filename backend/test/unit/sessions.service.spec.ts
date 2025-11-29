import { InternalServerErrorException } from '@nestjs/common';
import { EmailStatus } from '@prisma/client';
import { SessionsService } from '../../src/modules/sessions/sessions.service';
import { StudentsService } from '../../src/modules/students/students.service';
import { MailService } from '../../src/modules/mail/mail.service';
import { MeetingService } from '../../src/modules/meeting/meeting.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SafeUser } from '../../src/modules/users/users.service';

const coach: SafeUser = {
  id: 'coach-1',
  employeeNumber: 'E0001',
  name: 'Coach',
  email: 'coach@example.com',
  role: 'coach',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const student = {
  id: 'stu-1',
  name: 'Student',
  email: 'student@example.com',
  createdByUserId: coach.id,
  note: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sessionRecord = {
  id: 'session-1',
  studentId: student.id,
  coachId: coach.id,
  startAt: new Date(),
  endAt: new Date(Date.now() + 3_600_000),
  status: 'scheduled',
  meetUrl: 'https://meet.google.com/abc-defg',
  externalId: 'stub',
  title: 'Demo',
  createdAt: new Date(),
  updatedAt: new Date(),
  student: {
    id: student.id,
    name: student.name,
    email: student.email,
  },
};

describe('SessionsService (unit)', () => {
  let service: SessionsService;
  let prisma: jest.Mocked<Pick<PrismaService, 'session' | 'emailLog'>>;
  let studentsService: jest.Mocked<StudentsService>;
  let meetingService: jest.Mocked<MeetingService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(() => {
    prisma = {
      session: {
        create: jest.fn().mockResolvedValue(sessionRecord),
        findMany: jest.fn(),
      },
      emailLog: {
        create: jest.fn(),
      },
    } as unknown as jest.Mocked<Pick<PrismaService, 'session' | 'emailLog'>>;

    studentsService = {
      ensureStudentOwnedByCoach: jest.fn().mockResolvedValue(student),
    } as unknown as jest.Mocked<StudentsService>;

    meetingService = {
      createMeeting: jest.fn().mockResolvedValue({
        meetUrl: sessionRecord.meetUrl,
        externalId: sessionRecord.externalId,
      }),
    } as jest.Mocked<MeetingService>;

    mailService = {
      sendSessionNotification: jest.fn().mockResolvedValue({ success: true }),
    } as jest.Mocked<MailService>;

    service = new SessionsService(
      prisma as unknown as PrismaService,
      studentsService,
      meetingService,
      mailService,
    );
  });

  it('persists session and email log for happy path', async () => {
    const result = await service.createSession(coach, {
      studentId: student.id,
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 3_600_000).toISOString(),
      title: 'Weekly coaching',
    });

    expect(prisma.session.create).toHaveBeenCalled();
    expect(prisma.emailLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: EmailStatus.success,
          toEmail: student.email,
        }),
      }),
    );
    expect(result.emailStatus).toBe(EmailStatus.success);
  });

  it('records failed email status when mail service throws', async () => {
    mailService.sendSessionNotification.mockRejectedValueOnce(new Error('smtp down'));

    const result = await service.createSession(coach, {
      studentId: student.id,
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 3_600_000).toISOString(),
      title: 'Weekly coaching',
    });

    expect(result.emailStatus).toBe(EmailStatus.failed);
    expect(prisma.emailLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: EmailStatus.failed }),
      }),
    );
  });

  it('throws 500 when meeting generation fails', async () => {
    meetingService.createMeeting.mockRejectedValueOnce(new Error('google down'));

    await expect(
      service.createSession(coach, {
        studentId: student.id,
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 3_600_000).toISOString(),
        title: 'Weekly coaching',
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
