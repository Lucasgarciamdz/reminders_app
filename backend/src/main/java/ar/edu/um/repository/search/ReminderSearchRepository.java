package ar.edu.um.repository.search;

import ar.edu.um.domain.Reminder;
import ar.edu.um.repository.ReminderRepository;
import co.elastic.clients.elasticsearch._types.query_dsl.QueryStringQuery;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.scheduling.annotation.Async;

/**
 * Spring Data Elasticsearch repository for the {@link Reminder} entity.
 */
public interface ReminderSearchRepository extends ElasticsearchRepository<Reminder, Long>, ReminderSearchRepositoryInternal {}

interface ReminderSearchRepositoryInternal {
    Page<Reminder> search(String query, Pageable pageable);

    Page<Reminder> search(Query query);

    @Async
    void index(Reminder entity);

    @Async
    void deleteFromIndexById(Long id);
}

class ReminderSearchRepositoryInternalImpl implements ReminderSearchRepositoryInternal {

    private final ElasticsearchTemplate elasticsearchTemplate;
    private final ReminderRepository repository;

    ReminderSearchRepositoryInternalImpl(ElasticsearchTemplate elasticsearchTemplate, ReminderRepository repository) {
        this.elasticsearchTemplate = elasticsearchTemplate;
        this.repository = repository;
    }

    @Override
    public Page<Reminder> search(String query, Pageable pageable) {
        NativeQuery nativeQuery = new NativeQuery(QueryStringQuery.of(qs -> qs.query(query))._toQuery());
        return search(nativeQuery.setPageable(pageable));
    }

    @Override
    public Page<Reminder> search(Query query) {
        SearchHits<Reminder> searchHits = elasticsearchTemplate.search(query, Reminder.class);
        List<Reminder> hits = searchHits.map(SearchHit::getContent).stream().toList();
        return new PageImpl<>(hits, query.getPageable(), searchHits.getTotalHits());
    }

    @Override
    public void index(Reminder entity) {
        repository.findOneWithEagerRelationships(entity.getId()).ifPresent(elasticsearchTemplate::save);
    }

    @Override
    public void deleteFromIndexById(Long id) {
        elasticsearchTemplate.delete(String.valueOf(id), Reminder.class);
    }
}
