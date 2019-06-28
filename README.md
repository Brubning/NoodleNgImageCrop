# NoodleNgImageCrop

## Description

Angular image cropping component.

The image can be zoomed/rotated, and then cropped. It is responsive, and works under mouse and/or touch events.

This is a port of directive-based code from https://github.com/bcabanes/angular-image-cropper to an Angular 7 component.

## Installation
### NPM

Install from npm using 

``` javascript
npm install noodle-ng-image-crop
```

### Yarn

Yarn configuration supports packaging via ng-packagr.

Install ng-packagr and Yarn and run the package script from the command line.

```javascript
yarn package
```

Copy contents of dist to node_modules/NoodleNgImageCrop in your project folder.

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
                        [cropHeight]="300"
                        [cropWidth]="200"
                        [centerOnInit]="true"
                        [imageSource]=""></noodle-ng-image-crop>
```
#### Options

Options can be set on the component:
<!--*```check-cross-origin boolean Enable cross origin or not-->
* `imageSource` _string_ URI for image source to crop, can be an URL or base64 data.
* `actionButtons` _Array<NoodleNgImageCropActionButton>_ array of buttons to display in the control panel.
* `zoom-step` _number_ Zoom step. Defaults to 0.1;
* `show-controls` _boolean_ Display or not the control buttons (true by default)
* `fit-on-init` _boolean_ Fit the image on initialization (maintains aspect ratio)
* `center-on-init` _boolean_ Center the image on initialization (maintains aspect ratio)
* `cropHeight` _number_ Height of the crop (and display height of bounding box).
* `cropWidth` _number_ Width of the crop (and display width of bounding box).
* `maxZoom` _number_ Restricts zoom applied to the image to be below a maximum scale.
* `minZoom` _number_ Forces zoom applied to the image to be above a minimum scale.

#### Handling Output

The crop action emits an onCrop event which can be handled by the parent component. The event emits an NgNoodleImageCropData object.

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

The NoodleNgImageCropActionButton model contains details bound to the action controls at run time, allowing customisation of label.

```javascript
  // Action that the button represents. Maps via NoodleNgImageCropAction enumeration to a set of supported actions.
  action: NoodleNgImageCropAction;

  // Text label applied to the button.
  text: string;

  // CssClass applied to the button.
  cssClass: string;
```

The NoodleNgImageCropAction enumeration allows mapping of buttons to supported actions.
```javascript
  rotateLeft = 1,
  rotateRight,
  zoomIn,
  zoomOut,
  zoomToFit,
  crop
```

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
