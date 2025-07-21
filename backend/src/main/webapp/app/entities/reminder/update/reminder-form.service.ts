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
type FormValueOf<T extends IReminder | NewReminder> = Omit<T, 'createdAt' | 'updatedAt'> & {
  createdAt?: string | null;
  updatedAt?: string | null;
};

type ReminderFormRawValue = FormValueOf<IReminder>;

type NewReminderFormRawValue = FormValueOf<NewReminder>;

type ReminderFormDefaults = Pick<NewReminder, 'id' | 'completed' | 'createdAt' | 'updatedAt' | 'isAllDay'>;

type ReminderFormGroupContent = {
  id: FormControl<ReminderFormRawValue['id'] | NewReminder['id']>;
  text: FormControl<ReminderFormRawValue['text']>;
  completed: FormControl<ReminderFormRawValue['completed']>;
  reminderDate: FormControl<ReminderFormRawValue['reminderDate']>;
  reminderTime: FormControl<ReminderFormRawValue['reminderTime']>;
  createdAt: FormControl<ReminderFormRawValue['createdAt']>;
  updatedAt: FormControl<ReminderFormRawValue['updatedAt']>;
  priority: FormControl<ReminderFormRawValue['priority']>;
  isAllDay: FormControl<ReminderFormRawValue['isAllDay']>;
  user: FormControl<ReminderFormRawValue['user']>;
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
      text: new FormControl(reminderRawValue.text, {
        validators: [Validators.required, Validators.maxLength(500)],
      }),
      completed: new FormControl(reminderRawValue.completed, {
        validators: [Validators.required],
      }),
      reminderDate: new FormControl(reminderRawValue.reminderDate, {
        validators: [Validators.required],
      }),
      reminderTime: new FormControl(reminderRawValue.reminderTime),
      createdAt: new FormControl(reminderRawValue.createdAt, {
        validators: [Validators.required],
      }),
      updatedAt: new FormControl(reminderRawValue.updatedAt),
      priority: new FormControl(reminderRawValue.priority),
      isAllDay: new FormControl(reminderRawValue.isAllDay, {
        validators: [Validators.required],
      }),
      user: new FormControl(reminderRawValue.user),
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
      completed: false,
      createdAt: currentTime,
      updatedAt: currentTime,
      isAllDay: false,
    };
  }

  private convertReminderRawValueToReminder(rawReminder: ReminderFormRawValue | NewReminderFormRawValue): IReminder | NewReminder {
    return {
      ...rawReminder,
      createdAt: dayjs(rawReminder.createdAt, DATE_TIME_FORMAT),
      updatedAt: dayjs(rawReminder.updatedAt, DATE_TIME_FORMAT),
    };
  }

  private convertReminderToReminderRawValue(
    reminder: IReminder | (Partial<NewReminder> & ReminderFormDefaults),
  ): ReminderFormRawValue | PartialWithRequiredKeyOf<NewReminderFormRawValue> {
    return {
      ...reminder,
      createdAt: reminder.createdAt ? reminder.createdAt.format(DATE_TIME_FORMAT) : undefined,
      updatedAt: reminder.updatedAt ? reminder.updatedAt.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
