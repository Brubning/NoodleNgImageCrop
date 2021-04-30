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
  public x: number = 0;
  public y: number = 0;
}

// Data output asa  result of cropping
export class NoodleNgImageCropData {
  public scale: number = 1;
  public degrees: number = 0;
  public x: number = 0;
  public y: number = 0;
  public w: number = 1;
  public h: number = 1;
  public xPercent: number = 0;
  public yPercent: number = 0;
  public wPercent: number = 1;
  public hPercent: number = 1;
  public croppedImage: string;
};
