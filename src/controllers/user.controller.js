import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../model/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import sendEmail from "../utils/mailer.js";

const generateAccessTokenFunction = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = await user.generateAccessToken();
  return { accessToken };
};

//* REGISTER CONTROLLER
const registerUser = asyncHandler(async (req, res) => {
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
    profilePicture: profilePicture.url,
  });

  const createdUser = await User.findById(user._id).select(
    "-password  -forgotPasswordToken -forgotPasswordTokenExpiry"
  );

  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

//* LOGIN CONTROLLER
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // finding the user based on username or email
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // isPasswordCorrect is a method on the user object created by me in the user model, Hence we are using it by user not User
  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid User Credentials");
  }

  const { accessToken } = await generateAccessTokenFunction(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password  -forgotPasswordToken  -forgotPasswordTokenExpiry"
  );

  if (!loggedInUser) {
    throw new ApiError(404, "User not found");
  }

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
        },
        "User logged In Successfully"
      )
    );
});

//* LOGOUT CONTROLLER
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    new: true,
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

//* UPDATE PROFILE CONTROLLER
const updateProfileDetails = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  if (!email && !name) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        name,
        email,
      },
    },
    { new: true }
  ).select("-password  -forgotPasswordToken  -forgotPasswordTokenExpiry");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

//* UPDATE PROFILE PICTURE CONTROLLER
const updateProfilePictureFile = asyncHandler(async (req, res) => {
  const profilePictureLocalPath = req.file?.path;

  if (!profilePictureLocalPath) {
    throw new ApiError(400, "Profile Picture file is missing");
  }

  const profilePicture = await uploadOnCloudinary(profilePictureLocalPath);

  if (!profilePicture.url) {
    throw new ApiError(400, "Error while uploading on profilePicture");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        profilePicture: profilePicture.url,
      },
    },
    { new: true }
  ).select("-password  -forgotPasswordToken  -forgotPasswordTokenExpiry");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user, "profilePicture image updated successfully")
    );
});

//* FORGOT PASSWORD CONTROLLER
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const lowerEmail = email.toLowerCase();
  // Checks if user exsits or not
  const user = await User.findOne({ email: lowerEmail });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Send verification email
  await sendEmail({
    email,
    emailType: "RESET",
    userId: user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, email, "Email sent successfully"));

});

export {
  registerUser,
  loginUser,
  logoutUser,
  updateProfileDetails,
  updateProfilePictureFile,
  forgotPassword
};
