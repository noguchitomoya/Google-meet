import { SafeUser } from '../../modules/users/users.service';

export interface RequestUser extends SafeUser {
  accessToken?: string;
}

