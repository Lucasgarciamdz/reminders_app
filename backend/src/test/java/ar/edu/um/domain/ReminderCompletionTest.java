package ar.edu.um.domain;

import static org.assertj.core.api.Assertions.assertThat;

import ar.edu.um.domain.enumeration.Priority;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/**
 * Simple unit tests for Reminder completion status functionality.
 */
class ReminderCompletionTest {

    @Test
    void shouldCreateReminderAsIncomplete() {
        // Given/When
        Reminder reminder = createBasicReminder().isCompleted(false);

        // Then
        assertThat(reminder.getIsCompleted()).isFalse();
    }

    @Test
    void shouldMarkReminderAsCompleted() {
        // Given
        Reminder reminder = createBasicReminder().isCompleted(false);

        // When
        reminder.isCompleted(true);

        // Then
        assertThat(reminder.getIsCompleted()).isTrue();
    }

    @Test
    void shouldToggleCompletionStatus() {
        // Given
        Reminder reminder = createBasicReminder().isCompleted(false);

        // When/Then - Toggle multiple times
        assertThat(reminder.getIsCompleted()).isFalse();

        reminder.isCompleted(true);
        assertThat(reminder.getIsCompleted()).isTrue();

        reminder.isCompleted(false);
        assertThat(reminder.getIsCompleted()).isFalse();

        reminder.isCompleted(true);
        assertThat(reminder.getIsCompleted()).isTrue();
    }

    @Test
    void shouldMaintainCompletionStatusWithOtherUpdates() {
        // Given
        Reminder reminder = createBasicReminder()
            .isCompleted(true)
            .title("Completed Task");

        // When - Update other fields
        reminder.priority(Priority.LOW)
            .description("Updated description")
            .lastModifiedDate(Instant.now());

        // Then - Completion status should remain
        assertThat(reminder.getIsCompleted()).isTrue();
        assertThat(reminder.getTitle()).isEqualTo("Completed Task");
        assertThat(reminder.getPriority()).isEqualTo(Priority.LOW);
        assertThat(reminder.getDescription()).isEqualTo("Updated description");
    }

    @Test
    void shouldHandleCompletionInToString() {
        // Given
        Reminder completedReminder = createBasicReminder().isCompleted(true);
        Reminder incompleteReminder = createBasicReminder().isCompleted(false);

        // When
        String completedString = completedReminder.toString();
        String incompleteString = incompleteReminder.toString();

        // Then
        assertThat(completedString).contains("isCompleted='true'");
        assertThat(incompleteString).contains("isCompleted='false'");
    }

    @Test
    void shouldWorkWithDifferentPrioritiesAndCompletion() {
        // Test completion with different priorities
        Priority[] priorities = {Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT};

        for (Priority priority : priorities) {
            // Given
            Reminder reminder = createBasicReminder()
                .priority(priority)
                .isCompleted(false);

            // When
            reminder.isCompleted(true);

            // Then
            assertThat(reminder.getIsCompleted()).isTrue();
            assertThat(reminder.getPriority()).isEqualTo(priority);
        }
    }

    @Test
    void shouldUpdateLastModifiedWhenCompleting() {
        // Given
        Reminder reminder = createBasicReminder().isCompleted(false);
        Instant beforeCompletion = Instant.now();

        // When
        reminder.isCompleted(true).lastModifiedDate(Instant.now());

        // Then
        assertThat(reminder.getIsCompleted()).isTrue();
        assertThat(reminder.getLastModifiedDate()).isAfter(beforeCompletion);
    }

    private Reminder createBasicReminder() {
        return new Reminder()
            .title("Test Reminder")
            .dueDate(Instant.now().plusSeconds(3600))
            .priority(Priority.MEDIUM)
            .createdDate(Instant.now());
    }
}