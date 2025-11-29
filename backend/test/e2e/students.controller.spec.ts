import { ExecutionContext, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { StudentsModule } from '../../src/modules/students/students.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';
import { SafeUser } from '../../src/modules/users/users.service';

const memoryStudents: any[] = [];

const prismaStub: Partial<PrismaService> = {
  student: {
    findMany: jest.fn(async ({ where }: any) => {
      return memoryStudents
        .filter((record) => {
          if (where?.createdByUserId && record.createdByUserId !== where.createdByUserId) {
            return false;
          }
          if (where?.OR?.length) {
            return where.OR.some((clause: any) => {
              if (clause.name?.contains) {
                return record.name.toLowerCase().includes(clause.name.contains.toLowerCase());
              }
              if (clause.email?.contains) {
                return record.email.toLowerCase().includes(clause.email.contains.toLowerCase());
              }
              return true;
            });
          }
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
    }),
    findFirst: jest.fn(async ({ where }: any) => {
      return memoryStudents.find(
        (record) => record.createdByUserId === where.createdByUserId && record.email === where.email,
      );
    }),
    findUnique: jest.fn(async ({ where }: any) => {
      return memoryStudents.find((record) => record.id === where.id) ?? null;
    }),
    create: jest.fn(async ({ data }: any) => {
      const now = new Date();
      const newRecord = {
        id: `stub-${memoryStudents.length + 1}`,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      memoryStudents.push(newRecord);
      return newRecord;
    }),
  },
} as Partial<PrismaService>;

const mockUser: SafeUser = {
  id: 'coach-e2e',
  employeeNumber: 'E9999',
  name: 'Coach Test',
  email: 'coach@test.com',
  role: 'coach',
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Students API (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [StudentsModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    memoryStudents.splice(0, memoryStudents.length);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates and lists students for the authenticated coach', async () => {
    await request(app.getHttpServer())
      .post('/students')
      .send({ name: 'Student One', email: 'one@example.com', note: 'First' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/students')
      .send({ name: 'Student Two', email: 'two@example.com' })
      .expect(201);

    const response = await request(app.getHttpServer()).get('/students').expect(200);
    expect(response.body).toHaveLength(2);
  });

  it('rejects duplicate email per coach', async () => {
    await request(app.getHttpServer())
      .post('/students')
      .send({ name: 'Student One', email: 'dup@example.com' })
      .expect(201);

    const response = await request(app.getHttpServer())
      .post('/students')
      .send({ name: 'Student Two', email: 'dup@example.com' })
      .expect(409);

    expect(response.body.message).toContain('既に登録済み');
  });
});

