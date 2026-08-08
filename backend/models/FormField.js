import mongoose from "mongoose";

const formFieldSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    fieldKey: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["text", "textarea", "number", "email", "select"],
      default: "text",
    },
    options: { type: [String], default: [] },
    placeholder: { type: String, default: "" },
    required: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FormField = mongoose.model("FormField", formFieldSchema);
