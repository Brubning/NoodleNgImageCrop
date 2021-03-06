import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoodleNgImageCropComponent } from './noodle-ng-image-crop.component';

describe('NoodleNgImageCropComponent', () => {
  let component: NoodleNgImageCropComponent;
  let fixture: ComponentFixture<NoodleNgImageCropComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NoodleNgImageCropComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoodleNgImageCropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
