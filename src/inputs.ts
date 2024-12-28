export interface PointerPosition {
  offsetX: number;
  offsetY: number;
}

interface OnDragArgs {
  from: PointerPosition;
  to: PointerPosition;
  pinchingWith?: PointerPosition;
}

interface InputEventHandlers {
  onDrag?: (args: OnDragArgs) => void;
  onClick?: (position: PointerPosition) => void;
  onZoom?: (delta: number) => void;
}

export type InputState = ReturnType<
  ReturnType<typeof makeInputs>["getInputState"]
>;

export function makeInputs(
  canvas: HTMLCanvasElement,
  handlers: InputEventHandlers
) {
  /**
   * The pointers that are currently hovering over the canvas in the order they
   * entered.
   */
  let hoveringPointers: {
    pointerId: number;
    offsetX: number;
    offsetY: number;
  }[] = [];

  /**
   * The pointers that are currently down on the canvas in the order they went
   * down.
   */
  let downPointers: {
    pointerId: number;
    offsetX: number;
    offsetY: number;
  }[] = [];

  let mightClick: undefined | PointerPosition;

  const getInputState = () => ({
    hoveringPointers,
    downPointers,
    mightClick,
  });

  const onPointerMove = (event: PointerEvent) => {
    {
      const downPointer = downPointers.find(
        (p) => p.pointerId === event.pointerId
      );
      if (downPointer) {
        let ignore = false;
        let pinchingWith: PointerPosition | undefined;
        if (downPointers[0].pointerId === event.pointerId) {
          pinchingWith = downPointers[1];
        } else if (downPointers[1].pointerId === event.pointerId) {
          pinchingWith = downPointers[0];
        } else {
          ignore = true;
        }

        if (!ignore) {
          handlers.onDrag?.({
            from: downPointer,
            to: { offsetX: event.offsetX, offsetY: event.offsetY },
            pinchingWith,
          });
        }

        downPointer.offsetX = event.offsetX;
        downPointer.offsetY = event.offsetY;

        if (mightClick) {
          const dx = event.offsetX - mightClick.offsetX;
          const dy = event.offsetY - mightClick.offsetY;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq > 25) {
            mightClick = undefined;
          }
        }

        return;
      }
    }

    {
      const hoveringPointer = hoveringPointers.find(
        (p) => p.pointerId === event.pointerId
      );
      if (hoveringPointer) {
        hoveringPointer.offsetX = event.offsetX;
        hoveringPointer.offsetY = event.offsetY;
        return;
      }
    }

    hoveringPointers.push({
      pointerId: event.pointerId,
      offsetX: event.offsetX,
      offsetY: event.offsetY,
    });
  };

  const onPointerLeave = (event: PointerEvent) => {
    hoveringPointers = hoveringPointers.filter(
      (p) => p.pointerId !== event.pointerId
    );
  };

  const onPointerDown = (event: PointerEvent) => {
    hoveringPointers = hoveringPointers.filter(
      (p) => p.pointerId !== event.pointerId
    );

    if (event.button !== 0) {
      return;
    }

    {
      const pointer = downPointers.find((p) => p.pointerId === event.pointerId);
      if (pointer) {
        console.warn("Pointer already down. This should be impossible.");
        return;
      }
    }

    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";

    downPointers.push({
      pointerId: event.pointerId,
      offsetX: event.offsetX,
      offsetY: event.offsetY,
    });

    if (downPointers.length === 1) {
      mightClick = { offsetX: event.offsetX, offsetY: event.offsetY };
    } else {
      mightClick = undefined;
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    downPointers = downPointers.filter((p) => p.pointerId !== event.pointerId);

    if (downPointers.length === 0) {
      canvas.style.cursor = "grab";
    }

    if (mightClick) {
      handlers.onClick?.(mightClick);
      mightClick = undefined;
    }
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    handlers.onZoom?.(event.deltaY);
  };

  canvas.addEventListener("wheel", onWheel);

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointerup", onPointerUp);

  canvas.style.touchAction = "none";

  canvas.style.cursor = "grab";

  return {
    getInputState,

    dispose: () => {
      canvas.removeEventListener("wheel", onWheel);

      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);

      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
    },
  };
}
