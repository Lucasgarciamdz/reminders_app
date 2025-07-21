import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IReminder } from '../reminder.model';
import { ReminderService } from '../service/reminder.service';

@Component({
  templateUrl: './reminder-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class ReminderDeleteDialogComponent {
  reminder?: IReminder;

  protected reminderService = inject(ReminderService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.reminderService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
