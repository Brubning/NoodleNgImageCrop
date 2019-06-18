import { ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NoodleNgImageCrop } from "./noodle-ng-image-crop.component";

export * from "./noodle-ng-image-crop.component";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    NoodleNgImageCrop
  ],
  exports: [
    NoodleNgImageCrop
  ]
})
export class NoodleNgImageCropModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: NoodleNgImageCropModule
    };
  }
}
