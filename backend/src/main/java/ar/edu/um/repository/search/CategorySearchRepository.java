package ar.edu.um.repository.search;

import ar.edu.um.domain.Category;
import ar.edu.um.repository.CategoryRepository;
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
 * Spring Data Elasticsearch repository for the {@link Category} entity.
 */
public interface CategorySearchRepository extends ElasticsearchRepository<Category, Long>, CategorySearchRepositoryInternal {}

interface CategorySearchRepositoryInternal {
    Page<Category> search(String query, Pageable pageable);

    Page<Category> search(Query query);

    @Async
    void index(Category entity);

    @Async
    void deleteFromIndexById(Long id);
}

class CategorySearchRepositoryInternalImpl implements CategorySearchRepositoryInternal {

    private final ElasticsearchTemplate elasticsearchTemplate;
    private final CategoryRepository repository;

    CategorySearchRepositoryInternalImpl(ElasticsearchTemplate elasticsearchTemplate, CategoryRepository repository) {
        this.elasticsearchTemplate = elasticsearchTemplate;
        this.repository = repository;
    }

    @Override
    public Page<Category> search(String query, Pageable pageable) {
        NativeQuery nativeQuery = new NativeQuery(QueryStringQuery.of(qs -> qs.query(query))._toQuery());
        return search(nativeQuery.setPageable(pageable));
    }

    @Override
    public Page<Category> search(Query query) {
        SearchHits<Category> searchHits = elasticsearchTemplate.search(query, Category.class);
        List<Category> hits = searchHits.map(SearchHit::getContent).stream().toList();
        return new PageImpl<>(hits, query.getPageable(), searchHits.getTotalHits());
    }

    @Override
    public void index(Category entity) {
        repository.findById(entity.getId()).ifPresent(elasticsearchTemplate::save);
    }

    @Override
    public void deleteFromIndexById(Long id) {
        elasticsearchTemplate.delete(String.valueOf(id), Category.class);
    }
}
