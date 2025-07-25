import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpResponse, provideHttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, from, of } from 'rxjs';

import { ICategory } from 'app/entities/category/category.model';
import { CategoryService } from 'app/entities/category/service/category.service';
import { IUser } from 'app/entities/user/user.model';
import { UserService } from 'app/entities/user/service/user.service';
import { ITag } from 'app/entities/tag/tag.model';
import { TagService } from 'app/entities/tag/service/tag.service';
import { IReminder } from '../reminder.model';
import { ReminderService } from '../service/reminder.service';
import { ReminderFormService } from './reminder-form.service';

import { ReminderUpdateComponent } from './reminder-update.component';

describe('Reminder Management Update Component', () => {
  let comp: ReminderUpdateComponent;
  let fixture: ComponentFixture<ReminderUpdateComponent>;
  let activatedRoute: ActivatedRoute;
  let reminderFormService: ReminderFormService;
  let reminderService: ReminderService;
  let categoryService: CategoryService;
  let userService: UserService;
  let tagService: TagService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReminderUpdateComponent],
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
      .overrideTemplate(ReminderUpdateComponent, '')
      .compileComponents();

    fixture = TestBed.createComponent(ReminderUpdateComponent);
    activatedRoute = TestBed.inject(ActivatedRoute);
    reminderFormService = TestBed.inject(ReminderFormService);
    reminderService = TestBed.inject(ReminderService);
    categoryService = TestBed.inject(CategoryService);
    userService = TestBed.inject(UserService);
    tagService = TestBed.inject(TagService);

    comp = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    it('should call Category query and add missing value', () => {
      const reminder: IReminder = { id: 4478 };
      const category: ICategory = { id: 6752 };
      reminder.category = category;

      const categoryCollection: ICategory[] = [{ id: 6752 }];
      jest.spyOn(categoryService, 'query').mockReturnValue(of(new HttpResponse({ body: categoryCollection })));
      const additionalCategories = [category];
      const expectedCollection: ICategory[] = [...additionalCategories, ...categoryCollection];
      jest.spyOn(categoryService, 'addCategoryToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ reminder });
      comp.ngOnInit();

      expect(categoryService.query).toHaveBeenCalled();
      expect(categoryService.addCategoryToCollectionIfMissing).toHaveBeenCalledWith(
        categoryCollection,
        ...additionalCategories.map(expect.objectContaining),
      );
      expect(comp.categoriesSharedCollection).toEqual(expectedCollection);
    });

    it('should call User query and add missing value', () => {
      const reminder: IReminder = { id: 4478 };
      const user: IUser = { id: 3944 };
      reminder.user = user;

      const userCollection: IUser[] = [{ id: 3944 }];
      jest.spyOn(userService, 'query').mockReturnValue(of(new HttpResponse({ body: userCollection })));
      const additionalUsers = [user];
      const expectedCollection: IUser[] = [...additionalUsers, ...userCollection];
      jest.spyOn(userService, 'addUserToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ reminder });
      comp.ngOnInit();

      expect(userService.query).toHaveBeenCalled();
      expect(userService.addUserToCollectionIfMissing).toHaveBeenCalledWith(
        userCollection,
        ...additionalUsers.map(expect.objectContaining),
      );
      expect(comp.usersSharedCollection).toEqual(expectedCollection);
    });

    it('should call Tag query and add missing value', () => {
      const reminder: IReminder = { id: 4478 };
      const tags: ITag[] = [{ id: 19931 }];
      reminder.tags = tags;

      const tagCollection: ITag[] = [{ id: 19931 }];
      jest.spyOn(tagService, 'query').mockReturnValue(of(new HttpResponse({ body: tagCollection })));
      const additionalTags = [...tags];
      const expectedCollection: ITag[] = [...additionalTags, ...tagCollection];
      jest.spyOn(tagService, 'addTagToCollectionIfMissing').mockReturnValue(expectedCollection);

      activatedRoute.data = of({ reminder });
      comp.ngOnInit();

      expect(tagService.query).toHaveBeenCalled();
      expect(tagService.addTagToCollectionIfMissing).toHaveBeenCalledWith(tagCollection, ...additionalTags.map(expect.objectContaining));
      expect(comp.tagsSharedCollection).toEqual(expectedCollection);
    });

    it('should update editForm', () => {
      const reminder: IReminder = { id: 4478 };
      const category: ICategory = { id: 6752 };
      reminder.category = category;
      const user: IUser = { id: 3944 };
      reminder.user = user;
      const tags: ITag = { id: 19931 };
      reminder.tags = [tags];

      activatedRoute.data = of({ reminder });
      comp.ngOnInit();

      expect(comp.categoriesSharedCollection).toContainEqual(category);
      expect(comp.usersSharedCollection).toContainEqual(user);
      expect(comp.tagsSharedCollection).toContainEqual(tags);
      expect(comp.reminder).toEqual(reminder);
    });
  });

  describe('save', () => {
    it('should call update service on save for existing entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IReminder>>();
      const reminder = { id: 31453 };
      jest.spyOn(reminderFormService, 'getReminder').mockReturnValue(reminder);
      jest.spyOn(reminderService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ reminder });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: reminder }));
      saveSubject.complete();

      // THEN
      expect(reminderFormService.getReminder).toHaveBeenCalled();
      expect(comp.previousState).toHaveBeenCalled();
      expect(reminderService.update).toHaveBeenCalledWith(expect.objectContaining(reminder));
      expect(comp.isSaving).toEqual(false);
    });

    it('should call create service on save for new entity', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IReminder>>();
      const reminder = { id: 31453 };
      jest.spyOn(reminderFormService, 'getReminder').mockReturnValue({ id: null });
      jest.spyOn(reminderService, 'create').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ reminder: null });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.next(new HttpResponse({ body: reminder }));
      saveSubject.complete();

      // THEN
      expect(reminderFormService.getReminder).toHaveBeenCalled();
      expect(reminderService.create).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).toHaveBeenCalled();
    });

    it('should set isSaving to false on error', () => {
      // GIVEN
      const saveSubject = new Subject<HttpResponse<IReminder>>();
      const reminder = { id: 31453 };
      jest.spyOn(reminderService, 'update').mockReturnValue(saveSubject);
      jest.spyOn(comp, 'previousState');
      activatedRoute.data = of({ reminder });
      comp.ngOnInit();

      // WHEN
      comp.save();
      expect(comp.isSaving).toEqual(true);
      saveSubject.error('This is an error!');

      // THEN
      expect(reminderService.update).toHaveBeenCalled();
      expect(comp.isSaving).toEqual(false);
      expect(comp.previousState).not.toHaveBeenCalled();
    });
  });

  describe('Compare relationships', () => {
    describe('compareCategory', () => {
      it('should forward to categoryService', () => {
        const entity = { id: 6752 };
        const entity2 = { id: 4374 };
        jest.spyOn(categoryService, 'compareCategory');
        comp.compareCategory(entity, entity2);
        expect(categoryService.compareCategory).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareUser', () => {
      it('should forward to userService', () => {
        const entity = { id: 3944 };
        const entity2 = { id: 6275 };
        jest.spyOn(userService, 'compareUser');
        comp.compareUser(entity, entity2);
        expect(userService.compareUser).toHaveBeenCalledWith(entity, entity2);
      });
    });

    describe('compareTag', () => {
      it('should forward to tagService', () => {
        const entity = { id: 19931 };
        const entity2 = { id: 16779 };
        jest.spyOn(tagService, 'compareTag');
        comp.compareTag(entity, entity2);
        expect(tagService.compareTag).toHaveBeenCalledWith(entity, entity2);
      });
    });
  });
});
