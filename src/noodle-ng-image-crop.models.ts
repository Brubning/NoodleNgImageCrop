// Labels attached to buttons.
export class NoodleNgImageCropActionLabels {
  rotateLeft: string = " < ";
  rotateRight: string = " > ";
  zoomIn: string = " + ";
  zoomOut: string = " - ";
  fit: string = "(fit)";
  crop: string = "[crop]"
};

// Defines UI text and styles for action button
export class NoodleNgImageCropActionButton {
  public action: string;
  public text: string = "";
  public cssClass: string = null;
  public callback: any = null;
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
  croppedImage: string;
};
