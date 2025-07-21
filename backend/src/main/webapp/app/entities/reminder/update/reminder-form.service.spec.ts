import { TestBed } from '@angular/core/testing';

import { sampleWithNewData, sampleWithRequiredData } from '../reminder.test-samples';

import { ReminderFormService } from './reminder-form.service';

describe('Reminder Form Service', () => {
  let service: ReminderFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReminderFormService);
  });

  describe('Service methods', () => {
    describe('createReminderFormGroup', () => {
      it('should create a new form with FormControl', () => {
        const formGroup = service.createReminderFormGroup();

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            text: expect.any(Object),
            completed: expect.any(Object),
            reminderDate: expect.any(Object),
            reminderTime: expect.any(Object),
            createdAt: expect.any(Object),
            updatedAt: expect.any(Object),
            priority: expect.any(Object),
            isAllDay: expect.any(Object),
            user: expect.any(Object),
          }),
        );
      });

      it('passing IReminder should create a new form with FormGroup', () => {
        const formGroup = service.createReminderFormGroup(sampleWithRequiredData);

        expect(formGroup.controls).toEqual(
          expect.objectContaining({
            id: expect.any(Object),
            text: expect.any(Object),
            completed: expect.any(Object),
            reminderDate: expect.any(Object),
            reminderTime: expect.any(Object),
            createdAt: expect.any(Object),
            updatedAt: expect.any(Object),
            priority: expect.any(Object),
            isAllDay: expect.any(Object),
            user: expect.any(Object),
          }),
        );
      });
    });

    describe('getReminder', () => {
      it('should return NewReminder for default Reminder initial value', () => {
        const formGroup = service.createReminderFormGroup(sampleWithNewData);

        const reminder = service.getReminder(formGroup) as any;

        expect(reminder).toMatchObject(sampleWithNewData);
      });

      it('should return NewReminder for empty Reminder initial value', () => {
        const formGroup = service.createReminderFormGroup();

        const reminder = service.getReminder(formGroup) as any;

        expect(reminder).toMatchObject({});
      });

      it('should return IReminder', () => {
        const formGroup = service.createReminderFormGroup(sampleWithRequiredData);

        const reminder = service.getReminder(formGroup) as any;

        expect(reminder).toMatchObject(sampleWithRequiredData);
      });
    });

    describe('resetForm', () => {
      it('passing IReminder should not enable id FormControl', () => {
        const formGroup = service.createReminderFormGroup();
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, sampleWithRequiredData);

        expect(formGroup.controls.id.disabled).toBe(true);
      });

      it('passing NewReminder should disable id FormControl', () => {
        const formGroup = service.createReminderFormGroup(sampleWithRequiredData);
        expect(formGroup.controls.id.disabled).toBe(true);

        service.resetForm(formGroup, { id: null });

        expect(formGroup.controls.id.disabled).toBe(true);
      });
    });
  });
});
