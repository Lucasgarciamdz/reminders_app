package ar.edu.um.service.mapper;

import ar.edu.um.domain.Category;
import ar.edu.um.domain.Reminder;
import ar.edu.um.domain.Tag;
import ar.edu.um.domain.User;
import ar.edu.um.service.dto.CategoryDTO;
import ar.edu.um.service.dto.ReminderDTO;
import ar.edu.um.service.dto.TagDTO;
import ar.edu.um.service.dto.UserDTO;
import java.util.Set;
import java.util.stream.Collectors;
import org.mapstruct.*;

/**
 * Mapper for the entity {@link Reminder} and its DTO {@link ReminderDTO}.
 */
@Mapper(componentModel = "spring")
public interface ReminderMapper extends EntityMapper<ReminderDTO, Reminder> {
    @Mapping(target = "category", source = "category", qualifiedByName = "categoryId")
    @Mapping(target = "user", source = "user", qualifiedByName = "userId")
    @Mapping(target = "tags", source = "tags", qualifiedByName = "tagIdSet")
    ReminderDTO toDto(Reminder s);

    @Mapping(target = "removeTags", ignore = true)
    Reminder toEntity(ReminderDTO reminderDTO);

    @Named("categoryId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    CategoryDTO toDtoCategoryId(Category category);

    @Named("userId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    UserDTO toDtoUserId(User user);

    @Named("tagId")
    @BeanMapping(ignoreByDefault = true)
    @Mapping(target = "id", source = "id")
    TagDTO toDtoTagId(Tag tag);

    @Named("tagIdSet")
    default Set<TagDTO> toDtoTagIdSet(Set<Tag> tag) {
        return tag.stream().map(this::toDtoTagId).collect(Collectors.toSet());
    }
}
