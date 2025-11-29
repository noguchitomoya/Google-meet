import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { SafeUser } from '../../modules/users/users.service';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): SafeUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as SafeUser;
  },
);

