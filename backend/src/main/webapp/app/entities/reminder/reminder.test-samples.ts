import dayjs from 'dayjs/esm';

import { IReminder, NewReminder } from './reminder.model';

export const sampleWithRequiredData: IReminder = {
  id: 1166,
  title: 'lined',
  completed: true,
};

export const sampleWithPartialData: IReminder = {
  id: 5295,
  title: 'boohoo',
  description: 'gulp clear',
  completed: true,
};

export const sampleWithFullData: IReminder = {
  id: 5366,
  title: 'once athwart',
  description: 'kinase popularize nocturnal',
  dueDate: dayjs('2025-07-21T12:30'),
  completed: false,
};

export const sampleWithNewData: NewReminder = {
  title: 'idealistic once',
  completed: true,
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
