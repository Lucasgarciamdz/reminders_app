package ar.edu.um.domain;

import static ar.edu.um.domain.ReminderTestSamples.*;
import static ar.edu.um.domain.TagTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import ar.edu.um.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class TagTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Tag.class);
        Tag tag1 = getTagSample1();
        Tag tag2 = new Tag();
        assertThat(tag1).isNotEqualTo(tag2);

        tag2.setId(tag1.getId());
        assertThat(tag1).isEqualTo(tag2);

        tag2 = getTagSample2();
        assertThat(tag1).isNotEqualTo(tag2);
    }

    @Test
    void remindersTest() {
        Tag tag = getTagRandomSampleGenerator();
        Reminder reminderBack = getReminderRandomSampleGenerator();

        tag.addReminders(reminderBack);
        assertThat(tag.getReminders()).containsOnly(reminderBack);
        assertThat(reminderBack.getTags()).containsOnly(tag);

        tag.removeReminders(reminderBack);
        assertThat(tag.getReminders()).doesNotContain(reminderBack);
        assertThat(reminderBack.getTags()).doesNotContain(tag);

        tag.reminders(new HashSet<>(Set.of(reminderBack)));
        assertThat(tag.getReminders()).containsOnly(reminderBack);
        assertThat(reminderBack.getTags()).containsOnly(tag);

        tag.setReminders(new HashSet<>());
        assertThat(tag.getReminders()).doesNotContain(reminderBack);
        assertThat(reminderBack.getTags()).doesNotContain(tag);
    }
}
