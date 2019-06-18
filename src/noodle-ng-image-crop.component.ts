import {
   Component,
   OnInit,
   Input,
   Output,
   ViewChild,
   EventEmitter,
   ElementRef,
   Renderer2
} from "@angular/core";
import {
   Http
} from "@angular/http";
import {
  NoodleNgImageCropActionLabels,
  NoodleNgImagePointerPosition,
  NoodleNgImageCropData
} from "./noodle-ng-image-crop.models";

@Component({
  selector: "noodle-ng-image-crop",
  templateUrl: "./noodle-ng-image-crop.component.html",
  styleUrls: ["./noodle-ng-image-crop.component.css"]
})
export class NoodleNgImageCrop implements OnInit {

  constructor(
    private renderer: Renderer2,
    private http: Http) {
  }

  // TODO
  // loadImage (cross origin load)
  // setUpImageSrc (not required?)
  // imageSource as observable (remove setTimeout)
  // set up all styles as bound values
  // targetCropSize

  // Child elements
  @ViewChild("imgCropperBoundingBox") boundingBox: ElementRef;
  @ViewChild("imgCropperWrapper") wrapper: ElementRef;
  @ViewChild("imgCropperContainer") container: ElementRef;
  @ViewChild("imgCropperImage") image: ElementRef;
  // Inputs
  @Input() actionLabels: NoodleNgImageCropActionLabels = new NoodleNgImageCropActionLabels();
  @Input() imageSource: string; // Source could be a URI or a data (base 64) source
  //@Input() checkCrossOrigin: boolean = true;
  @Input() zoomStep: number = 0.1;  // Step size for zoom
  @Input() showControls: boolean = true;
  @Input() fitOnInit: boolean = false;
  @Input() centerOnInit: boolean = false;
  @Input() cropWidth: number = 240;
  @Input() cropHeight: number = 300;
  // Outputs
  @Output() onCrop: EventEmitter<NoodleNgImageCropData> = new EventEmitter();
  // Component level properties
  originalSource: string = this.imageSource;
  imageBindingSource: string;
  // State flags
  isReady: boolean = false;
  isDragReady: boolean = false;
  isDragBound: boolean = false;
  isCropping: boolean = false;
  pointerPosition: NoodleNgImagePointerPosition = new NoodleNgImagePointerPosition();
  // Control properties - should be a model and bound to the template
  cropRatio: number;
  @Input() width: number;
  @Input() height: number;
  left: number;
  top: number;
  angle: number;
  tempLeft: number;
  tempTop:number;
  // Crop data
  private cropData: NoodleNgImageCropData = new NoodleNgImageCropData();
  // Callbacks to remove event listeners
  private startCallbackMouse: any;
  private moveCallbackMouse: any;
  private stopCallbackMouse: any;
  private startCallbackTouch: any;
  private moveCallbackTouch: any;
  private stopCallbackTouch: any;

  // Initialise
  ngOnInit() {
    this.loadImage();

    setTimeout(() => this.initializeControls(), 1000);
  }

  // Destroy
  ngOnDestroy() {
    this.startCallbackMouse();
    this.startCallbackTouch;
  }

  // Rotate left $event handler
  rotateLeft(): void {
    this.rotateImage(-90);
  }

  // Rotate right $event handler
  rotateRight(): void {
    this.rotateImage(90);
  }

  // Zoom in $event handler
  zoomIn(): void {
    this.zoomImage(1);
  }

  // Zoom out $event handler
  zoomOut(): void {
    this.zoomImage(-1);
  }

  // Zoom to fit $event handler
  zoomToFit(): void {
    this.fitImage();
    this.centerImage();
  }

  // Crop $event handler
  crop(): void {
    this.cropImage();
  }

  // Change image $event handler
  changeImage(newImageUrl: string): void {
    if (newImageUrl ||
      newImageUrl.length == 0 ||
      newImageUrl === this.originalSource)
      return;

    this.imageSource = newImageUrl;
    this.loadImage();
  }

