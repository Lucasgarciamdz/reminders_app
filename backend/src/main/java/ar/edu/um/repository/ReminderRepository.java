package ar.edu.um.repository;

import ar.edu.um.domain.Reminder;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for the Reminder entity.
 *
 * When extending this class, extend ReminderRepositoryWithBagRelationships too.
 * For more information refer to https://github.com/jhipster/generator-jhipster/issues/17990.
 */
@Repository
public interface ReminderRepository
    extends ReminderRepositoryWithBagRelationships, JpaRepository<Reminder, Long>, JpaSpecificationExecutor<Reminder> {
    @Query("select reminder from Reminder reminder where reminder.user.login = ?#{authentication.name}")
    List<Reminder> findByUserIsCurrentUser();

    default Optional<Reminder> findOneWithEagerRelationships(Long id) {
        return this.fetchBagRelationships(this.findById(id));
    }

    default List<Reminder> findAllWithEagerRelationships() {
        return this.fetchBagRelationships(this.findAll());
    }

    default Page<Reminder> findAllWithEagerRelationships(Pageable pageable) {
        return this.fetchBagRelationships(this.findAll(pageable));
    }
}
