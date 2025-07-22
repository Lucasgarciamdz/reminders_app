import dayjs from 'dayjs/esm';

import { IReminder, NewReminder } from './reminder.model';

export const sampleWithRequiredData: IReminder = {
  id: 1166,
  title: 'lined',
  dueDate: dayjs('2025-07-22T00:13'),
  isCompleted: true,
  priority: 'MEDIUM',
  createdDate: dayjs('2025-07-21T21:21'),
};

export const sampleWithPartialData: IReminder = {
  id: 5295,
  title: 'boohoo',
  description: '../fake-data/blob/hipster.txt',
  dueDate: dayjs('2025-07-22T04:46'),
  isCompleted: true,
  priority: 'URGENT',
  createdDate: dayjs('2025-07-21T14:12'),
};

export const sampleWithFullData: IReminder = {
  id: 5366,
  title: 'once athwart',
  description: '../fake-data/blob/hipster.txt',
  dueDate: dayjs('2025-07-22T12:50'),
  isCompleted: false,
  priority: 'HIGH',
  createdDate: dayjs('2025-07-22T04:24'),
  lastModifiedDate: dayjs('2025-07-21T16:29'),
};

export const sampleWithNewData: NewReminder = {
  title: 'idealistic once',
  dueDate: dayjs('2025-07-21T15:22'),
  isCompleted: false,
  priority: 'MEDIUM',
  createdDate: dayjs('2025-07-21T16:03'),
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
