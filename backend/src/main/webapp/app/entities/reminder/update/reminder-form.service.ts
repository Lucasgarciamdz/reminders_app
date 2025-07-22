import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IReminder, NewReminder } from '../reminder.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IReminder for edit and NewReminderFormGroupInput for create.
 */
type ReminderFormGroupInput = IReminder | PartialWithRequiredKeyOf<NewReminder>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IReminder | NewReminder> = Omit<T, 'dueDate' | 'createdDate' | 'lastModifiedDate'> & {
  dueDate?: string | null;
  createdDate?: string | null;
  lastModifiedDate?: string | null;
};

type ReminderFormRawValue = FormValueOf<IReminder>;

type NewReminderFormRawValue = FormValueOf<NewReminder>;

type ReminderFormDefaults = Pick<NewReminder, 'id' | 'dueDate' | 'isCompleted' | 'createdDate' | 'lastModifiedDate' | 'tags'>;

type ReminderFormGroupContent = {
  id: FormControl<ReminderFormRawValue['id'] | NewReminder['id']>;
  title: FormControl<ReminderFormRawValue['title']>;
  description: FormControl<ReminderFormRawValue['description']>;
  dueDate: FormControl<ReminderFormRawValue['dueDate']>;
  isCompleted: FormControl<ReminderFormRawValue['isCompleted']>;
  priority: FormControl<ReminderFormRawValue['priority']>;
  createdDate: FormControl<ReminderFormRawValue['createdDate']>;
  lastModifiedDate: FormControl<ReminderFormRawValue['lastModifiedDate']>;
  category: FormControl<ReminderFormRawValue['category']>;
  user: FormControl<ReminderFormRawValue['user']>;
  tags: FormControl<ReminderFormRawValue['tags']>;
};

export type ReminderFormGroup = FormGroup<ReminderFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ReminderFormService {
  createReminderFormGroup(reminder: ReminderFormGroupInput = { id: null }): ReminderFormGroup {
    const reminderRawValue = this.convertReminderToReminderRawValue({
      ...this.getFormDefaults(),
      ...reminder,
    });
    return new FormGroup<ReminderFormGroupContent>({
      id: new FormControl(
        { value: reminderRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      title: new FormControl(reminderRawValue.title, {
        validators: [Validators.required, Validators.maxLength(255)],
      }),
      description: new FormControl(reminderRawValue.description),
      dueDate: new FormControl(reminderRawValue.dueDate, {
        validators: [Validators.required],
      }),
      isCompleted: new FormControl(reminderRawValue.isCompleted, {
        validators: [Validators.required],
      }),
      priority: new FormControl(reminderRawValue.priority, {
        validators: [Validators.required],
      }),
      createdDate: new FormControl(reminderRawValue.createdDate, {
        validators: [Validators.required],
      }),
      lastModifiedDate: new FormControl(reminderRawValue.lastModifiedDate),
      category: new FormControl(reminderRawValue.category),
      user: new FormControl(reminderRawValue.user),
      tags: new FormControl(reminderRawValue.tags ?? []),
    });
  }

  getReminder(form: ReminderFormGroup): IReminder | NewReminder {
    return this.convertReminderRawValueToReminder(form.getRawValue() as ReminderFormRawValue | NewReminderFormRawValue);
  }

  resetForm(form: ReminderFormGroup, reminder: ReminderFormGroupInput): void {
    const reminderRawValue = this.convertReminderToReminderRawValue({ ...this.getFormDefaults(), ...reminder });
    form.reset(
      {
        ...reminderRawValue,
        id: { value: reminderRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ReminderFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      dueDate: currentTime,
      isCompleted: false,
      createdDate: currentTime,
      lastModifiedDate: currentTime,
      tags: [],
    };
  }

  private convertReminderRawValueToReminder(rawReminder: ReminderFormRawValue | NewReminderFormRawValue): IReminder | NewReminder {
    return {
      ...rawReminder,
      dueDate: dayjs(rawReminder.dueDate, DATE_TIME_FORMAT),
      createdDate: dayjs(rawReminder.createdDate, DATE_TIME_FORMAT),
      lastModifiedDate: dayjs(rawReminder.lastModifiedDate, DATE_TIME_FORMAT),
    };
  }

  private convertReminderToReminderRawValue(
    reminder: IReminder | (Partial<NewReminder> & ReminderFormDefaults),
  ): ReminderFormRawValue | PartialWithRequiredKeyOf<NewReminderFormRawValue> {
    return {
      ...reminder,
      dueDate: reminder.dueDate ? reminder.dueDate.format(DATE_TIME_FORMAT) : undefined,
      createdDate: reminder.createdDate ? reminder.createdDate.format(DATE_TIME_FORMAT) : undefined,
      lastModifiedDate: reminder.lastModifiedDate ? reminder.lastModifiedDate.format(DATE_TIME_FORMAT) : undefined,
      tags: reminder.tags ?? [],
    };
  }
}
