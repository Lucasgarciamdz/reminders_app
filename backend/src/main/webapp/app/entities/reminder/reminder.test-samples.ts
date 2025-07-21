import dayjs from 'dayjs/esm';

import { IReminder, NewReminder } from './reminder.model';

export const sampleWithRequiredData: IReminder = {
  id: 1166,
  text: 'lined',
  completed: true,
  reminderDate: dayjs('2025-07-21'),
  createdAt: dayjs('2025-07-20T20:34'),
  isAllDay: true,
};

export const sampleWithPartialData: IReminder = {
  id: 7975,
  text: 'that gulp clear',
  completed: true,
  reminderDate: dayjs('2025-07-20'),
  reminderTime: '11:26:00',
  createdAt: dayjs('2025-07-20T16:06'),
  priority: 'MEDIUM',
  isAllDay: false,
};

export const sampleWithFullData: IReminder = {
  id: 5366,
  text: 'once athwart',
  completed: false,
  reminderDate: dayjs('2025-07-21'),
  reminderTime: '01:53:00',
  createdAt: dayjs('2025-07-21T04:23'),
  updatedAt: dayjs('2025-07-20T16:29'),
  priority: 'MEDIUM',
  isAllDay: false,
};

export const sampleWithNewData: NewReminder = {
  text: 'idealistic once',
  completed: true,
  reminderDate: dayjs('2025-07-21'),
  createdAt: dayjs('2025-07-20T21:06'),
  isAllDay: true,
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
