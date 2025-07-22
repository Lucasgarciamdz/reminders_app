package ar.edu.um.domain;

import static org.assertj.core.api.Assertions.assertThat;

import ar.edu.um.domain.enumeration.Priority;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/**
 * Simple unit tests for Reminder validation and basic functionality.
 */
class ReminderValidationTest {

    @Test
    void shouldCreateReminderWithRequiredFields() {
        // Given
        String title = "Test Reminder";
        Instant dueDate = Instant.now().plusSeconds(3600);
        Priority priority = Priority.MEDIUM;
        Instant createdDate = Instant.now();

        // When
        Reminder reminder = new Reminder()
            .title(title)
            .dueDate(dueDate)
            .isCompleted(false)
            .priority(priority)
            .createdDate(createdDate);

        // Then
        assertThat(reminder.getTitle()).isEqualTo(title);
        assertThat(reminder.getDueDate()).isEqualTo(dueDate);
        assertThat(reminder.getIsCompleted()).isFalse();
        assertThat(reminder.getPriority()).isEqualTo(priority);
        assertThat(reminder.getCreatedDate()).isEqualTo(createdDate);
    }

    @Test
    void shouldSetOptionalFields() {
        // Given
        Reminder reminder = new Reminder();
        String description = "This is a test description";
        Instant lastModified = Instant.now();

        // When
        reminder.description(description).lastModifiedDate(lastModified);

        // Then
        assertThat(reminder.getDescription()).isEqualTo(description);
        assertThat(reminder.getLastModifiedDate()).isEqualTo(lastModified);
    }

    @Test
    void shouldHandleNullOptionalFields() {
        // Given
        Reminder reminder = new Reminder()
            .title("Test")
            .dueDate(Instant.now())
            .isCompleted(false)
            .priority(Priority.LOW)
            .createdDate(Instant.now());

        // When/Then
        assertThat(reminder.getDescription()).isNull();
        assertThat(reminder.getLastModifiedDate()).isNull();
        assertThat(reminder.getCategory()).isNull();
        assertThat(reminder.getUser()).isNull();
    }

    @Test
    void shouldUpdateReminderFields() {
        // Given
        Reminder reminder = new Reminder()
            .title("Original Title")
            .isCompleted(false)
            .priority(Priority.LOW);

        // When
        reminder.title("Updated Title")
            .isCompleted(true)
            .priority(Priority.HIGH);

        // Then
        assertThat(reminder.getTitle()).isEqualTo("Updated Title");
        assertThat(reminder.getIsCompleted()).isTrue();
        assertThat(reminder.getPriority()).isEqualTo(Priority.HIGH);
    }

    @Test
    void shouldGenerateCorrectToString() {
        // Given
        Reminder reminder = new Reminder()
            .id(1L)
            .title("Test Reminder")
            .description("Test Description")
            .isCompleted(false)
            .priority(Priority.MEDIUM);

        // When
        String toString = reminder.toString();

        // Then
        assertThat(toString).contains("id=1");
        assertThat(toString).contains("title='Test Reminder'");
        assertThat(toString).contains("description='Test Description'");
        assertThat(toString).contains("isCompleted='false'");
        assertThat(toString).contains("priority='MEDIUM'");
    }
}