import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'authority',
    data: { pageTitle: 'Authorities' },
    loadChildren: () => import('./admin/authority/authority.routes'),
  },
  {
    path: 'reminder',
    data: { pageTitle: 'Reminders' },
    loadChildren: () => import('./reminder/reminder.routes'),
  },
  {
    path: 'category',
    data: { pageTitle: 'Categories' },
    loadChildren: () => import('./category/category.routes'),
  },
  /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
];

export default routes;
