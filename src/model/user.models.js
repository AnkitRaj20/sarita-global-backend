import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


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
        type: String, //cloudinary url
        required: true,
    },
  },
  { timestamps: true }
);

// Runs before saving the user to the database
// pre is a hook
userSchema.pre("save", async function (next) {
  // If password is modified then run this code
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Check if the password is correct or not
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function(){
  return jwt.sign({
      _id:this._id,
      email:this.email,
      name:this.name
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  }
  )
}

export const User =  mongoose.model("User", userSchema);