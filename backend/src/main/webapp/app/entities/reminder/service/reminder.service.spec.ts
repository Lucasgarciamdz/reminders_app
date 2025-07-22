import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { IReminder } from '../reminder.model';
import { sampleWithFullData, sampleWithNewData, sampleWithPartialData, sampleWithRequiredData } from '../reminder.test-samples';

import { ReminderService, RestReminder } from './reminder.service';

const requireRestSample: RestReminder = {
  ...sampleWithRequiredData,
  dueDate: sampleWithRequiredData.dueDate?.toJSON(),
  createdDate: sampleWithRequiredData.createdDate?.toJSON(),
  lastModifiedDate: sampleWithRequiredData.lastModifiedDate?.toJSON(),
};

describe('Reminder Service', () => {
  let service: ReminderService;
  let httpMock: HttpTestingController;
  let expectedResult: IReminder | IReminder[] | boolean | null;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    expectedResult = null;
    service = TestBed.inject(ReminderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  describe('Service methods', () => {
    it('should find an element', () => {
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.find(123).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should create a Reminder', () => {
      const reminder = { ...sampleWithNewData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.create(reminder).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'POST' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should update a Reminder', () => {
      const reminder = { ...sampleWithRequiredData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.update(reminder).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PUT' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should partial update a Reminder', () => {
      const patchObject = { ...sampleWithPartialData };
      const returnedFromService = { ...requireRestSample };
      const expected = { ...sampleWithRequiredData };

      service.partialUpdate(patchObject).subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'PATCH' });
      req.flush(returnedFromService);
      expect(expectedResult).toMatchObject(expected);
    });

    it('should return a list of Reminder', () => {
      const returnedFromService = { ...requireRestSample };

      const expected = { ...sampleWithRequiredData };

      service.query().subscribe(resp => (expectedResult = resp.body));

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush([returnedFromService]);
      httpMock.verify();
      expect(expectedResult).toMatchObject([expected]);
    });

    it('should delete a Reminder', () => {
      const expected = true;

      service.delete(123).subscribe(resp => (expectedResult = resp.ok));

      const req = httpMock.expectOne({ method: 'DELETE' });
      req.flush({ status: 200 });
      expect(expectedResult).toBe(expected);
    });

    it('should handle exceptions for searching a Reminder', () => {
      const queryObject: any = {
        page: 0,
        size: 20,
        query: '',
        sort: [],
      };
      service.search(queryObject).subscribe(() => expectedResult);

      const req = httpMock.expectOne({ method: 'GET' });
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
      expect(expectedResult).toBe(null);
    });

    describe('addReminderToCollectionIfMissing', () => {
      it('should add a Reminder to an empty array', () => {
        const reminder: IReminder = sampleWithRequiredData;
        expectedResult = service.addReminderToCollectionIfMissing([], reminder);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(reminder);
      });

      it('should not add a Reminder to an array that contains it', () => {
        const reminder: IReminder = sampleWithRequiredData;
        const reminderCollection: IReminder[] = [
          {
            ...reminder,
          },
          sampleWithPartialData,
        ];
        expectedResult = service.addReminderToCollectionIfMissing(reminderCollection, reminder);
        expect(expectedResult).toHaveLength(2);
      });

      it("should add a Reminder to an array that doesn't contain it", () => {
        const reminder: IReminder = sampleWithRequiredData;
        const reminderCollection: IReminder[] = [sampleWithPartialData];
        expectedResult = service.addReminderToCollectionIfMissing(reminderCollection, reminder);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(reminder);
      });

      it('should add only unique Reminder to an array', () => {
        const reminderArray: IReminder[] = [sampleWithRequiredData, sampleWithPartialData, sampleWithFullData];
        const reminderCollection: IReminder[] = [sampleWithRequiredData];
        expectedResult = service.addReminderToCollectionIfMissing(reminderCollection, ...reminderArray);
        expect(expectedResult).toHaveLength(3);
      });

      it('should accept varargs', () => {
        const reminder: IReminder = sampleWithRequiredData;
        const reminder2: IReminder = sampleWithPartialData;
        expectedResult = service.addReminderToCollectionIfMissing([], reminder, reminder2);
        expect(expectedResult).toHaveLength(2);
        expect(expectedResult).toContain(reminder);
        expect(expectedResult).toContain(reminder2);
      });

      it('should accept null and undefined values', () => {
        const reminder: IReminder = sampleWithRequiredData;
        expectedResult = service.addReminderToCollectionIfMissing([], null, reminder, undefined);
        expect(expectedResult).toHaveLength(1);
        expect(expectedResult).toContain(reminder);
      });

      it('should return initial array if no Reminder is added', () => {
        const reminderCollection: IReminder[] = [sampleWithRequiredData];
        expectedResult = service.addReminderToCollectionIfMissing(reminderCollection, undefined, null);
        expect(expectedResult).toEqual(reminderCollection);
      });
    });

    describe('compareReminder', () => {
      it('should return true if both entities are null', () => {
        const entity1 = null;
        const entity2 = null;

        const compareResult = service.compareReminder(entity1, entity2);

        expect(compareResult).toEqual(true);
      });

      it('should return false if one entity is null', () => {
        const entity1 = { id: 31453 };
        const entity2 = null;

        const compareResult1 = service.compareReminder(entity1, entity2);
        const compareResult2 = service.compareReminder(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey differs', () => {
        const entity1 = { id: 31453 };
        const entity2 = { id: 4478 };

        const compareResult1 = service.compareReminder(entity1, entity2);
        const compareResult2 = service.compareReminder(entity2, entity1);

        expect(compareResult1).toEqual(false);
        expect(compareResult2).toEqual(false);
      });

      it('should return false if primaryKey matches', () => {
        const entity1 = { id: 31453 };
        const entity2 = { id: 31453 };

        const compareResult1 = service.compareReminder(entity1, entity2);
        const compareResult2 = service.compareReminder(entity2, entity1);

        expect(compareResult1).toEqual(true);
        expect(compareResult2).toEqual(true);
      });
    });
  });

  afterEach(() => {
    httpMock.verify();
  });
});
