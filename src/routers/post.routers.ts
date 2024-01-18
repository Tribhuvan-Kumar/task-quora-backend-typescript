import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  createNewPost,
  deletePost,
  getUserPosts,
  updatePost,
} from "../controllers/post.controllers";

const router = Router();

router.route("/add-post").post(verifyJWT, createNewPost);
router.route("/get-user-posts").get(verifyJWT, getUserPosts);
router.route("/update-post").put(updatePost);
router.route("/delete-post").delete(deletePost);

export default router;
