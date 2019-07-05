// Defines UI text and styles for action button
export class NoodleNgImageCropActionButton {
  public action: NoodleNgImageCropAction;
  public text: string;
  public cssClass: string;
}

// enum to identify action to use
export enum NoodleNgImageCropAction {
  rotateLeft = 1,
  rotateRight,
  zoomIn,
  zoomOut,
  zoomToFit,
  crop
}

// Pointer co-ordinates
export class NoodleNgImagePointerPosition {
  x: number = 0;
  y: number = 0;
}

// Data output asa  result of cropping
export class NoodleNgImageCropData {
  scale: number = 1;
  degrees: number = 0;
  x: number = 0;
  y: number = 0;
  w: number = 1;
  h: number = 1;
  xPercent: number = 0;
  yPercent: number = 0;
  wPercent: number = 1;
  hPercent: number = 1;
  croppedImage: string;
};
