import dayjs from 'dayjs/esm';
import { ICategory } from 'app/entities/category/category.model';
import { IUser } from 'app/entities/user/user.model';
import { ITag } from 'app/entities/tag/tag.model';
import { Priority } from 'app/entities/enumerations/priority.model';

export interface IReminder {
  id: number;
  title?: string | null;
  description?: string | null;
  dueDate?: dayjs.Dayjs | null;
  isCompleted?: boolean | null;
  priority?: keyof typeof Priority | null;
  createdDate?: dayjs.Dayjs | null;
  lastModifiedDate?: dayjs.Dayjs | null;
  category?: Pick<ICategory, 'id'> | null;
  user?: Pick<IUser, 'id'> | null;
  tags?: Pick<ITag, 'id'>[] | null;
}

export type NewReminder = Omit<IReminder, 'id'> & { id: null };
