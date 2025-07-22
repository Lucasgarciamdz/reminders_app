package ar.edu.um.service.criteria;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Objects;
import java.util.function.BiFunction;
import java.util.function.Function;
import org.assertj.core.api.Condition;
import org.junit.jupiter.api.Test;

class ReminderCriteriaTest {

    @Test
    void newReminderCriteriaHasAllFiltersNullTest() {
        var reminderCriteria = new ReminderCriteria();
        assertThat(reminderCriteria).is(criteriaFiltersAre(Objects::isNull));
    }

    @Test
    void reminderCriteriaFluentMethodsCreatesFiltersTest() {
        var reminderCriteria = new ReminderCriteria();

        setAllFilters(reminderCriteria);

        assertThat(reminderCriteria).is(criteriaFiltersAre(Objects::nonNull));
    }

    @Test
    void reminderCriteriaCopyCreatesNullFilterTest() {
        var reminderCriteria = new ReminderCriteria();
        var copy = reminderCriteria.copy();

        assertThat(reminderCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::isNull)),
            criteria -> assertThat(criteria).isEqualTo(reminderCriteria)
        );
    }

    @Test
    void reminderCriteriaCopyDuplicatesEveryExistingFilterTest() {
        var reminderCriteria = new ReminderCriteria();
        setAllFilters(reminderCriteria);

        var copy = reminderCriteria.copy();

        assertThat(reminderCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::nonNull)),
            criteria -> assertThat(criteria).isEqualTo(reminderCriteria)
        );
    }

    @Test
    void toStringVerifier() {
        var reminderCriteria = new ReminderCriteria();

        assertThat(reminderCriteria).hasToString("ReminderCriteria{}");
    }

    private static void setAllFilters(ReminderCriteria reminderCriteria) {
        reminderCriteria.id();
        reminderCriteria.title();
        reminderCriteria.dueDate();
        reminderCriteria.isCompleted();
        reminderCriteria.priority();
        reminderCriteria.createdDate();
        reminderCriteria.lastModifiedDate();
        reminderCriteria.categoryId();
        reminderCriteria.userId();
        reminderCriteria.tagsId();
        reminderCriteria.distinct();
    }

    private static Condition<ReminderCriteria> criteriaFiltersAre(Function<Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId()) &&
                condition.apply(criteria.getTitle()) &&
                condition.apply(criteria.getDueDate()) &&
                condition.apply(criteria.getIsCompleted()) &&
                condition.apply(criteria.getPriority()) &&
                condition.apply(criteria.getCreatedDate()) &&
                condition.apply(criteria.getLastModifiedDate()) &&
                condition.apply(criteria.getCategoryId()) &&
                condition.apply(criteria.getUserId()) &&
                condition.apply(criteria.getTagsId()) &&
                condition.apply(criteria.getDistinct()),
            "every filter matches"
        );
    }

    private static Condition<ReminderCriteria> copyFiltersAre(ReminderCriteria copy, BiFunction<Object, Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId(), copy.getId()) &&
                condition.apply(criteria.getTitle(), copy.getTitle()) &&
                condition.apply(criteria.getDueDate(), copy.getDueDate()) &&
                condition.apply(criteria.getIsCompleted(), copy.getIsCompleted()) &&
                condition.apply(criteria.getPriority(), copy.getPriority()) &&
                condition.apply(criteria.getCreatedDate(), copy.getCreatedDate()) &&
                condition.apply(criteria.getLastModifiedDate(), copy.getLastModifiedDate()) &&
                condition.apply(criteria.getCategoryId(), copy.getCategoryId()) &&
                condition.apply(criteria.getUserId(), copy.getUserId()) &&
                condition.apply(criteria.getTagsId(), copy.getTagsId()) &&
                condition.apply(criteria.getDistinct(), copy.getDistinct()),
            "every filter matches"
        );
    }
}
