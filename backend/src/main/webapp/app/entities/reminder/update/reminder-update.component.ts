import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IUser } from 'app/entities/user/user.model';
import { UserService } from 'app/entities/user/service/user.service';
import { Priority } from 'app/entities/enumerations/priority.model';
import { ReminderService } from '../service/reminder.service';
import { IReminder } from '../reminder.model';
import { ReminderFormGroup, ReminderFormService } from './reminder-form.service';

@Component({
  selector: 'jhi-reminder-update',
  templateUrl: './reminder-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ReminderUpdateComponent implements OnInit {
  isSaving = false;
  reminder: IReminder | null = null;
  priorityValues = Object.keys(Priority);

  usersSharedCollection: IUser[] = [];

  protected reminderService = inject(ReminderService);
  protected reminderFormService = inject(ReminderFormService);
  protected userService = inject(UserService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ReminderFormGroup = this.reminderFormService.createReminderFormGroup();

  compareUser = (o1: IUser | null, o2: IUser | null): boolean => this.userService.compareUser(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ reminder }) => {
      this.reminder = reminder;
      if (reminder) {
        this.updateForm(reminder);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const reminder = this.reminderFormService.getReminder(this.editForm);
    if (reminder.id !== null) {
      this.subscribeToSaveResponse(this.reminderService.update(reminder));
    } else {
      this.subscribeToSaveResponse(this.reminderService.create(reminder));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IReminder>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(reminder: IReminder): void {
    this.reminder = reminder;
    this.reminderFormService.resetForm(this.editForm, reminder);

    this.usersSharedCollection = this.userService.addUserToCollectionIfMissing<IUser>(this.usersSharedCollection, reminder.user);
  }

  protected loadRelationshipsOptions(): void {
    this.userService
      .query()
      .pipe(map((res: HttpResponse<IUser[]>) => res.body ?? []))
      .pipe(map((users: IUser[]) => this.userService.addUserToCollectionIfMissing<IUser>(users, this.reminder?.user)))
      .subscribe((users: IUser[]) => (this.usersSharedCollection = users));
  }
}
