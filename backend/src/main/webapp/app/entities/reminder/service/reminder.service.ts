import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IReminder, NewReminder } from '../reminder.model';

export type PartialUpdateReminder = Partial<IReminder> & Pick<IReminder, 'id'>;

type RestOf<T extends IReminder | NewReminder> = Omit<T, 'dueDate'> & {
  dueDate?: string | null;
};

export type RestReminder = RestOf<IReminder>;

export type NewRestReminder = RestOf<NewReminder>;

export type PartialUpdateRestReminder = RestOf<PartialUpdateReminder>;

export type EntityResponseType = HttpResponse<IReminder>;
export type EntityArrayResponseType = HttpResponse<IReminder[]>;

@Injectable({ providedIn: 'root' })
export class ReminderService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/reminders');

  create(reminder: NewReminder): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(reminder);
    return this.http
      .post<RestReminder>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(reminder: IReminder): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(reminder);
    return this.http
      .put<RestReminder>(`${this.resourceUrl}/${this.getReminderIdentifier(reminder)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(reminder: PartialUpdateReminder): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(reminder);
    return this.http
      .patch<RestReminder>(`${this.resourceUrl}/${this.getReminderIdentifier(reminder)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestReminder>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestReminder[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getReminderIdentifier(reminder: Pick<IReminder, 'id'>): number {
    return reminder.id;
  }

  compareReminder(o1: Pick<IReminder, 'id'> | null, o2: Pick<IReminder, 'id'> | null): boolean {
    return o1 && o2 ? this.getReminderIdentifier(o1) === this.getReminderIdentifier(o2) : o1 === o2;
  }

  addReminderToCollectionIfMissing<Type extends Pick<IReminder, 'id'>>(
    reminderCollection: Type[],
    ...remindersToCheck: (Type | null | undefined)[]
  ): Type[] {
    const reminders: Type[] = remindersToCheck.filter(isPresent);
    if (reminders.length > 0) {
      const reminderCollectionIdentifiers = reminderCollection.map(reminderItem => this.getReminderIdentifier(reminderItem));
      const remindersToAdd = reminders.filter(reminderItem => {
        const reminderIdentifier = this.getReminderIdentifier(reminderItem);
        if (reminderCollectionIdentifiers.includes(reminderIdentifier)) {
          return false;
        }
        reminderCollectionIdentifiers.push(reminderIdentifier);
        return true;
      });
      return [...remindersToAdd, ...reminderCollection];
    }
    return reminderCollection;
  }

  protected convertDateFromClient<T extends IReminder | NewReminder | PartialUpdateReminder>(reminder: T): RestOf<T> {
    return {
      ...reminder,
      dueDate: reminder.dueDate?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restReminder: RestReminder): IReminder {
    return {
      ...restReminder,
      dueDate: restReminder.dueDate ? dayjs(restReminder.dueDate) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestReminder>): HttpResponse<IReminder> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestReminder[]>): HttpResponse<IReminder[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
