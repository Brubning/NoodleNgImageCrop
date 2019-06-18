# NoodleNgImageCrop

## Description

This is a port of directive-based code from https://github.com/bcabanes/angular-image-cropper to an Angular 7 component.

The original was based around Guillotine jQuery plug-in

## Installation

No installation process yet. Yarn configuration supports packaging via ng-packagr.

Install ng-packagr and Yarn and run the package script from the command line.

```javascript
yarn package
```

Copy contents of dist to node_modules/NoodleNgImageCrop.

### NPM

npm package to follow.

## Usage

### Import Module/Component

``` javascript
import { NoodleNgImageCrop } from "noodle-ng-image-crop";

@NgModule({
  declarations: [
    NoodleNgImageCrop
    ...
  ],
  imports: [ ... ],
  providers: [ ... ],
  bootstrap: [ ... ]
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
import { NoodleNgImageCropData } from "noodle-ng-image-crop";

@component {
  ...

  croppedOutput: NgNoodleImageCropData;

  onCrop($event) {
    this.croppedOutput = $event;
  }
}
```

#### Models

The NoodleNgImageCropData model contains details of the crop applies and is output by the onCrop event. It contains the following:

```javascript
  // Scaling applied to the source image on crop (effectively zoom factor)
  scale: number = 1;

  // Image rotation on crop
  degrees: number = 0;

  // X and Y co-ordinates of the cropping box
  x: number = 0;
  y: number = 0;

  // Width and Height of the cropping box
  w: number = 1;  
  h: number = 1;

  // base64 data URI for the cropped image
  croppedImage: string;
```
