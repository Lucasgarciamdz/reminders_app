package ar.edu.um.service;

import ar.edu.um.domain.Reminder;
import ar.edu.um.repository.ReminderRepository;
import ar.edu.um.service.dto.ReminderDTO;
import ar.edu.um.service.mapper.ReminderMapper;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link ar.edu.um.domain.Reminder}.
 */
@Service
@Transactional
public class ReminderService {

    private static final Logger LOG = LoggerFactory.getLogger(ReminderService.class);

    private final ReminderRepository reminderRepository;

    private final ReminderMapper reminderMapper;

    public ReminderService(ReminderRepository reminderRepository, ReminderMapper reminderMapper) {
        this.reminderRepository = reminderRepository;
        this.reminderMapper = reminderMapper;
    }

    /**
     * Save a reminder.
     *
     * @param reminderDTO the entity to save.
     * @return the persisted entity.
     */
    public ReminderDTO save(ReminderDTO reminderDTO) {
        LOG.debug("Request to save Reminder : {}", reminderDTO);
        Reminder reminder = reminderMapper.toEntity(reminderDTO);
        reminder = reminderRepository.save(reminder);
        return reminderMapper.toDto(reminder);
    }

    /**
     * Update a reminder.
     *
     * @param reminderDTO the entity to save.
     * @return the persisted entity.
     */
    public ReminderDTO update(ReminderDTO reminderDTO) {
        LOG.debug("Request to update Reminder : {}", reminderDTO);
        Reminder reminder = reminderMapper.toEntity(reminderDTO);
        reminder = reminderRepository.save(reminder);
        return reminderMapper.toDto(reminder);
    }

    /**
     * Partially update a reminder.
     *
     * @param reminderDTO the entity to update partially.
     * @return the persisted entity.
     */
    public Optional<ReminderDTO> partialUpdate(ReminderDTO reminderDTO) {
        LOG.debug("Request to partially update Reminder : {}", reminderDTO);

        return reminderRepository
            .findById(reminderDTO.getId())
            .map(existingReminder -> {
                reminderMapper.partialUpdate(existingReminder, reminderDTO);

                return existingReminder;
            })
            .map(reminderRepository::save)
            .map(reminderMapper::toDto);
    }

    /**
     * Get all the reminders.
     *
     * @param pageable the pagination information.
     * @return the list of entities.
     */
    @Transactional(readOnly = true)
    public Page<ReminderDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Reminders");
        return reminderRepository.findAll(pageable).map(reminderMapper::toDto);
    }

    /**
     * Get all the reminders with eager load of many-to-many relationships.
     *
     * @return the list of entities.
     */
    public Page<ReminderDTO> findAllWithEagerRelationships(Pageable pageable) {
        return reminderRepository.findAllWithEagerRelationships(pageable).map(reminderMapper::toDto);
    }

    /**
     * Get one reminder by id.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    @Transactional(readOnly = true)
    public Optional<ReminderDTO> findOne(Long id) {
        LOG.debug("Request to get Reminder : {}", id);
        return reminderRepository.findOneWithEagerRelationships(id).map(reminderMapper::toDto);
    }

    /**
     * Delete the reminder by id.
     *
     * @param id the id of the entity.
     */
    public void delete(Long id) {
        LOG.debug("Request to delete Reminder : {}", id);
        reminderRepository.deleteById(id);
    }
}
