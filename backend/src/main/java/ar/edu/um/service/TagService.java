package ar.edu.um.service;

import ar.edu.um.service.dto.TagDTO;
import java.util.List;
import java.util.Optional;

/**
 * Service Interface for managing {@link ar.edu.um.domain.Tag}.
 */
public interface TagService {
    /**
     * Save a tag.
     *
     * @param tagDTO the entity to save.
     * @return the persisted entity.
     */
    TagDTO save(TagDTO tagDTO);

    /**
     * Updates a tag.
     *
     * @param tagDTO the entity to update.
     * @return the persisted entity.
     */
    TagDTO update(TagDTO tagDTO);

    /**
     * Partially updates a tag.
     *
     * @param tagDTO the entity to update partially.
     * @return the persisted entity.
     */
    Optional<TagDTO> partialUpdate(TagDTO tagDTO);

    /**
     * Get all the tags.
     *
     * @return the list of entities.
     */
    List<TagDTO> findAll();

    /**
     * Get the "id" tag.
     *
     * @param id the id of the entity.
     * @return the entity.
     */
    Optional<TagDTO> findOne(Long id);

    /**
     * Delete the "id" tag.
     *
     * @param id the id of the entity.
     */
    void delete(Long id);

    /**
     * Search for the tag corresponding to the query.
     *
     * @param query the query of the search.
     * @return the list of entities.
     */
    List<TagDTO> search(String query);
}
