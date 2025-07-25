import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IReminder } from 'app/entities/reminder/reminder.model';
import { ReminderService } from 'app/entities/reminder/service/reminder.service';
import { ITag } from '../tag.model';
import { TagService } from '../service/tag.service';
import { TagFormGroup, TagFormService } from './tag-form.service';

@Component({
  selector: 'jhi-tag-update',
  templateUrl: './tag-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class TagUpdateComponent implements OnInit {
  isSaving = false;
  tag: ITag | null = null;

  remindersSharedCollection: IReminder[] = [];

  protected tagService = inject(TagService);
  protected tagFormService = inject(TagFormService);
  protected reminderService = inject(ReminderService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: TagFormGroup = this.tagFormService.createTagFormGroup();

  compareReminder = (o1: IReminder | null, o2: IReminder | null): boolean => this.reminderService.compareReminder(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ tag }) => {
      this.tag = tag;
      if (tag) {
        this.updateForm(tag);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const tag = this.tagFormService.getTag(this.editForm);
    if (tag.id !== null) {
      this.subscribeToSaveResponse(this.tagService.update(tag));
    } else {
      this.subscribeToSaveResponse(this.tagService.create(tag));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ITag>>): void {
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

  protected updateForm(tag: ITag): void {
    this.tag = tag;
    this.tagFormService.resetForm(this.editForm, tag);

    this.remindersSharedCollection = this.reminderService.addReminderToCollectionIfMissing<IReminder>(
      this.remindersSharedCollection,
      ...(tag.reminders ?? []),
    );
  }

  protected loadRelationshipsOptions(): void {
    this.reminderService
      .query()
      .pipe(map((res: HttpResponse<IReminder[]>) => res.body ?? []))
      .pipe(
        map((reminders: IReminder[]) =>
          this.reminderService.addReminderToCollectionIfMissing<IReminder>(reminders, ...(this.tag?.reminders ?? [])),
        ),
      )
      .subscribe((reminders: IReminder[]) => (this.remindersSharedCollection = reminders));
  }
}
