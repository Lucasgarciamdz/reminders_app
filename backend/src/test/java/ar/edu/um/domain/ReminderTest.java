package ar.edu.um.domain;

import static ar.edu.um.domain.CategoryTestSamples.*;
import static ar.edu.um.domain.ReminderTestSamples.*;
import static ar.edu.um.domain.TagTestSamples.*;
import static org.assertj.core.api.Assertions.assertThat;

import ar.edu.um.web.rest.TestUtil;
import java.util.HashSet;
import java.util.Set;
import org.junit.jupiter.api.Test;

class ReminderTest {

    @Test
    void equalsVerifier() throws Exception {
        TestUtil.equalsVerifier(Reminder.class);
        Reminder reminder1 = getReminderSample1();
        Reminder reminder2 = new Reminder();
        assertThat(reminder1).isNotEqualTo(reminder2);

        reminder2.setId(reminder1.getId());
        assertThat(reminder1).isEqualTo(reminder2);

        reminder2 = getReminderSample2();
        assertThat(reminder1).isNotEqualTo(reminder2);
    }

    @Test
    void categoryTest() {
        Reminder reminder = getReminderRandomSampleGenerator();
        Category categoryBack = getCategoryRandomSampleGenerator();

        reminder.setCategory(categoryBack);
        assertThat(reminder.getCategory()).isEqualTo(categoryBack);

        reminder.category(null);
        assertThat(reminder.getCategory()).isNull();
    }

    @Test
    void tagsTest() {
        Reminder reminder = getReminderRandomSampleGenerator();
        Tag tagBack = getTagRandomSampleGenerator();

        reminder.addTags(tagBack);
        assertThat(reminder.getTags()).containsOnly(tagBack);

        reminder.removeTags(tagBack);
        assertThat(reminder.getTags()).doesNotContain(tagBack);

        reminder.tags(new HashSet<>(Set.of(tagBack)));
        assertThat(reminder.getTags()).containsOnly(tagBack);

        reminder.setTags(new HashSet<>());
        assertThat(reminder.getTags()).doesNotContain(tagBack);
    }
}
