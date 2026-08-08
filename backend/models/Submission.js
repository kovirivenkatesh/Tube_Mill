import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    supervisorEmail: { type: String, required: true, lowercase: true },
    supervisorEmails: { type: [String], default: [] },
    submittedByName: { type: String, required: true },
    submittedByEmail: { type: String, required: true, lowercase: true },
    empName: { type: String, required: true },
    empId: { type: String, required: true },
    dept: { type: String, required: true },
    section: { type: String, required: true },
    description: { type: String, required: true },
    tubeMill: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    supervisorComment: { type: String, default: "" },
    supervisorReviews: {
      type: [
        {
          email: { type: String, lowercase: true, required: true },
          status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
          },
          comment: { type: String, default: "" },
          approveToken: { type: String, required: true },
          decidedAt: { type: Date, default: null },
        },
      ],
      default: [],
    },
    images: { type: [String], default: [] },
    departmentSlug: { type: String, default: "" },
    millSlug: { type: String, default: "" },
    formData: { type: mongoose.Schema.Types.Mixed, default: {} },
    formSnapshot: {
      type: [
        {
          key: { type: String },
          label: { type: String },
          // Field named "type" must use explicit schema form or Mongoose treats it as [String].
          type: { type: String },
        },
      ],
      default: [],
    },
    approveToken: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

export const Submission = mongoose.model("Submission", submissionSchema);
