import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { IReminder } from 'app/entities/reminder/reminder.model';
import { ReminderService } from 'app/entities/reminder/service/reminder.service';
import { TagService } from '../service/tag.service';
import { ITag } from '../tag.model';
import { TagFormService } from './tag-form.service';

import { TagUpdateComponent } from './tag-update.component';

describe('Tag Management Update Component', () => {
  let comp: TagUpdateComponent;
  let fixture: ComponentFixture<TagUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let tagFormService: TagFormService;
  let tagService: TagService;
  let reminderService: ReminderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TagUpdateComponent],
      providers: [
        provideHttpClient(),
        FormBuilder,
        {
          provide: ActivatedRoute,
          useValue: {
            params: from([{}]),
          },
        },
      ],
    })
      .overrideTemplate(TagUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(TagUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    tagFormService = TestBed.inject(TagFormService);
    tagService = TestBed.inject(TagService);
    reminderService = TestBed.inject(ReminderService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Reminder query and add missing value', () => {
      const tag: ITag = { id: 16779 };
      const reminders: IReminder[] = [{ id: 31453 }];
      tag.reminders = reminders;

      const reminderCollection: IReminder[] = [{ id: 31453 }];
      jest.spyOn(reminderService, 'query').mockReturnValue(of(new HttpResponse({ body: reminderCollection })));
      const additionalReminders = [...reminders];
      const expectedCollection: IReminder[] = [...additionalReminders, ...reminderCollection];
      jest.spyOn(reminderService, 'addReminderToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ tag });
      comp.ngOnInit();

      expect(reminderService.query).toHaveBeenCalled();
      expect(reminderService.addReminderToCollectionIfMissing).toHaveBeenCalledWith(
        reminderCollection,
        ...additionalReminders.map(expect.objectContaining),
      );
      expect(comp.remindersSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const tag: ITag = { id: 16779 };
      const reminders: IReminder = { id: 31453 };
      tag.reminders = [reminders];

      activatedRoute.data = of({ tag });
      comp.ngOnInit();

      expect(comp.remindersSharedCollection).toContainEqual(reminders);
      expect(comp.tag).toEqual(tag);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ITag>>();
      const tag = { id: 19931 };
      jest.spyOn(tagFormService, 'getTag').mockReturnValue(tag);
      jest.spyOn(tagService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ tag });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: tag }));
      saveSubject.complete();

      // THEN
      expect(tagFormService.getTag).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(tagService.update).toHaveBeenCalledWith(expect.objectContaining(tag));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ITag>>();
      const tag = { id: 19931 };
      jest.spyOn(tagFormService, 'getTag').mockReturnValue({ id: null });
      jest.spyOn(tagService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ tag: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: tag }));
      saveSubject.complete();

      // THEN
      expect(tagFormService.getTag).toHaveBeenCalled();
      expect(tagService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<ITag>>();
      const tag = { id: 19931 };
      jest.spyOn(tagService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ tag });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(tagService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareReminder', () => {
      it('should forward to reminderService', () => {
        const entity = { id: 31453 };
        const entity2 = { id: 4478 };
        jest.spyOn(reminderService, 'compareReminder');
        comp.compareReminder(entity, entity2);
        expect(reminderService.compareReminder).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
