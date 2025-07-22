package ar.edu.um.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Simple unit tests for Category basic functionality.
 */
class CategoryBasicTest {

    @Test
    void shouldCreateCategoryWithRequiredFields() {
        // Given
        String name = "Work";

        // When
        Category category = new Category().name(name);

        // Then
        assertThat(category.getName()).isEqualTo(name);
    }

    @Test
    void shouldSetOptionalFields() {
        // Given
        Category category = new Category().name("Personal");
        String color = "#FF5733";
        String description = "Personal tasks and reminders";

        // When
        category.color(color).description(description);

        // Then
        assertThat(category.getColor()).isEqualTo(color);
        assertThat(category.getDescription()).isEqualTo(description);
    }

    @Test
    void shouldHandleNullOptionalFields() {
        // Given/When
        Category category = new Category().name("Test Category");

        // Then
        assertThat(category.getName()).isEqualTo("Test Category");
        assertThat(category.getColor()).isNull();
        assertThat(category.getDescription()).isNull();
    }

    @Test
    void shouldUpdateCategoryFields() {
        // Given
        Category category = new Category()
            .name("Original Name")
            .color("#000000")
            .description("Original description");

        // When
        category.name("Updated Name")
            .color("#FFFFFF")
            .description("Updated description");

        // Then
        assertThat(category.getName()).isEqualTo("Updated Name");
        assertThat(category.getColor()).isEqualTo("#FFFFFF");
        assertThat(category.getDescription()).isEqualTo("Updated description");
    }

    @Test
    void shouldGenerateCorrectToString() {
        // Given
        Category category = new Category()
            .id(1L)
            .name("Work")
            .color("#FF5733")
            .description("Work-related tasks");

        // When
        String toString = category.toString();

        // Then
        assertThat(toString).contains("id=1");
        assertThat(toString).contains("name='Work'");
        assertThat(toString).contains("color='#FF5733'");
        assertThat(toString).contains("description='Work-related tasks'");
    }

    @Test
    void shouldHandleColorValidation() {
        // Given
        Category category = new Category().name("Test");

        // When - Set valid hex color
        category.color("#FF5733");
        assertThat(category.getColor()).isEqualTo("#FF5733");

        // When - Set short hex color
        category.color("#FFF");
        assertThat(category.getColor()).isEqualTo("#FFF");

        // When - Set null color
        category.color(null);
        assertThat(category.getColor()).isNull();
    }

    @Test
    void shouldEqualCategoriesWithSameId() {
        // Given
        Category category1 = new Category().id(1L).name("Test");
        Category category2 = new Category().id(1L).name("Different Name");

        // When/Then
        assertThat(category1).isEqualTo(category2);
        assertThat(category1.hashCode()).isEqualTo(category2.hashCode());
    }

    @Test
    void shouldNotEqualCategoriesWithDifferentIds() {
        // Given
        Category category1 = new Category().id(1L).name("Test");
        Category category2 = new Category().id(2L).name("Test");

        // When/Then
        assertThat(category1).isNotEqualTo(category2);
    }

    @Test
    void shouldNotEqualCategoryWithNullId() {
        // Given
        Category category1 = new Category().id(1L).name("Test");
        Category category2 = new Category().name("Test"); // No ID set

        // When/Then
        assertThat(category1).isNotEqualTo(category2);
    }
}