  // Apply image rotation
  private rotateImage(degrees: number): void {
    if (degrees === 0)
      return;
    // Only rotate of 90°.
    if (!(degrees % 90 === 0)) {
      throw new Error("Rotation must be by a multiple of 90 degrees.");
    }

    // Smallest positive equivalent angle (total rotation).
    this.angle = (this.angle + degrees) % 360;
    if (this.angle < 0) {
      this.angle += 360;
    }

    // Dimensions are changed?
    if (degrees % 180 !== 0) {
      // Switch canvas dimensions (as percentages).
      var tempW = this.height * this.cropRatio;
      var tempH = this.width / this.cropRatio;
      this.width = tempW;
      this.height = tempH;
      if (this.width >= 1 && this.height >= 1) {
        //TODO Convert to bound style using ngStyle
        this.container.nativeElement.style.width = this.width * 100 + "%";
        this.container.nativeElement.style.height = this.height * 100 + "%";
      } else {
        this.fitImage();
      }
    }

    var newWidth = 1;
    var newHeight = 1;

    // Adjust element"s (image) dimensions inside the container.
    if (this.angle % 180 !== 0) {
      var ratio = this.height / this.width * this.cropRatio;
      newWidth = ratio;
      newHeight = 1 / ratio;
    }
    
    //TODO Convert to bound style using ngStyle
    this.image.nativeElement.style.width = newWidth * 100 + "%";
    this.image.nativeElement.style.height = newHeight * 100 + "%";
    this.image.nativeElement.style.left = (1 - newWidth) / 2 * 100 + "%";
    this.image.nativeElement.style.top = (1 - newHeight) / 2 * 100 + "%";
    this.image.nativeElement.style.transform = "rotate(" + this.angle + "deg)";
    this.image.nativeElement.style.webkitTransform = "rotate(" + this.angle + "deg)";
    //this.image.nativeElement.style.mozTransform = "rotate(" + this.angle + "deg)";
    //this.image.nativeElement.style.msTransform = "rotate(" + this.angle + "deg)";
    //this.image.nativeElement.style.oTransform = "rotate(" + this.angle + "deg)";

    this.centerImage();
    this.cropData.degrees = this.angle;
  }

  // Apply image zoom
  private zoomImage(step: number): void {
    let zoomFactor = this.getZoomFactor(step);
    // Validate
    if (zoomFactor <= 0 || zoomFactor == 1)
      return;

    var originalWidth = this.width;
    if (this.width * zoomFactor > 1 && this.height * zoomFactor > 1) {
      this.height *= zoomFactor;
      this.width *= zoomFactor;
      //TODO Convert to bound style using ngStyle
      this.container.nativeElement.style.height = (this.height * 100).toFixed(2) + "%";
      this.container.nativeElement.style.width = (this.width * 100).toFixed(2) + "%";
      this.cropData.scale *= zoomFactor;
    } else {
      this.fitImage();
      zoomFactor = this.width / originalWidth;
    }

    /**
     * Keep window centered.
     * The offsets are the distances between the image point in the center of the wrapper
     * and each edge of the image, less half the size of the window.
     * Percentage offsets are relative to the container (the wrapper), so half the wrapper
     * is 50% (0.5) and when zooming the distance between any two points in the image
     * grows by "factor", so the new offsets are:
     *
     * offset = (prev-center-to-edge) * factor - half-window
     *
     */
    var left = (this.left + 0.5) * zoomFactor - 0.5;
    var top = (this.top + 0.5) * zoomFactor - 0.5;

    this.setOffset(left, top);
  }

  // Fit image to container (Best fit)
  private fitImage(): void {
    const prevWidth = this.width;
    const relativeRatio = this.height / this.width;

    if (relativeRatio > 1) {
      this.width = 1;
      this.height = relativeRatio;
    } else {
      this.width = 1 / relativeRatio;
      this.height = 1;
    }
    
    //TODO Convert to bound style using ngStyle
    this.container.nativeElement.style.width = (this.width * 100).toFixed(2) + "%";
    this.container.nativeElement.style.height = (this.height * 100).toFixed(2) + "%";

    this.cropData.scale *= this.width / prevWidth;
  }

  // Center image to container
  private centerImage(): void {
    this.setOffset((this.width - 1) / 2, (this.height - 1) / 2);
  }

  // Determine if the image dimensions mean it must zoom to fit
  private imageHasToFit(): boolean {
    return
      this.image.nativeElement.naturalWidth < this.cropWidth ||
      this.image.nativeElement.naturalHeight < this.cropHeight ||
      this.width < 1 ||
      this.height < 1 ||
      this.fitOnInit;
  }

