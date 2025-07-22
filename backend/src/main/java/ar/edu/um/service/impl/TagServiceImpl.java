package ar.edu.um.service.impl;

import ar.edu.um.domain.Tag;
import ar.edu.um.repository.TagRepository;
import ar.edu.um.repository.search.TagSearchRepository;
import ar.edu.um.service.TagService;
import ar.edu.um.service.dto.TagDTO;
import ar.edu.um.service.mapper.TagMapper;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service Implementation for managing {@link ar.edu.um.domain.Tag}.
 */
@Service
@Transactional
public class TagServiceImpl implements TagService {

    private static final Logger LOG = LoggerFactory.getLogger(TagServiceImpl.class);

    private final TagRepository tagRepository;

    private final TagMapper tagMapper;

    private final TagSearchRepository tagSearchRepository;

    public TagServiceImpl(TagRepository tagRepository, TagMapper tagMapper, TagSearchRepository tagSearchRepository) {
        this.tagRepository = tagRepository;
        this.tagMapper = tagMapper;
        this.tagSearchRepository = tagSearchRepository;
    }

    @Override
    public TagDTO save(TagDTO tagDTO) {
        LOG.debug("Request to save Tag : {}", tagDTO);
        Tag tag = tagMapper.toEntity(tagDTO);
        tag = tagRepository.save(tag);
        tagSearchRepository.index(tag);
        return tagMapper.toDto(tag);
    }

    @Override
    public TagDTO update(TagDTO tagDTO) {
        LOG.debug("Request to update Tag : {}", tagDTO);
        Tag tag = tagMapper.toEntity(tagDTO);
        tag = tagRepository.save(tag);
        tagSearchRepository.index(tag);
        return tagMapper.toDto(tag);
    }

    @Override
    public Optional<TagDTO> partialUpdate(TagDTO tagDTO) {
        LOG.debug("Request to partially update Tag : {}", tagDTO);

        return tagRepository
            .findById(tagDTO.getId())
            .map(existingTag -> {
                tagMapper.partialUpdate(existingTag, tagDTO);

                return existingTag;
            })
            .map(tagRepository::save)
            .map(savedTag -> {
                tagSearchRepository.index(savedTag);
                return savedTag;
            })
            .map(tagMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagDTO> findAll() {
        LOG.debug("Request to get all Tags");
        return tagRepository.findAll().stream().map(tagMapper::toDto).collect(Collectors.toCollection(LinkedList::new));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<TagDTO> findOne(Long id) {
        LOG.debug("Request to get Tag : {}", id);
        return tagRepository.findById(id).map(tagMapper::toDto);
    }

    @Override
    public void delete(Long id) {
        LOG.debug("Request to delete Tag : {}", id);
        tagRepository.deleteById(id);
        tagSearchRepository.deleteFromIndexById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TagDTO> search(String query) {
        LOG.debug("Request to search Tags for query {}", query);
        try {
            return StreamSupport.stream(tagSearchRepository.search(query).spliterator(), false).map(tagMapper::toDto).toList();
        } catch (RuntimeException e) {
            throw e;
        }
    }
}
