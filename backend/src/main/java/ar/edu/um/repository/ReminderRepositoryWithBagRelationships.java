package ar.edu.um.repository;

import ar.edu.um.domain.Reminder;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;

public interface ReminderRepositoryWithBagRelationships {
    Optional<Reminder> fetchBagRelationships(Optional<Reminder> reminder);

    List<Reminder> fetchBagRelationships(List<Reminder> reminders);

    Page<Reminder> fetchBagRelationships(Page<Reminder> reminders);
}
