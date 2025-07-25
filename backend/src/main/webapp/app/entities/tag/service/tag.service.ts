import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, asapScheduler, scheduled } from 'rxjs';

import { catchError } from 'rxjs/operators';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { Search } from 'app/core/request/request.model';
import { ITag, NewTag } from '../tag.model';

export type PartialUpdateTag = Partial<ITag> & Pick<ITag, 'id'>;

export type EntityResponseType = HttpResponse<ITag>;
export type EntityArrayResponseType = HttpResponse<ITag[]>;

@Injectable({ providedIn: 'root' })
export class TagService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/tags');
  protected resourceSearchUrl = this.applicationConfigService.getEndpointFor('api/tags/_search');

  create(tag: NewTag): Observable<EntityResponseType> {
    return this.http.post<ITag>(this.resourceUrl, tag, { observe: 'response' });
  }

  update(tag: ITag): Observable<EntityResponseType> {
    return this.http.put<ITag>(`${this.resourceUrl}/${this.getTagIdentifier(tag)}`, tag, { observe: 'response' });
  }

  partialUpdate(tag: PartialUpdateTag): Observable<EntityResponseType> {
    return this.http.patch<ITag>(`${this.resourceUrl}/${this.getTagIdentifier(tag)}`, tag, { observe: 'response' });
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http.get<ITag>(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http.get<ITag[]>(this.resourceUrl, { params: options, observe: 'response' });
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  search(req: Search): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<ITag[]>(this.resourceSearchUrl, { params: options, observe: 'response' })
      .pipe(catchError(() => scheduled([new HttpResponse<ITag[]>()], asapScheduler)));
  }

  getTagIdentifier(tag: Pick<ITag, 'id'>): number {
    return tag.id;
  }

  compareTag(o1: Pick<ITag, 'id'> | null, o2: Pick<ITag, 'id'> | null): boolean {
    return o1 && o2 ? this.getTagIdentifier(o1) === this.getTagIdentifier(o2) : o1 === o2;
  }

  addTagToCollectionIfMissing<Type extends Pick<ITag, 'id'>>(tagCollection: Type[], ...tagsToCheck: (Type | null | undefined)[]): Type[] {
    const tags: Type[] = tagsToCheck.filter(isPresent);
    if (tags.length > 0) {
      const tagCollectionIdentifiers = tagCollection.map(tagItem => this.getTagIdentifier(tagItem));
      const tagsToAdd = tags.filter(tagItem => {
        const tagIdentifier = this.getTagIdentifier(tagItem);
        if (tagCollectionIdentifiers.includes(tagIdentifier)) {
          return false;
        }
        tagCollectionIdentifiers.push(tagIdentifier);
        return true;
      });
      return [...tagsToAdd, ...tagCollection];
    }
    return tagCollection;
  }
}
