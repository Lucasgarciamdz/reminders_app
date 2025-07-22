package ar.edu.um.repository;

import ar.edu.um.domain.Reminder;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

/**
 * Utility repository to load bag relationships based on https://vladmihalcea.com/hibernate-multiplebagfetchexception/
 */
public class ReminderRepositoryWithBagRelationshipsImpl implements ReminderRepositoryWithBagRelationships {

    private static final String ID_PARAMETER = "id";
    private static final String REMINDERS_PARAMETER = "reminders";

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Optional<Reminder> fetchBagRelationships(Optional<Reminder> reminder) {
        return reminder.map(this::fetchTags);
    }

    @Override
    public Page<Reminder> fetchBagRelationships(Page<Reminder> reminders) {
        return new PageImpl<>(fetchBagRelationships(reminders.getContent()), reminders.getPageable(), reminders.getTotalElements());
    }

    @Override
    public List<Reminder> fetchBagRelationships(List<Reminder> reminders) {
        return Optional.of(reminders).map(this::fetchTags).orElse(Collections.emptyList());
    }

    Reminder fetchTags(Reminder result) {
        return entityManager
            .createQuery("select reminder from Reminder reminder left join fetch reminder.tags where reminder.id = :id", Reminder.class)
            .setParameter(ID_PARAMETER, result.getId())
            .getSingleResult();
    }

    List<Reminder> fetchTags(List<Reminder> reminders) {
        HashMap<Object, Integer> order = new HashMap<>();
        IntStream.range(0, reminders.size()).forEach(index -> order.put(reminders.get(index).getId(), index));
        List<Reminder> result = entityManager
            .createQuery(
                "select reminder from Reminder reminder left join fetch reminder.tags where reminder in :reminders",
                Reminder.class
            )
            .setParameter(REMINDERS_PARAMETER, reminders)
            .getResultList();
        Collections.sort(result, (o1, o2) -> Integer.compare(order.get(o1.getId()), order.get(o2.getId())));
        return result;
    }
}
