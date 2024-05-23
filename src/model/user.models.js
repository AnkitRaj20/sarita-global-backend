import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter a name"],
      trim: true,
      index: true, // Used for searching efficiently
    },
    email: {
        type: String,
        required: [true, "Please enter an email"],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Please enter a password"],
      },
    profilePicture: {
        type: String, //cloudnary url
        required: true,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);