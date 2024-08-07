import {
   Component,
   OnInit,
   Input,
   Output,
   ViewChild,
   EventEmitter,
   ElementRef,
   Renderer2,
   RendererFactory2
} from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  NoodleNgImageCropAction,
  NoodleNgImageCropActionButton,
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
    private rendererFactory: RendererFactory2,
    private http: HttpClient) {
    // Create renderer
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  // Renderer
  private renderer: Renderer2
  // Child elements
  @ViewChild("imgCropperWrapper", { static: false } ) wrapper: ElementRef;
  @ViewChild("imgCropperContainer", { static: false } ) container: ElementRef;
  @ViewChild("imgCropperImage", { static: false } ) image: ElementRef;
  // Inputs
  @Input() imageSource: string; // Source could be a URI or a data (base 64) source
  //@Input() checkCrossOrigin: boolean = true;
  @Input() actionButtons: Array<NoodleNgImageCropActionButton>;
  private actionCallbacks: { [action: number]: any; } = {};
  @Input() zoomStep: number = 0.1;  // Step size for zoom
  @Input() maxZoom: number; // maximum zoom factor
  @Input() minZoom: number; // minimum zoom factor
  @Input() showControls: boolean = true;
  @Input() fitOnInit: boolean = true;
  @Input() centerOnInit: boolean = true;
  @Input() cropWidth: number = 240;
  @Input() cropHeight: number = 300;
  // Outputs
  @Output() onCrop: EventEmitter<NoodleNgImageCropData> = new EventEmitter();
  // Component level properties
  imageBindingSource: string;
  private originalSource: string;
  // State flags
  public isReady: boolean = false;
  public isDragReady: boolean = false;
  public isDragging: boolean = false;
  public isCropping: boolean = false;
  public isCropped: boolean = false;
  public pointerPosition: NoodleNgImagePointerPosition = new NoodleNgImagePointerPosition();
  // Control properties - should be a model and bound to the template
  public cropRatio: number;
  public left: number;
  public top: number;
  public angle: number;
  public width: number;
  public height: number;
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
    this.originalSource = this.imageSource;
    // Set up call backs array //TODO Remove .bind(); Convert to lamdas?
    this.actionCallbacks[NoodleNgImageCropAction.rotateLeft] = this.rotateLeft.bind(this);
    this.actionCallbacks[NoodleNgImageCropAction.rotateRight] = this.rotateRight.bind(this);
    this.actionCallbacks[NoodleNgImageCropAction.zoomIn] = this.zoomIn.bind(this);
    this.actionCallbacks[NoodleNgImageCropAction.zoomOut] = this.zoomOut.bind(this);
    this.actionCallbacks[NoodleNgImageCropAction.zoomToFit] = this.zoomToFit.bind(this);
    this.actionCallbacks[NoodleNgImageCropAction.crop] = this.crop.bind(this);
    // Load image from source
    this.loadImage();
    // Initialize controls once loading finished.
    //TODO Convert to Observable
    setTimeout(() => this.initializeControls(), 1000);
  }

  // Destroy
  ngOnDestroy() {
    //TODO: Maintain array of callbacks to unbind
    if (this.startCallbackMouse) this.startCallbackMouse();
    if (this.moveCallbackMouse) this.moveCallbackMouse();
    if (this.stopCallbackMouse) this.stopCallbackMouse();
    if (this.startCallbackTouch) this.startCallbackTouch();
    if (this.moveCallbackTouch) this.moveCallbackTouch();
    if (this.stopCallbackTouch) this.stopCallbackTouch();
  }

  // Execute action button click event
  onAction(action: NoodleNgImageCropAction) {
    if (!action)
      return;

    this.actionCallbacks[action]();
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
      this.cropWidth < 1 ||
      this.cropHeight < 1 ||
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
      .get<string>(this.imageSource)
      .subscribe(
        (response) => {
          this.imageBindingSource = response.replace(/"/g, "");
        },
        () => {
          this.imageBindingSource = this.imageSource;
        });
  }

  // Initialize the component
  private initializeControls() {
    this.initializeActionButtons();
    this.setDimensions();

    if (this.imageHasToFit()) {
      this.fitImage();
      this.centerImage();
    }

    if (this.minZoom) {
      this.zoomImage(-1);
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

    // Save percentage crop data
    const scaledH = this.image.nativeElement.naturalHeight * this.cropData.scale;
    const scaledW = this.image.nativeElement.naturalWidth * this.cropData.scale;
    this.cropData.yPercent = this.cropData.y / scaledH;
    this.cropData.xPercent = this.cropData.x / scaledW;
    this.cropData.hPercent = this.cropData.h / scaledH;
    this.cropData.wPercent = this.cropData.w / scaledW;

    // Output the cropped data
    this.cropData.croppedImage = canvas.toDataURL("image/jpeg");
    this.onCrop.emit(this.cropData);
    this.isCropping = false;
    this.isCropped = true;
  }

  // Initialise the action buttons on the control
  private initializeActionButtons() {
    // default buttons
    if (!this.actionButtons) {
      this.actionButtons = 
      [
        { action: NoodleNgImageCropAction.rotateLeft, text: " < ", cssClass: null },
        { action: NoodleNgImageCropAction.rotateRight, text: " > ", cssClass: null },
        { action: NoodleNgImageCropAction.zoomIn, text: " + ", cssClass: null },
        { action: NoodleNgImageCropAction.zoomOut, text: " - ", cssClass: null },
        { action: NoodleNgImageCropAction.zoomToFit, text: " (fit) ", cssClass: null },
        { action: NoodleNgImageCropAction.crop, text: " [crop] ", cssClass: null }
      ];
    }
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
    this.container.nativeElement.style.height = (this.width * 100) + "%";
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
    // Drag events
    this.moveCallbackMouse = this.renderer.listen(this.image.nativeElement, "mousemove", ($event) => this.drag($event));
    this.moveCallbackTouch = this.renderer.listen(this.image.nativeElement, "touchmove", ($event) => this.drag($event));
    // Stop events
    this.stopCallbackMouse = this.renderer.listen(this.image.nativeElement, "mouseup", () => this.stopDrag());
    this.stopCallbackMouse = this.renderer.listen(this.image.nativeElement, "mouseout", () => this.stopDrag());
    this.stopCallbackTouch = this.renderer.listen(this.image.nativeElement, "touchend", () => this.stopDrag());

    this.isDragReady = true;
  }

  // Calculate the zoom factor. +ve = zoom in, -ve = zoom out.
  private getZoomFactor(step: number): number {
    if (step == 0)
      return 0;

    // zoom out
    if (step < 0) {
      const zoomOut = 1 / (1 + this.zoomStep);
      if (this.minZoom) {
        return (this.cropData.scale * zoomOut < this.minZoom)
          ? this.minZoom / this.cropData.scale
          : zoomOut;
      }

      return zoomOut;
    }

    // zoom in
    const zoomIn = 1 + this.zoomStep;
    if (this.maxZoom) {
      return (this.cropData.scale * zoomIn > this.maxZoom)
        ? this.maxZoom / this.cropData.scale
        : zoomIn;
    }

    return zoomIn;
  }

  // Start drag; binds events to handle dragging
  private startDrag($event) {
    if (this.isReady && this.isValidEvent($event)) {
      $event.preventDefault;
      $event.stopImmediatePropagation;
      this.isDragging = true;
      this.isCropped = false;
      this.pointerPosition = this.getPointerPosition($event);
    }
  }

  // Drag 
  private drag($event) {
    if (!this.isDragging)
      return;

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

  // Stop Drag
  private stopDrag() {
    this.isDragging = false;
  }

// Determine if an $event needs to be handled
  private isValidEvent($event): boolean {
    if (this.isTouchEvent($event)) {
      return $event.changedTouches.length === 1;
    }

    return $event.which === 1;
  }

  // Determine if the $event is a touch $event
  private isTouchEvent($event): boolean {
    return /touch/i.test($event.type);
  }

  // Set image offset
  private setOffset(left: number, top: number) {
    // Offset left.
    if (left || left === 0) {
      if (left < 0) { left = 0; }
      if (left > this.width - 1) { left = this.width- 1; }
      
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
    if (this.isTouchEvent($event)) {
      $event = $event.touches[0];
    }

    return {
      x: $event.pageX,
      y: $event.pageY
    };
  };
}
