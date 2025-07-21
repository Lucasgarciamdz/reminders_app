package ar.edu.um.service;

import ar.edu.um.service.dto.ReminderDTO;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service Interface for managing {@link ar.edu.um.domain.Reminder}.
 */
public interface ReminderService {
    /**
     * Save a reminder.
     *
     * @param reminderDTO the entity to save.
     * @return the persisted entity.
     */
    ReminderDTO save(ReminderDTO reminderDTO);

    /**
     * Updates a reminder.
     *
     * @param reminderDTO the entity to update.
     * @return the persisted entity.
     */
    ReminderDTO update(ReminderDTO reminderDTO);

    /**
     * Partially updates a reminder.
     *
     * @param reminderDTO the entity to update partially.
     * @return the persisted entity.
     */
    Optional<ReminderDTO> partialUpdate(ReminderDTO reminderDTO);

    /**
     * Get all the reminders.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    Page<ReminderDTO> findAll(Pageable pageable);

    /**
     * Get all the reminders with eager load of many-to-many relationships.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    Page<ReminderDTO> findAllWithEagerRelationships(Pageable pageable);

    /**
     * Get the "id" reminder.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    Optional<ReminderDTO> findOne(Long id);

    /**
     * Delete the "id" reminder.
     *
     * @param id the id of the entity.
     */
    void delete(Long id);

    /**
     * Search for the reminder corresponding to the query.
     *
     * @param query the query of the search.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    Page<ReminderDTO> search(String query, Pageable pageable);
}
