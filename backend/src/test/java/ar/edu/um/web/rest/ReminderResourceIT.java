package ar.edu.um.web.rest;

import static ar.edu.um.domain.ReminderAsserts.*;
import static ar.edu.um.web.rest.TestUtil.createUpdateProxyForBean;
import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import ar.edu.um.IntegrationTest;
import ar.edu.um.domain.Category;
import ar.edu.um.domain.Reminder;
import ar.edu.um.domain.Tag;
import ar.edu.um.domain.User;
import ar.edu.um.domain.enumeration.Priority;
import ar.edu.um.repository.ReminderRepository;
import ar.edu.um.repository.UserRepository;
import ar.edu.um.repository.search.ReminderSearchRepository;
import ar.edu.um.service.ReminderService;
import ar.edu.um.service.dto.ReminderDTO;
import ar.edu.um.service.mapper.ReminderMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import org.assertj.core.util.IterableUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.util.Streamable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests for the {@link ReminderResource} REST controller.
 */
@IntegrationTest
@ExtendWith(MockitoExtension.class)
@AutoConfigureMockMvc
@WithMockUser
class ReminderResourceIT {

    private static final String DEFAULT_TITLE = "AAAAAAAAAA";
    private static final String UPDATED_TITLE = "BBBBBBBBBB";

    private static final String DEFAULT_DESCRIPTION = "AAAAAAAAAA";
    private static final String UPDATED_DESCRIPTION = "BBBBBBBBBB";

    private static final Instant DEFAULT_DUE_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_DUE_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Boolean DEFAULT_IS_COMPLETED = false;
    private static final Boolean UPDATED_IS_COMPLETED = true;

    private static final Priority DEFAULT_PRIORITY = Priority.LOW;
    private static final Priority UPDATED_PRIORITY = Priority.MEDIUM;

    private static final Instant DEFAULT_CREATED_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_CREATED_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final Instant DEFAULT_LAST_MODIFIED_DATE = Instant.ofEpochMilli(0L);
    private static final Instant UPDATED_LAST_MODIFIED_DATE = Instant.now().truncatedTo(ChronoUnit.MILLIS);

    private static final String ENTITY_API_URL = "/api/reminders";
    private static final String ENTITY_API_URL_ID = ENTITY_API_URL + "/{id}";
    private static final String ENTITY_SEARCH_API_URL = "/api/reminders/_search";

    private static Random random = new Random();
    private static AtomicLong longCount = new AtomicLong(random.nextInt() + (2 * Integer.MAX_VALUE));

    @Autowired
    private ObjectMapper om;

    @Autowired
    private ReminderRepository reminderRepository;

    @Autowired
    private UserRepository userRepository;

    @Mock
    private ReminderRepository reminderRepositoryMock;

    @Autowired
    private ReminderMapper reminderMapper;

    @Mock
    private ReminderService reminderServiceMock;

    @Autowired
    private ReminderSearchRepository reminderSearchRepository;

    @Autowired
    private EntityManager em;

    @Autowired
    private MockMvc restReminderMockMvc;

    private Reminder reminder;

    private Reminder insertedReminder;

    /**
     * Create an entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Reminder createEntity() {
        return new Reminder()
            .title(DEFAULT_TITLE)
            .description(DEFAULT_DESCRIPTION)
            .dueDate(DEFAULT_DUE_DATE)
            .isCompleted(DEFAULT_IS_COMPLETED)
            .priority(DEFAULT_PRIORITY)
            .createdDate(DEFAULT_CREATED_DATE)
            .lastModifiedDate(DEFAULT_LAST_MODIFIED_DATE);
    }

    /**
     * Create an updated entity for this test.
     *
     * This is a static method, as tests for other entities might also need it,
     * if they test an entity which requires the current entity.
     */
    public static Reminder createUpdatedEntity() {
        return new Reminder()
            .title(UPDATED_TITLE)
            .description(UPDATED_DESCRIPTION)
            .dueDate(UPDATED_DUE_DATE)
            .isCompleted(UPDATED_IS_COMPLETED)
            .priority(UPDATED_PRIORITY)
            .createdDate(UPDATED_CREATED_DATE)
            .lastModifiedDate(UPDATED_LAST_MODIFIED_DATE);
    }

