export const MAX_REPORT_IMAGE_BYTES = 650 * 1024;
export const MAX_REPORT_IMAGES = 4;

export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
