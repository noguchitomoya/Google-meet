import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  searchByCoach(coachId: string, query?: string) {
    return this.prisma.student.findMany({
      where: {
        createdByUserId: coachId,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  async createStudent(coachId: string, dto: CreateStudentDto) {
    const existing = await this.prisma.student.findFirst({
      where: {
        createdByUserId: coachId,
        email: dto.email,
      },
    });

    if (existing) {
      throw new ConflictException('既に登録済みのメールアドレスです。');
    }

    return this.prisma.student.create({
      data: {
        ...dto,
        createdByUserId: coachId,
      },
    });
  }

  async ensureStudentOwnedByCoach(studentId: string, coachId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student || student.createdByUserId !== coachId) {
      throw new NotFoundException('受講者が見つかりません。');
    }
    return student;
  }
}

