/* Phone photos are often 3–8 MB, and the host rejects requests over ~6 MB, so
   photos are downscaled in the browser before they are checked or uploaded. */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY  = 0.82;

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Older Safari: fall through to an <img> element
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Returns a JPEG no larger than 1600px on its longest side, or the original if that isn't smaller. */
export async function compressImage(file: File): Promise<File> {
  try {
    const source = await loadBitmap(file);
    const scale  = Math.min(1, MAX_DIMENSION / Math.max(source.width, source.height));
    const width  = Math.round(source.width * scale);
    const height = Math.round(source.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width  = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(source, 0, 0, width, height);
    if ("close" in source) source.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}

/** Parses a JSON response, turning non-JSON error pages from the host into a readable message. */
export async function readJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  try {
    return await res.json();
  } catch {
    if (res.status === 413) throw new Error("Your photos are too large to upload. Try removing one and submitting again.");
    throw new Error(`The server had a problem (error ${res.status}). Please try again in a moment.`);
  }
}
