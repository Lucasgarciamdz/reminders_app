package ar.edu.um.service.criteria;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Objects;
import java.util.function.BiFunction;
import java.util.function.Function;
import org.assertj.core.api.Condition;
import org.junit.jupiter.api.Test;

class CategoryCriteriaTest {

    @Test
    void newCategoryCriteriaHasAllFiltersNullTest() {
        var categoryCriteria = new CategoryCriteria();
        assertThat(categoryCriteria).is(criteriaFiltersAre(Objects::isNull));
    }

    @Test
    void categoryCriteriaFluentMethodsCreatesFiltersTest() {
        var categoryCriteria = new CategoryCriteria();

        setAllFilters(categoryCriteria);

        assertThat(categoryCriteria).is(criteriaFiltersAre(Objects::nonNull));
    }

    @Test
    void categoryCriteriaCopyCreatesNullFilterTest() {
        var categoryCriteria = new CategoryCriteria();
        var copy = categoryCriteria.copy();

        assertThat(categoryCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::isNull)),
            criteria -> assertThat(criteria).isEqualTo(categoryCriteria)
        );
    }

    @Test
    void categoryCriteriaCopyDuplicatesEveryExistingFilterTest() {
        var categoryCriteria = new CategoryCriteria();
        setAllFilters(categoryCriteria);

        var copy = categoryCriteria.copy();

        assertThat(categoryCriteria).satisfies(
            criteria ->
                assertThat(criteria).is(
                    copyFiltersAre(copy, (a, b) -> (a == null || a instanceof Boolean) ? a == b : (a != b && a.equals(b)))
                ),
            criteria -> assertThat(criteria).isEqualTo(copy),
            criteria -> assertThat(criteria).hasSameHashCodeAs(copy)
        );

        assertThat(copy).satisfies(
            criteria -> assertThat(criteria).is(criteriaFiltersAre(Objects::nonNull)),
            criteria -> assertThat(criteria).isEqualTo(categoryCriteria)
        );
    }

    @Test
    void toStringVerifier() {
        var categoryCriteria = new CategoryCriteria();

        assertThat(categoryCriteria).hasToString("CategoryCriteria{}");
    }

    private static void setAllFilters(CategoryCriteria categoryCriteria) {
        categoryCriteria.id();
        categoryCriteria.name();
        categoryCriteria.color();
        categoryCriteria.distinct();
    }

    private static Condition<CategoryCriteria> criteriaFiltersAre(Function<Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId()) &&
                condition.apply(criteria.getName()) &&
                condition.apply(criteria.getColor()) &&
                condition.apply(criteria.getDistinct()),
            "every filter matches"
        );
    }

    private static Condition<CategoryCriteria> copyFiltersAre(CategoryCriteria copy, BiFunction<Object, Object, Boolean> condition) {
        return new Condition<>(
            criteria ->
                condition.apply(criteria.getId(), copy.getId()) &&
                condition.apply(criteria.getName(), copy.getName()) &&
                condition.apply(criteria.getColor(), copy.getColor()) &&
                condition.apply(criteria.getDistinct(), copy.getDistinct()),
            "every filter matches"
        );
    }
}
