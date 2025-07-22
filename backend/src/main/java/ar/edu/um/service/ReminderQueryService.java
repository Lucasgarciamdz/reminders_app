package ar.edu.um.service;

import ar.edu.um.domain.*; // for static metamodels
import ar.edu.um.domain.Reminder;
import ar.edu.um.repository.ReminderRepository;
import ar.edu.um.repository.search.ReminderSearchRepository;
import ar.edu.um.service.criteria.ReminderCriteria;
import ar.edu.um.service.dto.ReminderDTO;
import ar.edu.um.service.mapper.ReminderMapper;
import jakarta.persistence.criteria.JoinType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tech.jhipster.service.QueryService;

/**
 * Service for executing complex queries for {@link Reminder} entities in the database.
 * The main input is a {@link ReminderCriteria} which gets converted to {@link Specification},
 * in a way that all the filters must apply.
 * It returns a {@link Page} of {@link ReminderDTO} which fulfills the criteria.
 */
@Service
@Transactional(readOnly = true)
public class ReminderQueryService extends QueryService<Reminder> {

    private static final Logger LOG = LoggerFactory.getLogger(ReminderQueryService.class);

    private final ReminderRepository reminderRepository;

    private final ReminderMapper reminderMapper;

    private final ReminderSearchRepository reminderSearchRepository;

    public ReminderQueryService(
        ReminderRepository reminderRepository,
        ReminderMapper reminderMapper,
        ReminderSearchRepository reminderSearchRepository
    ) {
        this.reminderRepository = reminderRepository;
        this.reminderMapper = reminderMapper;
        this.reminderSearchRepository = reminderSearchRepository;
    }

    /**
     * Return a {@link Page} of {@link ReminderDTO} which matches the criteria from the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @param page The page, which should be returned.
     * @return the matching entities.
     */
    @Transactional(readOnly = true)
    public Page<ReminderDTO> findByCriteria(ReminderCriteria criteria, Pageable page) {
        LOG.debug("find by criteria : {}, page: {}", criteria, page);
        final Specification<Reminder> specification = createSpecification(criteria);
        return reminderRepository.fetchBagRelationships(reminderRepository.findAll(specification, page)).map(reminderMapper::toDto);
    }

    /**
     * Return the number of matching entities in the database.
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the number of matching entities.
     */
    @Transactional(readOnly = true)
    public long countByCriteria(ReminderCriteria criteria) {
        LOG.debug("count by criteria : {}", criteria);
        final Specification<Reminder> specification = createSpecification(criteria);
        return reminderRepository.count(specification);
    }

    /**
     * Function to convert {@link ReminderCriteria} to a {@link Specification}
     * @param criteria The object which holds all the filters, which the entities should match.
     * @return the matching {@link Specification} of the entity.
     */
    protected Specification<Reminder> createSpecification(ReminderCriteria criteria) {
        Specification<Reminder> specification = Specification.where(null);
        if (criteria != null) {
            // This has to be called first, because the distinct method returns null
            specification = Specification.allOf(
                Boolean.TRUE.equals(criteria.getDistinct()) ? distinct(criteria.getDistinct()) : null,
                buildRangeSpecification(criteria.getId(), Reminder_.id),
                buildStringSpecification(criteria.getTitle(), Reminder_.title),
                buildRangeSpecification(criteria.getDueDate(), Reminder_.dueDate),
                buildSpecification(criteria.getIsCompleted(), Reminder_.isCompleted),
                buildSpecification(criteria.getPriority(), Reminder_.priority),
                buildRangeSpecification(criteria.getCreatedDate(), Reminder_.createdDate),
                buildRangeSpecification(criteria.getLastModifiedDate(), Reminder_.lastModifiedDate),
                buildSpecification(criteria.getCategoryId(), root -> root.join(Reminder_.category, JoinType.LEFT).get(Category_.id)),
                buildSpecification(criteria.getUserId(), root -> root.join(Reminder_.user, JoinType.LEFT).get(User_.id)),
                buildSpecification(criteria.getTagsId(), root -> root.join(Reminder_.tags, JoinType.LEFT).get(Tag_.id))
            );
        }
        return specification;
    }
}
