package ar.edu.um.service.impl;

import ar.edu.um.domain.Reminder;
import ar.edu.um.repository.ReminderRepository;
import ar.edu.um.repository.search.ReminderSearchRepository;
import ar.edu.um.service.ReminderService;
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
public class ReminderServiceImpl implements ReminderService {

    private static final Logger LOG = LoggerFactory.getLogger(ReminderServiceImpl.class);

    private final ReminderRepository reminderRepository;

    private final ReminderMapper reminderMapper;

    private final ReminderSearchRepository reminderSearchRepository;

    public ReminderServiceImpl(
        ReminderRepository reminderRepository,
        ReminderMapper reminderMapper,
        ReminderSearchRepository reminderSearchRepository
    ) {
        this.reminderRepository = reminderRepository;
        this.reminderMapper = reminderMapper;
        this.reminderSearchRepository = reminderSearchRepository;
    }

    @Override
    public ReminderDTO save(ReminderDTO reminderDTO) {
        LOG.debug("Request to save Reminder : {}", reminderDTO);
        Reminder reminder = reminderMapper.toEntity(reminderDTO);
        reminder = reminderRepository.save(reminder);
        reminderSearchRepository.index(reminder);
        return reminderMapper.toDto(reminder);
    }

    @Override
    public ReminderDTO update(ReminderDTO reminderDTO) {
        LOG.debug("Request to update Reminder : {}", reminderDTO);
        Reminder reminder = reminderMapper.toEntity(reminderDTO);
        reminder = reminderRepository.save(reminder);
        reminderSearchRepository.index(reminder);
        return reminderMapper.toDto(reminder);
    }

    @Override
    public Optional<ReminderDTO> partialUpdate(ReminderDTO reminderDTO) {
        LOG.debug("Request to partially update Reminder : {}", reminderDTO);

        return reminderRepository
            .findById(reminderDTO.getId())
            .map(existingReminder -> {
                reminderMapper.partialUpdate(existingReminder, reminderDTO);

                return existingReminder;
            })
            .map(reminderRepository::save)
            .map(savedReminder -> {
                reminderSearchRepository.index(savedReminder);
                return savedReminder;
            })
            .map(reminderMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReminderDTO> findAll(Pageable pageable) {
        LOG.debug("Request to get all Reminders");
        return reminderRepository.findAll(pageable).map(reminderMapper::toDto);
    }

    public Page<ReminderDTO> findAllWithEagerRelationships(Pageable pageable) {
        return reminderRepository.findAllWithEagerRelationships(pageable).map(reminderMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ReminderDTO> findOne(Long id) {
        LOG.debug("Request to get Reminder : {}", id);
        return reminderRepository.findOneWithEagerRelationships(id).map(reminderMapper::toDto);
    }

    @Override
    public void delete(Long id) {
        LOG.debug("Request to delete Reminder : {}", id);
        reminderRepository.deleteById(id);
        reminderSearchRepository.deleteFromIndexById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReminderDTO> search(String query, Pageable pageable) {
        LOG.debug("Request to search for a page of Reminders for query {}", query);
        return reminderSearchRepository.search(query, pageable).map(reminderMapper::toDto);
    }
}
