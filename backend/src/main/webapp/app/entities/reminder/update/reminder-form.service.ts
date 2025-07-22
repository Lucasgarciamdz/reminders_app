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
type FormValueOf<T extends IReminder | NewReminder> = Omit<T, 'dueDate'> & {
  dueDate?: string | null;
};

type ReminderFormRawValue = FormValueOf<IReminder>;

type NewReminderFormRawValue = FormValueOf<NewReminder>;

type ReminderFormDefaults = Pick<NewReminder, 'id' | 'dueDate' | 'completed'>;

type ReminderFormGroupContent = {
  id: FormControl<ReminderFormRawValue['id'] | NewReminder['id']>;
  title: FormControl<ReminderFormRawValue['title']>;
  description: FormControl<ReminderFormRawValue['description']>;
  dueDate: FormControl<ReminderFormRawValue['dueDate']>;
  completed: FormControl<ReminderFormRawValue['completed']>;
  user: FormControl<ReminderFormRawValue['user']>;
  category: FormControl<ReminderFormRawValue['category']>;
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
        validators: [Validators.required, Validators.minLength(3)],
      }),
      description: new FormControl(reminderRawValue.description),
      dueDate: new FormControl(reminderRawValue.dueDate),
      completed: new FormControl(reminderRawValue.completed, {
        validators: [Validators.required],
      }),
      user: new FormControl(reminderRawValue.user),
      category: new FormControl(reminderRawValue.category),
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
      completed: false,
    };
  }

  private convertReminderRawValueToReminder(rawReminder: ReminderFormRawValue | NewReminderFormRawValue): IReminder | NewReminder {
    return {
      ...rawReminder,
      dueDate: dayjs(rawReminder.dueDate, DATE_TIME_FORMAT),
    };
  }

  private convertReminderToReminderRawValue(
    reminder: IReminder | (Partial<NewReminder> & ReminderFormDefaults),
  ): ReminderFormRawValue | PartialWithRequiredKeyOf<NewReminderFormRawValue> {
    return {
      ...reminder,
      dueDate: reminder.dueDate ? reminder.dueDate.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
