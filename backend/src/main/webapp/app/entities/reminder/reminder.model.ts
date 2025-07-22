import dayjs from 'dayjs/esm';
import { IUser } from 'app/entities/user/user.model';
import { ICategory } from 'app/entities/category/category.model';

export interface IReminder {
  id: number;
  title?: string | null;
  description?: string | null;
  dueDate?: dayjs.Dayjs | null;
  completed?: boolean | null;
  user?: Pick<IUser, 'id' | 'login'> | null;
  category?: Pick<ICategory, 'id' | 'name'> | null;
}

export type NewReminder = Omit<IReminder, 'id'> & { id: null };
