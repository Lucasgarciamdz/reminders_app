import { IReminder } from 'app/entities/reminder/reminder.model';

export interface ITag {
  id: number;
  name?: string | null;
  reminders?: Pick<IReminder, 'id'>[] | null;
}

export type NewTag = Omit<ITag, 'id'> & { id: null };
