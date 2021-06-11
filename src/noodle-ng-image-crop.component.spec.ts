import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NoodleNgImageCrop } from './noodle-ng-image-crop.component';

describe('NoodleNgImageCropComponent', () => {
  let component: NoodleNgImageCrop;
  let fixture: ComponentFixture<NoodleNgImageCrop>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NoodleNgImageCrop ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoodleNgImageCrop);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
