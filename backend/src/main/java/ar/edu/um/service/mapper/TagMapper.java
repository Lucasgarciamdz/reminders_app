package ar.edu.um.service.mapper;

import ar.edu.um.domain.Reminder;
import ar.edu.um.domain.Tag;
import ar.edu.um.service.dto.ReminderDTO;
import ar.edu.um.service.dto.TagDTO;
import java.util.Set;
import java.util.stream.Collectors;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Tag} and its DTO {@link TagDTO}.
 */
@Mapper(componentModel = "spring")
public interface TagMapper extends EntityMapper<TagDTO, Tag> {
    @Mapping(target = "reminders", source = "reminders", qualifiedByName = "reminderIdSet")
    TagDTO toDto(Tag s);

    @Mapping(target = "reminders", ignore = true)
    @Mapping(target = "removeReminders", ignore = true)
    Tag toEntity(TagDTO tagDTO);

    @Named("reminderId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    ReminderDTO toDtoReminderId(Reminder reminder);

    @Named("reminderIdSet")
    default Set<ReminderDTO> toDtoReminderIdSet(Set<Reminder> reminder) {
        return reminder.stream().map(this::toDtoReminderId).collect(Collectors.toSet());
    }
}
