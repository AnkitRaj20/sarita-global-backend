import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation
  // check if user exists
  // check for images
  // upload to the cloudinary server
  // create user object and send in the database
  // remove password  from the response
  // check for user creation
  // return res

  const { name, email, password } = req.body;

  console.log(req.body);

  // Check all fields are present - validation
  if ([name, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if user exists
  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Check if the  avatar file is present or not
  let profilePictureLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.profilePicture) &&
    req.files.profilePicture.length > 0
  ) {
    profilePictureLocalPath = req.files.profilePicture[0].path;
  }

  if (!profilePictureLocalPath) {
    throw new ApiError(400, "Profile Picture file is required");
  }

  // Upload to cloudinary
  const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);

  if (!profilePicture) {
    throw new ApiError(400, "Profile Picture file is required");
  }

  const user = await User.create({
    name,
    email,
    password,
    profilePicture: profilePicture.url
  });

  const createdUser = await User.findById(user._id).select(
    "-password"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));

});

export { registerUser };
