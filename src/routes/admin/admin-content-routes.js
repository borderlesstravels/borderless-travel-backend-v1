const express = require("express");
const upload = require("../../../multer");
const {
  verifyAdminLoginToken,
} = require("../../controllers/admin/admin-auth-controller");
const { validateAddPost } = require("../../middlewares/validator");
const {
  addPost,
  editPost,
  deletePost,
  fetchAllPosts,
  fetchSinglePost,
  addPostCategory,
  editPostCategory,
  deletePostCategory,
  fetchAllPostCategories,
  fetchSinglePostCategory,
} = require("../../controllers/admin/admin-content-controller");
const { postImageUpload } = require("../../utils/helpers/files");

const router = express.Router();

router.post(
  "/add-new-post",
  verifyAdminLoginToken,
  validateAddPost,
  upload.array("cover_image"),
  addPost
);
router.put(
  "/edit-post/:id",
  verifyAdminLoginToken,
  upload.array("cover_image"),
  editPost
);
router.delete("/delete-post/:id", verifyAdminLoginToken, deletePost);
router.get("/all-posts", verifyAdminLoginToken, fetchAllPosts);
router.get("/single-post/:id", verifyAdminLoginToken, fetchSinglePost);

router.post("/add-post-category", verifyAdminLoginToken, addPostCategory);
router.put("/edit-post-category/:id", verifyAdminLoginToken, editPostCategory);
router.delete(
  "/delete-post-category/:id",
  verifyAdminLoginToken,
  deletePostCategory
);
router.get(
  "/all-post-categories",
  verifyAdminLoginToken,
  fetchAllPostCategories
);
router.get(
  "/single-post-category/:id",
  verifyAdminLoginToken,
  fetchSinglePostCategory
);

module.exports = router;
