package ar.edu.um.service.dto;

import static org.assertj.core.api.Assertions.assertThat;

import ar.edu.um.web.rest.TestUtil;
import org.junit.jupiter.api.Test;

class ReminderDTOTest {

    @Test
    void dtoEqualsVerifier() throws Exception {
        TestUtil.equalsVerifier(ReminderDTO.class);
        ReminderDTO reminderDTO1 = new ReminderDTO();
        reminderDTO1.setId(1L);
        ReminderDTO reminderDTO2 = new ReminderDTO();
        assertThat(reminderDTO1).isNotEqualTo(reminderDTO2);
        reminderDTO2.setId(reminderDTO1.getId());
        assertThat(reminderDTO1).isEqualTo(reminderDTO2);
        reminderDTO2.setId(2L);
        assertThat(reminderDTO1).isNotEqualTo(reminderDTO2);
        reminderDTO1.setId(null);
        assertThat(reminderDTO1).isNotEqualTo(reminderDTO2);
    }
}
