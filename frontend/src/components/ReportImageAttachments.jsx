import { useRef } from "react";
import { MAX_REPORT_IMAGE_BYTES, MAX_REPORT_IMAGES, readFileAsDataURL } from "../utils/image";
import { useToast } from "./Toast";

export default function ReportImageAttachments({ images, onChange, disabled }) {
  const inputRef = useRef(null);
  const { showToast } = useToast();

  async function onFilesSelected(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    const remaining = MAX_REPORT_IMAGES - images.length;
    if (remaining <= 0) {
      showToast(`You can attach up to ${MAX_REPORT_IMAGES} images.`, "error");
      return;
    }

    const toAdd = files.slice(0, remaining);
    if (files.length > remaining) {
      showToast(`Only ${remaining} more image(s) allowed.`, "info");
    }

    const next = [...images];
    for (const file of toAdd) {
      if (!file.type.startsWith("image/")) {
        showToast(`${file.name}: not an image file.`, "error");
        continue;
      }
      if (file.size > MAX_REPORT_IMAGE_BYTES) {
        showToast(`${file.name}: must be under 650 KB.`, "error");
        continue;
      }
      try {
        next.push(await readFileAsDataURL(file));
      } catch {
        showToast(`Could not read ${file.name}.`, "error");
      }
    }
    onChange(next);
  }

  function removeAt(index) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="field report-images-field">
      <label htmlFor="report-images">Photos (optional)</label>
      <p className="field-hint">Up to {MAX_REPORT_IMAGES} images, 650 KB each — included in the supervisor email.</p>
      {images.length > 0 && (
        <ul className="report-image-previews">
          {images.map((src, i) => (
            <li key={i}>
              <img src={src} alt={`Attachment ${i + 1}`} />
              {!disabled && (
                <button type="button" className="report-image-remove" onClick={() => removeAt(i)} aria-label={`Remove image ${i + 1}`}>
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <input
        ref={inputRef}
        id="report-images"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={disabled || images.length >= MAX_REPORT_IMAGES}
        onChange={onFilesSelected}
      />
      <button
        type="button"
        className="btn btn-ghost btn-sm report-image-add"
        disabled={disabled || images.length >= MAX_REPORT_IMAGES}
        onClick={() => inputRef.current?.click()}
      >
        {images.length ? "Add more photos" : "Attach photos"}
      </button>
    </div>
  );
}

export function SubmissionImages({ images, compact }) {
  if (!images?.length) return null;
  return (
    <ul className={`submission-images${compact ? " submission-images-compact" : ""}`}>
      {images.map((src, i) => (
        <li key={i}>
          <a href={src} target="_blank" rel="noopener noreferrer">
            <img src={src} alt={`Report photo ${i + 1}`} />
          </a>
        </li>
      ))}
    </ul>
  );
}
