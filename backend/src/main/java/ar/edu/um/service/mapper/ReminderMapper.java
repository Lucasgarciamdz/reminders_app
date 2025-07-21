package ar.edu.um.service.mapper;

import ar.edu.um.domain.Reminder;
import ar.edu.um.domain.User;
import ar.edu.um.service.dto.ReminderDTO;
import ar.edu.um.service.dto.UserDTO;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Reminder} and its DTO {@link ReminderDTO}.
 */
@Mapper(componentModel = "spring")
public interface ReminderMapper extends EntityMapper<ReminderDTO, Reminder> {
    @Mapping(target = "user", source = "user", qualifiedByName = "userLogin")
    ReminderDTO toDto(Reminder s);

    @Named("userLogin")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    @Mapping(target = "login", source = "login")
    UserDTO toDtoUserLogin(User user);
}
