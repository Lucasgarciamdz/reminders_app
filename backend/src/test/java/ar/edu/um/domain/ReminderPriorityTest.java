package ar.edu.um.domain;

import static org.assertj.core.api.Assertions.assertThat;

import ar.edu.um.domain.enumeration.Priority;
import java.time.Instant;
import org.junit.jupiter.api.Test;

/**
 * Simple unit tests for Reminder priority system functionality.
 */
class ReminderPriorityTest {

    @Test
    void shouldSetAllPriorityLevels() {
        // Given
        Reminder reminder = createBasicReminder();

        // Test LOW priority
        reminder.priority(Priority.LOW);
        assertThat(reminder.getPriority()).isEqualTo(Priority.LOW);

        // Test MEDIUM priority
        reminder.priority(Priority.MEDIUM);
        assertThat(reminder.getPriority()).isEqualTo(Priority.MEDIUM);

        // Test HIGH priority
        reminder.priority(Priority.HIGH);
        assertThat(reminder.getPriority()).isEqualTo(Priority.HIGH);

        // Test URGENT priority
        reminder.priority(Priority.URGENT);
        assertThat(reminder.getPriority()).isEqualTo(Priority.URGENT);
    }

    @Test
    void shouldComparePriorityValues() {
        // Given
        Reminder lowPriorityReminder = createBasicReminder().priority(Priority.LOW);
        Reminder mediumPriorityReminder = createBasicReminder().priority(Priority.MEDIUM);
        Reminder highPriorityReminder = createBasicReminder().priority(Priority.HIGH);
        Reminder urgentPriorityReminder = createBasicReminder().priority(Priority.URGENT);

        // Then
        assertThat(lowPriorityReminder.getPriority()).isEqualTo(Priority.LOW);
        assertThat(mediumPriorityReminder.getPriority()).isEqualTo(Priority.MEDIUM);
        assertThat(highPriorityReminder.getPriority()).isEqualTo(Priority.HIGH);
        assertThat(urgentPriorityReminder.getPriority()).isEqualTo(Priority.URGENT);

        // Verify they are different
        assertThat(lowPriorityReminder.getPriority()).isNotEqualTo(urgentPriorityReminder.getPriority());
        assertThat(mediumPriorityReminder.getPriority()).isNotEqualTo(highPriorityReminder.getPriority());
    }

    @Test
    void shouldHandlePriorityInToString() {
        // Given
        Reminder reminder = createBasicReminder().priority(Priority.URGENT);

        // When
        String toString = reminder.toString();

        // Then
        assertThat(toString).contains("priority='URGENT'");
    }

    @Test
    void shouldUpdatePriorityMultipleTimes() {
        // Given
        Reminder reminder = createBasicReminder().priority(Priority.LOW);

        // When - Update priority multiple times
        assertThat(reminder.getPriority()).isEqualTo(Priority.LOW);

        reminder.priority(Priority.MEDIUM);
        assertThat(reminder.getPriority()).isEqualTo(Priority.MEDIUM);

        reminder.priority(Priority.URGENT);
        assertThat(reminder.getPriority()).isEqualTo(Priority.URGENT);

        reminder.priority(Priority.HIGH);
        assertThat(reminder.getPriority()).isEqualTo(Priority.HIGH);
    }

    @Test
    void shouldMaintainPriorityWithOtherFields() {
        // Given
        Reminder reminder = createBasicReminder()
            .priority(Priority.HIGH)
            .title("High Priority Task")
            .description("This is urgent");

        // When
        reminder.isCompleted(true);

        // Then - Priority should remain unchanged
        assertThat(reminder.getPriority()).isEqualTo(Priority.HIGH);
        assertThat(reminder.getTitle()).isEqualTo("High Priority Task");
        assertThat(reminder.getIsCompleted()).isTrue();
    }

    private Reminder createBasicReminder() {
        return new Reminder()
            .title("Test Reminder")
            .dueDate(Instant.now().plusSeconds(3600))
            .isCompleted(false)
            .createdDate(Instant.now());
    }
}