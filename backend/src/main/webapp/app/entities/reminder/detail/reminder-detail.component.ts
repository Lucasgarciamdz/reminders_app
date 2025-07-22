import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { FormatMediumDatetimePipe } from 'app/shared/date';
import { IReminder } from '../reminder.model';

@Component({
  selector: 'jhi-reminder-detail',
  templateUrl: './reminder-detail.component.html',
  imports: [SharedModule, RouterModule, FormatMediumDatetimePipe],
})
export class ReminderDetailComponent {
  reminder = input<IReminder | null>(null);

  previousState(): void {
    window.history.back();
  }
}
