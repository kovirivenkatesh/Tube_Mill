import mongoose from "mongoose";

const millSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    departmentSlug: { type: String, required: true, index: true, lowercase: true, trim: true },
    slug: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

millSchema.index({ departmentSlug: 1, slug: 1 }, { unique: true });

export const Mill = mongoose.model("Mill", millSchema);
