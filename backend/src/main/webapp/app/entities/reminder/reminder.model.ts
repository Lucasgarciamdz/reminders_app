import dayjs from 'dayjs/esm';
import { IUser } from 'app/entities/user/user.model';
import { Priority } from 'app/entities/enumerations/priority.model';

export interface IReminder {
  id: number;
  text?: string | null;
  completed?: boolean | null;
  reminderDate?: dayjs.Dayjs | null;
  reminderTime?: string | null;
  createdAt?: dayjs.Dayjs | null;
  updatedAt?: dayjs.Dayjs | null;
  priority?: keyof typeof Priority | null;
  isAllDay?: boolean | null;
  user?: Pick<IUser, 'id' | 'login'> | null;
}

export type NewReminder = Omit<IReminder, 'id'> & { id: null };
