import { Router } from "express";
import { registerUser, loginUser, logoutUser, updateProfileDetails,updateProfilePictureFile,forgotPassword } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

import {verifyJWT} from "../middlewares/auth.middleware.js"


const router = Router()

router.route("/register").post(
    upload.fields([
        {
          name: "profilePicture",
          maxCount: 1,
        }
      ]),    
    registerUser
)

router.route("/login").post(loginUser);
router.route("/forgot-password").post(forgotPassword);

// Secured routes
// Run the verifyJWT middleware before running the route logoutUser handler
router.route("/logout").post(verifyJWT ,logoutUser)

router.route("/update-profile").patch(verifyJWT, updateProfileDetails)

router.route("/update-profile-picture").patch(verifyJWT, upload.single("profilePicture"), updateProfilePictureFile)

export default router