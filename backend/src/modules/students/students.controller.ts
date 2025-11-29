import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { SafeUser } from '../users/users.service';

@UseGuards(JwtAuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  findMine(@CurrentUser() user: SafeUser, @Query('query') query?: string) {
    return this.studentsService.searchByCoach(user.id, query);
  }

  @Post()
  create(@CurrentUser() user: SafeUser, @Body() dto: CreateStudentDto) {
    return this.studentsService.createStudent(user.id, dto);
  }
}

