import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ICategory } from '../category.model';
import { CategoryService } from '../service/category.service';
import { CategoryFormGroup, CategoryFormService } from './category-form.service';

@Component({
  selector: 'jhi-category-update',
  templateUrl: './category-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class CategoryUpdateComponent implements OnInit {
  isSaving = false;
  category: ICategory | null = null;

  protected categoryService = inject(CategoryService);
  protected categoryFormService = inject(CategoryFormService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: CategoryFormGroup = this.categoryFormService.createCategoryFormGroup();

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ category }) => {
      this.category = category;
      if (category) {
        this.updateForm(category);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const category = this.categoryFormService.getCategory(this.editForm);
    if (category.id !== null) {
      this.subscribeToSaveResponse(this.categoryService.update(category));
    } else {
      this.subscribeToSaveResponse(this.categoryService.create(category));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<ICategory>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(category: ICategory): void {
    this.category = category;
    this.categoryFormService.resetForm(this.editForm, category);
  }
}
