import "fabric";

declare module "fabric" {
  namespace fabric {
    interface Image {
      id?: string;
    }
    // Add the missing overload
    namespace Image {
      function fromURL(
        url: string,
        callback?: (img: fabric.Image | null) => void,
        options?: any
      ): void;
    }
  }
}
