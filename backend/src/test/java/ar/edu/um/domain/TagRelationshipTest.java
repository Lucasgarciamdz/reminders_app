package ar.edu.um.domain;

import static org.assertj.core.api.Assertions.assertThat;

import ar.edu.um.domain.enumeration.Priority;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

/**
 * Simple unit tests for Tag-Reminder relationship functionality.
 */
class TagRelationshipTest {

    @Test
    void shouldCreateTagWithName() {
        // Given
        String tagName = "urgent";

        // When
        Tag tag = new Tag().name(tagName);

        // Then
        assertThat(tag.getName()).isEqualTo(tagName);
        assertThat(tag.getReminders()).isEmpty();
    }

    @Test
    void shouldAddTagToReminder() {
        // Given
        Reminder reminder = createBasicReminder();
        Tag tag = new Tag().name("important");

        // When
        reminder.addTags(tag);

        // Then
        assertThat(reminder.getTags()).contains(tag);
        assertThat(tag.getReminders()).contains(reminder);
    }

    @Test
    void shouldRemoveTagFromReminder() {
        // Given
        Reminder reminder = createBasicReminder();
        Tag tag = new Tag().name("work");
        reminder.addTags(tag);

        // When
        reminder.removeTags(tag);

        // Then
        assertThat(reminder.getTags()).doesNotContain(tag);
        assertThat(tag.getReminders()).doesNotContain(reminder);
    }

    @Test
    void shouldAddMultipleTagsToReminder() {
        // Given
        Reminder reminder = createBasicReminder();
        Tag tag1 = new Tag().name("urgent");
        Tag tag2 = new Tag().name("work");
        Tag tag3 = new Tag().name("important");

        // When
        reminder.addTags(tag1).addTags(tag2).addTags(tag3);

        // Then
        assertThat(reminder.getTags()).containsExactlyInAnyOrder(tag1, tag2, tag3);
        assertThat(tag1.getReminders()).contains(reminder);
        assertThat(tag2.getReminders()).contains(reminder);
        assertThat(tag3.getReminders()).contains(reminder);
    }

    @Test
    void shouldSetTagsCollection() {
        // Given
        Reminder reminder = createBasicReminder();
        Tag tag1 = new Tag().name("personal");
        Tag tag2 = new Tag().name("health");
        Set<Tag> tags = new HashSet<>();
        tags.add(tag1);
        tags.add(tag2);

        // When
        reminder.setTags(tags);

        // Then
        assertThat(reminder.getTags()).containsExactlyInAnyOrder(tag1, tag2);
        assertThat(tag1.getReminders()).contains(reminder);
        assertThat(tag2.getReminders()).contains(reminder);
    }

    @Test
    void shouldReplaceTagsCollection() {
        // Given
        Reminder reminder = createBasicReminder();
        Tag oldTag = new Tag().name("old");
        Tag newTag1 = new Tag().name("new1");
        Tag newTag2 = new Tag().name("new2");

        reminder.addTags(oldTag);

        Set<Tag> newTags = new HashSet<>();
        newTags.add(newTag1);
        newTags.add(newTag2);

        // When
        reminder.setTags(newTags);

        // Then
        assertThat(reminder.getTags()).containsExactlyInAnyOrder(newTag1, newTag2);
        assertThat(reminder.getTags()).doesNotContain(oldTag);
        assertThat(oldTag.getReminders()).doesNotContain(reminder);
        assertThat(newTag1.getReminders()).contains(reminder);
        assertThat(newTag2.getReminders()).contains(reminder);
    }

    @Test
    void shouldHandleTagEqualityById() {
        // Given
        Tag tag1 = new Tag().id(1L).name("test");
        Tag tag2 = new Tag().id(1L).name("different");

        // When/Then
        assertThat(tag1).isEqualTo(tag2);
        assertThat(tag1.hashCode()).isEqualTo(tag2.hashCode());
    }

    @Test
    void shouldGenerateCorrectTagToString() {
        // Given
        Tag tag = new Tag().id(1L).name("urgent");

        // When
        String toString = tag.toString();

        // Then
        assertThat(toString).contains("id=1");
        assertThat(toString).contains("name='urgent'");
    }

    @Test
    void shouldMaintainBidirectionalRelationship() {
        // Given
        Reminder reminder1 = createBasicReminder().title("Task 1");
        Reminder reminder2 = createBasicReminder().title("Task 2");
        Tag tag = new Tag().name("shared");

        // When
        reminder1.addTags(tag);
        reminder2.addTags(tag);

        // Then
        assertThat(tag.getReminders()).containsExactlyInAnyOrder(reminder1, reminder2);
        assertThat(reminder1.getTags()).contains(tag);
        assertThat(reminder2.getTags()).contains(tag);
    }

    @Test
    void shouldClearAllTags() {
        // Given
        Reminder reminder = createBasicReminder();
        Tag tag1 = new Tag().name("tag1");
        Tag tag2 = new Tag().name("tag2");
        reminder.addTags(tag1).addTags(tag2);

        // When
        reminder.setTags(new HashSet<>());

        // Then
        assertThat(reminder.getTags()).isEmpty();
        assertThat(tag1.getReminders()).doesNotContain(reminder);
        assertThat(tag2.getReminders()).doesNotContain(reminder);
    }

    private Reminder createBasicReminder() {
        return new Reminder()
            .title("Test Reminder")
            .dueDate(Instant.now().plusSeconds(3600))
            .isCompleted(false)
            .priority(Priority.MEDIUM)
            .createdDate(Instant.now());
    }
}