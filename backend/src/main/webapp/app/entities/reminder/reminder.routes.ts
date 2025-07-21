import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import ReminderResolve from './route/reminder-routing-resolve.service';

const reminderRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/reminder.component').then(m => m.ReminderComponent),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/reminder-detail.component').then(m => m.ReminderDetailComponent),
    resolve: {
      reminder: ReminderResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/reminder-update.component').then(m => m.ReminderUpdateComponent),
    resolve: {
      reminder: ReminderResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/reminder-update.component').then(m => m.ReminderUpdateComponent),
    resolve: {
      reminder: ReminderResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default reminderRoute;