    @BeforeEach
    void initTest() {
        reminder = createEntity();
    }

    @AfterEach
    void cleanup() {
        if (insertedReminder != null) {
            reminderRepository.delete(insertedReminder);
            reminderSearchRepository.delete(insertedReminder);
            insertedReminder = null;
        }
    }

    @Test
    @Transactional
    void createReminder() throws Exception {
        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        // Create the Reminder
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);
        var returnedReminderDTO = om.readValue(
            restReminderMockMvc
                .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(reminderDTO)))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString(),
            ReminderDTO.class
        );

        // Validate the Reminder in the database
        assertIncrementedRepositoryCount(databaseSizeBeforeCreate);
        var returnedReminder = reminderMapper.toEntity(returnedReminderDTO);
        assertReminderUpdatableFieldsEquals(returnedReminder, getPersistedReminder(returnedReminder));

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore + 1);
            });

        insertedReminder = returnedReminder;
    }

    @Test
    @Transactional
    void createReminderWithExistingId() throws Exception {
        // Create the Reminder with an existing ID
        reminder.setId(1L);
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        long databaseSizeBeforeCreate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());

        // An entity with an existing ID cannot be created, so this API call must fail
        restReminderMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(reminderDTO)))
            .andExpect(status().isBadRequest());

        // Validate the Reminder in the database
        assertSameRepositoryCount(databaseSizeBeforeCreate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void checkTitleIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        // set the field null
        reminder.setTitle(null);

        // Create the Reminder, which fails.
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        restReminderMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(reminderDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);

        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void checkDueDateIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        // set the field null
        reminder.setDueDate(null);

        // Create the Reminder, which fails.
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        restReminderMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(reminderDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);

        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void checkIsCompletedIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        // set the field null
        reminder.setIsCompleted(null);

        // Create the Reminder, which fails.
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        restReminderMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(reminderDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);

        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void checkPriorityIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        // set the field null
        reminder.setPriority(null);

        // Create the Reminder, which fails.
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        restReminderMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(reminderDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);

        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void checkCreatedDateIsRequired() throws Exception {
        long databaseSizeBeforeTest = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        // set the field null
        reminder.setCreatedDate(null);

        // Create the Reminder, which fails.
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        restReminderMockMvc
            .perform(post(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(reminderDTO)))
            .andExpect(status().isBadRequest());

        assertSameRepositoryCount(databaseSizeBeforeTest);

        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void getAllReminders() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList
        restReminderMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(reminder.getId().intValue())))
            .andExpect(jsonPath("$.[*].title").value(hasItem(DEFAULT_TITLE)))
            .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].dueDate").value(hasItem(DEFAULT_DUE_DATE.toString())))
            .andExpect(jsonPath("$.[*].isCompleted").value(hasItem(DEFAULT_IS_COMPLETED)))
            .andExpect(jsonPath("$.[*].priority").value(hasItem(DEFAULT_PRIORITY.toString())))
            .andExpect(jsonPath("$.[*].createdDate").value(hasItem(DEFAULT_CREATED_DATE.toString())))
            .andExpect(jsonPath("$.[*].lastModifiedDate").value(hasItem(DEFAULT_LAST_MODIFIED_DATE.toString())));
    }

    @SuppressWarnings({ "unchecked" })
    void getAllRemindersWithEagerRelationshipsIsEnabled() throws Exception {
        when(reminderServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restReminderMockMvc.perform(get(ENTITY_API_URL + "?eagerload=true")).andExpect(status().isOk());

        verify(reminderServiceMock, times(1)).findAllWithEagerRelationships(any());
    }

    @SuppressWarnings({ "unchecked" })
    void getAllRemindersWithEagerRelationshipsIsNotEnabled() throws Exception {
        when(reminderServiceMock.findAllWithEagerRelationships(any())).thenReturn(new PageImpl(new ArrayList<>()));

        restReminderMockMvc.perform(get(ENTITY_API_URL + "?eagerload=false")).andExpect(status().isOk());
        verify(reminderRepositoryMock, times(1)).findAll(any(Pageable.class));
    }

    @Test
    @Transactional
    void getReminder() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get the reminder
        restReminderMockMvc
            .perform(get(ENTITY_API_URL_ID, reminder.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.id").value(reminder.getId().intValue()))
            .andExpect(jsonPath("$.title").value(DEFAULT_TITLE))
            .andExpect(jsonPath("$.description").value(DEFAULT_DESCRIPTION))
            .andExpect(jsonPath("$.dueDate").value(DEFAULT_DUE_DATE.toString()))
            .andExpect(jsonPath("$.isCompleted").value(DEFAULT_IS_COMPLETED))
            .andExpect(jsonPath("$.priority").value(DEFAULT_PRIORITY.toString()))
            .andExpect(jsonPath("$.createdDate").value(DEFAULT_CREATED_DATE.toString()))
            .andExpect(jsonPath("$.lastModifiedDate").value(DEFAULT_LAST_MODIFIED_DATE.toString()));
    }

    @Test
    @Transactional
    void getRemindersByIdFiltering() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        Long id = reminder.getId();

        defaultReminderFiltering("id.equals=" + id, "id.notEquals=" + id);

        defaultReminderFiltering("id.greaterThanOrEqual=" + id, "id.greaterThan=" + id);

        defaultReminderFiltering("id.lessThanOrEqual=" + id, "id.lessThan=" + id);
    }

    @Test
    @Transactional
    void getAllRemindersByTitleIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where title equals to
        defaultReminderFiltering("title.equals=" + DEFAULT_TITLE, "title.equals=" + UPDATED_TITLE);
    }

    @Test
    @Transactional
    void getAllRemindersByTitleIsInShouldWork() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where title in
        defaultReminderFiltering("title.in=" + DEFAULT_TITLE + "," + UPDATED_TITLE, "title.in=" + UPDATED_TITLE);
    }

    @Test
    @Transactional
    void getAllRemindersByTitleIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where title is not null
        defaultReminderFiltering("title.specified=true", "title.specified=false");
    }

    @Test
    @Transactional
    void getAllRemindersByTitleContainsSomething() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where title contains
        defaultReminderFiltering("title.contains=" + DEFAULT_TITLE, "title.contains=" + UPDATED_TITLE);
    }

    @Test
    @Transactional
    void getAllRemindersByTitleNotContainsSomething() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where title does not contain
        defaultReminderFiltering("title.doesNotContain=" + UPDATED_TITLE, "title.doesNotContain=" + DEFAULT_TITLE);
    }

    @Test
    @Transactional
    void getAllRemindersByDueDateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where dueDate equals to
        defaultReminderFiltering("dueDate.equals=" + DEFAULT_DUE_DATE, "dueDate.equals=" + UPDATED_DUE_DATE);
    }

    @Test
    @Transactional
    void getAllRemindersByDueDateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where dueDate in
        defaultReminderFiltering("dueDate.in=" + DEFAULT_DUE_DATE + "," + UPDATED_DUE_DATE, "dueDate.in=" + UPDATED_DUE_DATE);
    }

    @Test
    @Transactional
    void getAllRemindersByDueDateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where dueDate is not null
        defaultReminderFiltering("dueDate.specified=true", "dueDate.specified=false");
    }

    @Test
    @Transactional
    void getAllRemindersByIsCompletedIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where isCompleted equals to
        defaultReminderFiltering("isCompleted.equals=" + DEFAULT_IS_COMPLETED, "isCompleted.equals=" + UPDATED_IS_COMPLETED);
    }

    @Test
    @Transactional
    void getAllRemindersByIsCompletedIsInShouldWork() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where isCompleted in
        defaultReminderFiltering(
            "isCompleted.in=" + DEFAULT_IS_COMPLETED + "," + UPDATED_IS_COMPLETED,
            "isCompleted.in=" + UPDATED_IS_COMPLETED
        );
    }

    @Test
    @Transactional
    void getAllRemindersByIsCompletedIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where isCompleted is not null
        defaultReminderFiltering("isCompleted.specified=true", "isCompleted.specified=false");
    }

    @Test
    @Transactional
    void getAllRemindersByPriorityIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where priority equals to
        defaultReminderFiltering("priority.equals=" + DEFAULT_PRIORITY, "priority.equals=" + UPDATED_PRIORITY);
    }

    @Test
    @Transactional
    void getAllRemindersByPriorityIsInShouldWork() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where priority in
        defaultReminderFiltering("priority.in=" + DEFAULT_PRIORITY + "," + UPDATED_PRIORITY, "priority.in=" + UPDATED_PRIORITY);
    }

    @Test
    @Transactional
    void getAllRemindersByPriorityIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where priority is not null
        defaultReminderFiltering("priority.specified=true", "priority.specified=false");
    }

    @Test
    @Transactional
    void getAllRemindersByCreatedDateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where createdDate equals to
        defaultReminderFiltering("createdDate.equals=" + DEFAULT_CREATED_DATE, "createdDate.equals=" + UPDATED_CREATED_DATE);
    }

    @Test
    @Transactional
    void getAllRemindersByCreatedDateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where createdDate in
        defaultReminderFiltering(
            "createdDate.in=" + DEFAULT_CREATED_DATE + "," + UPDATED_CREATED_DATE,
            "createdDate.in=" + UPDATED_CREATED_DATE
        );
    }

    @Test
    @Transactional
    void getAllRemindersByCreatedDateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where createdDate is not null
        defaultReminderFiltering("createdDate.specified=true", "createdDate.specified=false");
    }

    @Test
    @Transactional
    void getAllRemindersByLastModifiedDateIsEqualToSomething() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where lastModifiedDate equals to
        defaultReminderFiltering(
            "lastModifiedDate.equals=" + DEFAULT_LAST_MODIFIED_DATE,
            "lastModifiedDate.equals=" + UPDATED_LAST_MODIFIED_DATE
        );
    }

    @Test
    @Transactional
    void getAllRemindersByLastModifiedDateIsInShouldWork() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where lastModifiedDate in
        defaultReminderFiltering(
            "lastModifiedDate.in=" + DEFAULT_LAST_MODIFIED_DATE + "," + UPDATED_LAST_MODIFIED_DATE,
            "lastModifiedDate.in=" + UPDATED_LAST_MODIFIED_DATE
        );
    }

    @Test
    @Transactional
    void getAllRemindersByLastModifiedDateIsNullOrNotNull() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        // Get all the reminderList where lastModifiedDate is not null
        defaultReminderFiltering("lastModifiedDate.specified=true", "lastModifiedDate.specified=false");
    }

    @Test
    @Transactional
    void getAllRemindersByCategoryIsEqualToSomething() throws Exception {
        Category category;
        if (TestUtil.findAll(em, Category.class).isEmpty()) {
            reminderRepository.saveAndFlush(reminder);
            category = CategoryResourceIT.createEntity();
        } else {
            category = TestUtil.findAll(em, Category.class).get(0);
        }
        em.persist(category);
        em.flush();
        reminder.setCategory(category);
        reminderRepository.saveAndFlush(reminder);
        Long categoryId = category.getId();
        // Get all the reminderList where category equals to categoryId
        defaultReminderShouldBeFound("categoryId.equals=" + categoryId);

        // Get all the reminderList where category equals to (categoryId + 1)
        defaultReminderShouldNotBeFound("categoryId.equals=" + (categoryId + 1));
    }

    @Test
    @Transactional
    void getAllRemindersByUserIsEqualToSomething() throws Exception {
        User user;
        if (TestUtil.findAll(em, User.class).isEmpty()) {
            reminderRepository.saveAndFlush(reminder);
            user = UserResourceIT.createEntity();
        } else {
            user = TestUtil.findAll(em, User.class).get(0);
        }
        em.persist(user);
        em.flush();
        reminder.setUser(user);
        reminderRepository.saveAndFlush(reminder);
        Long userId = user.getId();
        // Get all the reminderList where user equals to userId
        defaultReminderShouldBeFound("userId.equals=" + userId);

        // Get all the reminderList where user equals to (userId + 1)
        defaultReminderShouldNotBeFound("userId.equals=" + (userId + 1));
    }

    @Test
    @Transactional
    void getAllRemindersByTagsIsEqualToSomething() throws Exception {
        Tag tags;
        if (TestUtil.findAll(em, Tag.class).isEmpty()) {
            reminderRepository.saveAndFlush(reminder);
            tags = TagResourceIT.createEntity();
        } else {
            tags = TestUtil.findAll(em, Tag.class).get(0);
        }
        em.persist(tags);
        em.flush();
        reminder.addTags(tags);
        reminderRepository.saveAndFlush(reminder);
        Long tagsId = tags.getId();
        // Get all the reminderList where tags equals to tagsId
        defaultReminderShouldBeFound("tagsId.equals=" + tagsId);

        // Get all the reminderList where tags equals to (tagsId + 1)
        defaultReminderShouldNotBeFound("tagsId.equals=" + (tagsId + 1));
    }

    private void defaultReminderFiltering(String shouldBeFound, String shouldNotBeFound) throws Exception {
        defaultReminderShouldBeFound(shouldBeFound);
        defaultReminderShouldNotBeFound(shouldNotBeFound);
    }

    /**
     * Executes the search, and checks that the default entity is returned.
     */
    private void defaultReminderShouldBeFound(String filter) throws Exception {
        restReminderMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(reminder.getId().intValue())))
            .andExpect(jsonPath("$.[*].title").value(hasItem(DEFAULT_TITLE)))
            .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION)))
            .andExpect(jsonPath("$.[*].dueDate").value(hasItem(DEFAULT_DUE_DATE.toString())))
            .andExpect(jsonPath("$.[*].isCompleted").value(hasItem(DEFAULT_IS_COMPLETED)))
            .andExpect(jsonPath("$.[*].priority").value(hasItem(DEFAULT_PRIORITY.toString())))
            .andExpect(jsonPath("$.[*].createdDate").value(hasItem(DEFAULT_CREATED_DATE.toString())))
            .andExpect(jsonPath("$.[*].lastModifiedDate").value(hasItem(DEFAULT_LAST_MODIFIED_DATE.toString())));

        // Check, that the count call also returns 1
        restReminderMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("1"));
    }

    /**
     * Executes the search, and checks that the default entity is not returned.
     */
    private void defaultReminderShouldNotBeFound(String filter) throws Exception {
        restReminderMockMvc
            .perform(get(ENTITY_API_URL + "?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$").isArray())
            .andExpect(jsonPath("$").isEmpty());

        // Check, that the count call also returns 0
        restReminderMockMvc
            .perform(get(ENTITY_API_URL + "/count?sort=id,desc&" + filter))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(content().string("0"));
    }

    @Test
    @Transactional
    void getNonExistingReminder() throws Exception {
        // Get the reminder
        restReminderMockMvc.perform(get(ENTITY_API_URL_ID, Long.MAX_VALUE)).andExpect(status().isNotFound());
    }

    @Test
    @Transactional
    void putExistingReminder() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        long databaseSizeBeforeUpdate = getRepositoryCount();
        reminderSearchRepository.save(reminder);
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());

        // Update the reminder
        Reminder updatedReminder = reminderRepository.findById(reminder.getId()).orElseThrow();
        // Disconnect from session so that the updates on updatedReminder are not directly saved in db
        em.detach(updatedReminder);
        updatedReminder
            .title(UPDATED_TITLE)
            .description(UPDATED_DESCRIPTION)
            .dueDate(UPDATED_DUE_DATE)
            .isCompleted(UPDATED_IS_COMPLETED)
            .priority(UPDATED_PRIORITY)
            .createdDate(UPDATED_CREATED_DATE)
            .lastModifiedDate(UPDATED_LAST_MODIFIED_DATE);
        ReminderDTO reminderDTO = reminderMapper.toDto(updatedReminder);

        restReminderMockMvc
            .perform(
                put(ENTITY_API_URL_ID, reminderDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(reminderDTO))
            )
            .andExpect(status().isOk());

        // Validate the Reminder in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertPersistedReminderToMatchAllProperties(updatedReminder);

        await()
            .atMost(5, TimeUnit.SECONDS)
            .untilAsserted(() -> {
                int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
                assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
                List<Reminder> reminderSearchList = Streamable.of(reminderSearchRepository.findAll()).toList();
                Reminder testReminderSearch = reminderSearchList.get(searchDatabaseSizeAfter - 1);

                assertReminderAllPropertiesEquals(testReminderSearch, updatedReminder);
            });
    }

    @Test
    @Transactional
    void putNonExistingReminder() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        reminder.setId(longCount.incrementAndGet());

        // Create the Reminder
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restReminderMockMvc
            .perform(
                put(ENTITY_API_URL_ID, reminderDTO.getId())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(reminderDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Reminder in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithIdMismatchReminder() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        reminder.setId(longCount.incrementAndGet());

        // Create the Reminder
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restReminderMockMvc
            .perform(
                put(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(om.writeValueAsBytes(reminderDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Reminder in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void putWithMissingIdPathParamReminder() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        reminder.setId(longCount.incrementAndGet());

        // Create the Reminder
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restReminderMockMvc
            .perform(put(ENTITY_API_URL).contentType(MediaType.APPLICATION_JSON).content(om.writeValueAsBytes(reminderDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Reminder in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void partialUpdateReminderWithPatch() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the reminder using partial update
        Reminder partialUpdatedReminder = new Reminder();
        partialUpdatedReminder.setId(reminder.getId());

        partialUpdatedReminder
            .title(UPDATED_TITLE)
            .description(UPDATED_DESCRIPTION)
            .dueDate(UPDATED_DUE_DATE)
            .createdDate(UPDATED_CREATED_DATE)
            .lastModifiedDate(UPDATED_LAST_MODIFIED_DATE);

        restReminderMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedReminder.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedReminder))
            )
            .andExpect(status().isOk());

        // Validate the Reminder in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertReminderUpdatableFieldsEquals(createUpdateProxyForBean(partialUpdatedReminder, reminder), getPersistedReminder(reminder));
    }

    @Test
    @Transactional
    void fullUpdateReminderWithPatch() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);

        long databaseSizeBeforeUpdate = getRepositoryCount();

        // Update the reminder using partial update
        Reminder partialUpdatedReminder = new Reminder();
        partialUpdatedReminder.setId(reminder.getId());

        partialUpdatedReminder
            .title(UPDATED_TITLE)
            .description(UPDATED_DESCRIPTION)
            .dueDate(UPDATED_DUE_DATE)
            .isCompleted(UPDATED_IS_COMPLETED)
            .priority(UPDATED_PRIORITY)
            .createdDate(UPDATED_CREATED_DATE)
            .lastModifiedDate(UPDATED_LAST_MODIFIED_DATE);

        restReminderMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, partialUpdatedReminder.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(partialUpdatedReminder))
            )
            .andExpect(status().isOk());

        // Validate the Reminder in the database

        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        assertReminderUpdatableFieldsEquals(partialUpdatedReminder, getPersistedReminder(partialUpdatedReminder));
    }

    @Test
    @Transactional
    void patchNonExistingReminder() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        reminder.setId(longCount.incrementAndGet());

        // Create the Reminder
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        // If the entity doesn't have an ID, it will throw BadRequestAlertException
        restReminderMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, reminderDTO.getId())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(reminderDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Reminder in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithIdMismatchReminder() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        reminder.setId(longCount.incrementAndGet());

        // Create the Reminder
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restReminderMockMvc
            .perform(
                patch(ENTITY_API_URL_ID, longCount.incrementAndGet())
                    .contentType("application/merge-patch+json")
                    .content(om.writeValueAsBytes(reminderDTO))
            )
            .andExpect(status().isBadRequest());

        // Validate the Reminder in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void patchWithMissingIdPathParamReminder() throws Exception {
        long databaseSizeBeforeUpdate = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        reminder.setId(longCount.incrementAndGet());

        // Create the Reminder
        ReminderDTO reminderDTO = reminderMapper.toDto(reminder);

        // If url ID doesn't match entity ID, it will throw BadRequestAlertException
        restReminderMockMvc
            .perform(patch(ENTITY_API_URL).contentType("application/merge-patch+json").content(om.writeValueAsBytes(reminderDTO)))
            .andExpect(status().isMethodNotAllowed());

        // Validate the Reminder in the database
        assertSameRepositoryCount(databaseSizeBeforeUpdate);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore);
    }

    @Test
    @Transactional
    void deleteReminder() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);
        reminderRepository.save(reminder);
        reminderSearchRepository.save(reminder);

        long databaseSizeBeforeDelete = getRepositoryCount();
        int searchDatabaseSizeBefore = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeBefore).isEqualTo(databaseSizeBeforeDelete);

        // Delete the reminder
        restReminderMockMvc
            .perform(delete(ENTITY_API_URL_ID, reminder.getId()).accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        // Validate the database contains one less item
        assertDecrementedRepositoryCount(databaseSizeBeforeDelete);
        int searchDatabaseSizeAfter = IterableUtil.sizeOf(reminderSearchRepository.findAll());
        assertThat(searchDatabaseSizeAfter).isEqualTo(searchDatabaseSizeBefore - 1);
    }

    @Test
    @Transactional
    void searchReminder() throws Exception {
        // Initialize the database
        insertedReminder = reminderRepository.saveAndFlush(reminder);
        reminderSearchRepository.save(reminder);

        // Search the reminder
        restReminderMockMvc
            .perform(get(ENTITY_SEARCH_API_URL + "?query=id:" + reminder.getId()))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_VALUE))
            .andExpect(jsonPath("$.[*].id").value(hasItem(reminder.getId().intValue())))
            .andExpect(jsonPath("$.[*].title").value(hasItem(DEFAULT_TITLE)))
            .andExpect(jsonPath("$.[*].description").value(hasItem(DEFAULT_DESCRIPTION.toString())))
            .andExpect(jsonPath("$.[*].dueDate").value(hasItem(DEFAULT_DUE_DATE.toString())))
            .andExpect(jsonPath("$.[*].isCompleted").value(hasItem(DEFAULT_IS_COMPLETED)))
            .andExpect(jsonPath("$.[*].priority").value(hasItem(DEFAULT_PRIORITY.toString())))
            .andExpect(jsonPath("$.[*].createdDate").value(hasItem(DEFAULT_CREATED_DATE.toString())))
            .andExpect(jsonPath("$.[*].lastModifiedDate").value(hasItem(DEFAULT_LAST_MODIFIED_DATE.toString())));
    }

    protected long getRepositoryCount() {
        return reminderRepository.count();
    }

    protected void assertIncrementedRepositoryCount(long countBefore) {
        assertThat(countBefore + 1).isEqualTo(getRepositoryCount());
    }

    protected void assertDecrementedRepositoryCount(long countBefore) {
        assertThat(countBefore - 1).isEqualTo(getRepositoryCount());
    }

    protected void assertSameRepositoryCount(long countBefore) {
        assertThat(countBefore).isEqualTo(getRepositoryCount());
    }

    protected Reminder getPersistedReminder(Reminder reminder) {
        return reminderRepository.findById(reminder.getId()).orElseThrow();
    }

    protected void assertPersistedReminderToMatchAllProperties(Reminder expectedReminder) {
        assertReminderAllPropertiesEquals(expectedReminder, getPersistedReminder(expectedReminder));
    }

    protected void assertPersistedReminderToMatchUpdatableProperties(Reminder expectedReminder) {
        assertReminderAllUpdatablePropertiesEquals(expectedReminder, getPersistedReminder(expectedReminder));
    }
}
