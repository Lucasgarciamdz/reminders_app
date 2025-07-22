package ar.edu.um.repository;

import ar.edu.um.domain.Reminder;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Reminder entity.
 */
@Repository
public interface ReminderRepository extends JpaRepository<Reminder, Long> {
    @Query("select reminder from Reminder reminder where reminder.user.login = ?#{authentication.name}")
    List<Reminder> findByUserIsCurrentUser();

    default Optional<Reminder> findOneWithEagerRelationships(Long id) {
        return this.findOneWithToOneRelationships(id);
    }

    default List<Reminder> findAllWithEagerRelationships() {
        return this.findAllWithToOneRelationships();
    }

    default Page<Reminder> findAllWithEagerRelationships(Pageable pageable) {
        return this.findAllWithToOneRelationships(pageable);
    }

    @Query(
        value = "select reminder from Reminder reminder left join fetch reminder.user left join fetch reminder.category",
        countQuery = "select count(reminder) from Reminder reminder"
    )
    Page<Reminder> findAllWithToOneRelationships(Pageable pageable);

    @Query("select reminder from Reminder reminder left join fetch reminder.user left join fetch reminder.category")
    List<Reminder> findAllWithToOneRelationships();

    @Query("select reminder from Reminder reminder left join fetch reminder.user left join fetch reminder.category where reminder.id =:id")
    Optional<Reminder> findOneWithToOneRelationships(@Param("id") Long id);
}
