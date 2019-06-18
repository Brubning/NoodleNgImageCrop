# NoodleNgImageCrop

## Description

This is a port of directive-based code from https://github.com/bcabanes/angular-image-cropper to an Angular 7 component.

The original was based around Guillotine jQuery plug-in

## Installation

No installation process yet. Yarn configuration supports packaging, copy output dist to node_modules/NoodleNgImageCrop.

## Usage

### Import Module

``` javascript
import { NoodleNgImageCrop } from "noodle-ng-image-crop";

@NgModule({
  declarations: [
    ...
    NoodleNgImageCrop
  ],
  imports: [
    ...
  ],
  providers: [
    ...
  ],
  bootstrap: [
  ...
  ]
})
export class AppModule { }
```

### Add to Component

Add the component to your template.

```html
  <noodle-ng-image-crop (onCrop)="onCrop($event)"
                        [height]="300"
                        [width]="200"
                        [centerOnInit]="true"
                        [imageSource]=""></noodle-ng-image-crop>
```

Add code to your component to handle cropped output.

```javascript
  onCrop($event) {
    this.croppedOutput = $event;
  }
```