  // Load image from imageSource
  private loadImage(): void {
    if (!this.imageSource || this.imageSource === "") {
      this.isReady = false;
      return;
    }
    // If base64 source, bind directly.
    if (/^data\:/.test(this.imageSource)) {
      this.imageBindingSource = this.imageSource;
      return;
    }

    // Load image from URI via http and bind result
    this.http
      .get(this.imageSource)
      .subscribe(
        (response) => {
          this.imageBindingSource = response.text().replace(/"/g, "");
        },
        (error) => {
          this.imageBindingSource = this.imageSource;
        });
  }

  // Initialize the component
  private initializeControls() {
    this.setDimensions();

    if (this.imageHasToFit()) {
      this.fitImage();
      this.centerImage();
    }
      
    this.initializeDrag();

    if (this.centerOnInit) {
      this.centerImage();
    }
  }

  // Check if an image source is a cross-origin URI
  private isCrossOriginSource(uri: string): boolean {
    var parts = uri.match;

    return Boolean(parts && (
      parts[1] !== location.protocol ||
      parts[2] !== location.hostname ||
      parts[3] !== location.port)
    );
  }

  // Crop image and set result to output croppedImageBase64
  private cropImage(): void {
    this.isCropping = true;

    const canvas = document.createElement("canvas");
    canvas.height = this.cropHeight;
    canvas.width = this.cropWidth;
    var cx = -canvas.width / 2;
    var cy = -canvas.height / 2;

    const context = canvas.getContext("2d");
    context.translate(-cx,-cy); //move to centre of canvas
    context.rotate(this.cropData.degrees * Math.PI/180);
    context.scale(this.cropData.scale, this.cropData.scale);

    if(this.cropData.degrees == 0) { // simple offsets from canvas centre & scale
      context.drawImage(this.image.nativeElement,
        (cx - this.cropData.x) / this.cropData.scale,
        (cy - this.cropData.y) / this.cropData.scale
      );
    } else if(this.cropData.degrees == 90) { // swap axis and reverse the new y origin
      context.drawImage(this.image.nativeElement,
        (cy - this.cropData.y) / this.cropData.scale,
        (-1 * this.image.nativeElement.naturalHeight) + ((-cx + this.cropData.x) / this.cropData.scale)
      );
    } else if(this.cropData.degrees == 180) { // reverse both origins
      context.drawImage(this.image.nativeElement,
        (-1 * this.image.nativeElement.naturalWidth) + ((-cx + this.cropData.x) / this.cropData.scale),
        (-1 * this.image.nativeElement.naturalHeight) + ((-cy + this.cropData.y) / this.cropData.scale)
      );
    } else if(this.cropData.degrees == 270) { // swap axis and reverse the new x origin
      context.drawImage(this.image.nativeElement,
        (-1 * this.image.nativeElement.naturalWidth) + ((-cy + this.cropData.y) / this.cropData.scale),
        (cx - this.cropData.x) / this.cropData.scale
      );
    }

    // Output the cropped data
    this.cropData.croppedImage = canvas.toDataURL("image/jpeg");
    this.onCrop.emit(this.cropData);
    this.isCropping = false;
  }

  // Set dimensions when there is an image bound
  private setDimensions(): void {
    // suspect? crop ratio?
    this.cropRatio = this.cropHeight / this.cropWidth;
    this.width = this.image.nativeElement.naturalWidth / this.cropWidth;
    this.height = this.image.nativeElement.naturalHeight / this.cropHeight;
    this.left = 0;
    this.top = 0;
    this.angle = 0;
    // Crop data
    const data = new NoodleNgImageCropData();
    data.w = this.cropWidth;
    data.h = this.cropHeight;
    this.cropData = data;
    // Container dimensions
    //TODO Convert to bound style using ngStyle
    this.container.nativeElement.style.width = (this.width * 100) + "%";
    this.container.nativeElement.style.height = (this.height * 100) + "%";
    this.container.nativeElement.style.top = "0";
    this.container.nativeElement.style.left = "0";
    // Wrapper dimensions
    this.wrapper.nativeElement.style.height = "auto";
    this.wrapper.nativeElement.style.width = "100%";
    this.wrapper.nativeElement.style.paddingTop = (this.cropRatio * 100) + "%";

    this.isReady = true;
  }

  // Set up $events for dragging
  private initializeDrag() {
    // Touch Start events
    //TODO Supply as array
    this.startCallbackMouse = this.renderer.listen(this.image.nativeElement, "mousedown", ($event) => this.startDrag($event));
    this.startCallbackTouch = this.renderer.listen(this.image.nativeElement, "touchstart", ($event) => this.startDrag($event));
    this.isDragReady = true;
  }

  // Calculate the zoom factor. +ve = zoom in, -ve = zoom out.
  private getZoomFactor(step: number): number {
    if (step == 0)
      return 0;

    if (step < 0)
      return 1 / (1 + this.zoomStep);

    return 1 + this.zoomStep;
  }

  // Start drag; binds events to handle dragging
  private startDrag($event) {
    if (this.isReady && this.isValidEvent($event)) {
      $event.preventDefault;
      $event.stopImmediatePropagation;
      this.pointerPosition = this.getPointerPosition($event);
      this.bind();
    }
  }

// Determine if an $event needs to be handled
  private isValidEvent($event): boolean {
    if (this.isTouchEvent($event)) {
      return $event.changeTouches.length === 1;
    }

    return $event.which === 1;
  }

  // Determine if the $event is a touch $event
  private isTouchEvent($event): boolean {
    return /touch/i.test($event.type);
  }

  // Bind dragging events
  private bind() {
    // If you drag outside the area of the browser it is possible to bind twice causing unbind to leave extra callbacks.
    this.unbind();

    this.wrapper.nativeElement.classList.add("imgCropper-dragging");
    // Drag events
    this.moveCallbackMouse = this.renderer.listen(this.image.nativeElement, "mousemove", ($event) => this.drag($event));
    this.moveCallbackTouch = this.renderer.listen(this.image.nativeElement, "touchmove", ($event) => this.drag($event));
    // Stop events
    this.stopCallbackMouse = this.renderer.listen(this.image.nativeElement, "mouseup", () => this.unbind());
    this.stopCallbackMouse = this.renderer.listen(this.image.nativeElement, "mouseout", () => this.unbind());
    this.stopCallbackTouch = this.renderer.listen(this.image.nativeElement, "touchend", () => this.unbind());

    this.isDragBound = true;
  }

  // Unbind dragging events
  private unbind() {
    this.image.nativeElement.classList.remove("imgCropper-dragging");
    //TODO: Maintain array of callbacks to unbind
    if (this.moveCallbackMouse) this.moveCallbackMouse();
    if (this.stopCallbackMouse) this.stopCallbackMouse();
    if (this.moveCallbackTouch) this.moveCallbackTouch();
    if (this.stopCallbackTouch) this.stopCallbackTouch();

    this.isDragBound = false;
  }

  // Drag 
  private drag($event) {
    var dx, dy, left, p, top;
    $event.preventDefault();
    $event.stopImmediatePropagation();

    p = this.getPointerPosition($event); // Cursor position after moving.
    dx = p.x - this.pointerPosition.x; // Difference (cursor movement) on X axes.
    dy = p.y - this.pointerPosition.y; // Difference (cursor movement) on Y axes.
    this.pointerPosition = p; // Update cursor position.
    /**
     * dx > 0 if moving right.
     * dx / clientWidth is the percentage of the wrapper"s width it moved over X.
     */
    left = (dx === 0)? null : this.left - dx / this.wrapper.nativeElement.clientWidth;
    /**
     * dy > 0 if moving down.
     * dy / clientHeight is the percentage of the wrapper"s width it moved over Y.
     */
    top = (dy === 0)? null : this.top - dy / this.wrapper.nativeElement.clientHeight;
    // Move.
    this.setOffset(left, top);
  }

  // Set image offset
  private setOffset(left: number, top: number) {
    this.tempLeft = left;
    this.tempTop = top;
    // Offset left.
    if (left || left === 0) {
      if (left < 0) { left = 0; }
      if (left > this.width - 1) { left = this.width - 1; }
      
      //TODO Convert to bound style using ngStyle
      this.container.nativeElement.style.left = (-left * 100).toFixed(2) + "%";
      this.left = left;
      this.cropData.x = Math.round(left * this.cropWidth);
    }

    // Offset top.
    if (top || top === 0) {
      if (top < 0) { top = 0; }
      if (top > this.height - 1) { top = this.height - 1; }
      
      //TODO Convert to bound style using ngStyle
      this.container.nativeElement.style.top = (-top * 100).toFixed(2) + "%";
      this.top = top;
      this.cropData.y = Math.round(top * this.cropHeight);
    }
  }

  // Work out the pointer position
  private getPointerPosition($event): NoodleNgImagePointerPosition {
    //if (this.isTouchEvent($event)) {
    //  $event = $event.touches[0];
    //}

    return {
      x: $event.pageX,
      y: $event.pageY
    };
  };
}
