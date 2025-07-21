import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IReminder } from '../reminder.model';
import { ReminderService } from '../service/reminder.service';

const reminderResolve = (route: ActivatedRouteSnapshot): Observable<null | IReminder> => {
  const id = route.params.id;
  if (id) {
    return inject(ReminderService)
      .find(id)
      .pipe(
        mergeMap((reminder: HttpResponse<IReminder>) => {
          if (reminder.body) {
            return of(reminder.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default reminderResolve;
