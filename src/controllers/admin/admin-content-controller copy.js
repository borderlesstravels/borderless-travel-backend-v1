const { sendError, sendSuccess, generateSlug } = require("../../utils/helpers");
const Content = require("../../models/content/Content");
const ContentCategory = require("../../models/content/ContentCategory");
const fs = require("fs");
const { uploadSingleImage } = require("../../middlewares/general");

const addPost = async (req, res) => {
  const adminId = req.id;

  const cover_image = await uploadSingleImage(
    req,
    res,
    "Please add a cover thumbnail image for the post"
  );

  const { title, content, author, category, post_status } = req.body;
  console.log("cover_image: ", cover_image);
  const slug = generateSlug(title);

  if (
    post_status === "scheduled" &&
    (!req.body.published_date ||
      req.body.published_date === null ||
      req.body.published_date == "")
  ) {
    return sendError(
      res,
      "Kindly specify the scheduled date for post auto-publishing"
    );
  }

  if (post_status === "scheduled") {
    published_date = req.body.published_date;
  } else {
    published_date = Date.now();
  }

  console.log("published_date", published_date);

  const newPost = new Content({
    title,
    slug,
    description,
    content,
    author,
    category,
    cover_image,
    post_status,
    published_date,
    published_by: adminId,
  });
  try {
    await newPost.save();
    return sendSuccess(
      res,
      "The post has been successfully published",
      newPost
    );
  } catch (err) {
    console.log("content post error", err);
    return sendError(res, "Unable to save the post to the databse", 500);
  }
};

const editPost = async (req, res) => {
  const post = await Content.findById(req.params.id);
  if (
    req.files["cover_image"] &&
    (req.files["cover_image"] !== "" || req.files["cover_image"] !== null)
  ) {
    const rawImagesArray = req.files["cover_image"];
    const namedImage = rawImagesArray.map((a) => a.filename);
    const stringnifiedImages = JSON.stringify(namedImage);
    const formmatedImages = stringnifiedImages.replace(/[^a-zA-Z0-9_.,]/g, "");
    const cover_image = formmatedImages.replace(/[,]/g, ", ");
    req.body.cover_image = cover_image;

    if (post) {
      console.log("post", post);
      let post_cover = post.cover_image;
      const file_path = path.join("public/files/imgs/posts", post_cover);
      console.log(file_path);

      fs.unlink(file_path, (err) => {
        if (err) {
          console.log(
            "there was a problem deleting the post cover from folder."
          );
        } else {
          console.log("post image deteled from folder");
        }
      });
    }
  } else if (req.files["cover_image"] && req.files["cover_image"] === "") {
    req.body.cover_image = post.cover_image;
  } else if (req.files["cover_image"] && req.files["cover_image"] === null) {
    req.body.cover_image = post.cover_image;
  } else {
    req.body.cover_image = post.cover_image;
  }

  try {
    const savedPost = await Content.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(res, "Successfully updated the post", savedPost);
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to update the post");
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Content.findById(req.params.id);
    if (post) {
      let post_cover = post.cover_image;
      const file_path = path.join("public/files/imgs/posts", post_cover);
      console.log(file_path);

      fs.unlink(file_path, (err) => {
        if (err) {
          console.log(
            "there was a problem deleting the post cover from folder."
          );
        } else {
          console.log("post image deteled from folder");
        }
      });
    }
    await Content.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the post");
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to delete the post");
  }
};

const fetchAllPosts = async (req, res) => {
  const { ...others } = req.query;
  try {
    const posts = await Content.find({
      ...others,
    }).limit(req.query.limit);
    return sendSuccess(res, "Succesfully fetched posts", posts);
  } catch (error) {
    return sendError(res, "Unable to fetch the posts data");
  }
};

const fetchSinglePost = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Content.findById(id);
    if (!post) {
      return sendError(res, "post does not exist");
    }
    return sendSuccess(res, "Succesfully fetched post", post);
  } catch (error) {
    return sendError(res, "Unable to fetch the post profile data");
  }
};

const addPostCategory = async (req, res) => {
  const adminId = req.id;
  const { category, slug } = req.body;

  const categoryExists = await ContentCategory.findOne({ category: category });
  const slugExists = await ContentCategory.findOne({
    slug: slug.toLowerCase(),
  });

  if (categoryExists) {
    return sendError(res, "Post category already exists");
  } else if (slugExists) {
    return sendError(res, "Post category slug already exists");
  }

  const postCategory = new ContentCategory({
    category,
    slug: slug.toLowerCase(),
    published_by: adminId,
  });
  try {
    await postCategory.save();
    return sendSuccess(
      res,
      "New post category has been successfully added",
      postCategory
    );
  } catch (err) {
    return sendError(
      res,
      "Unable to save the post category to the databse",
      500
    );
  }
};

const editPostCategory = async (req, res) => {
  try {
    const savedPostCategory = await ContentCategory.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    return sendSuccess(
      res,
      "Successfully updated the post category",
      savedPostCategory
    );
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to update the post category");
  }
};

const deletePostCategory = async (req, res) => {
  try {
    await ContentCategory.findByIdAndDelete(req.params.id);
    return sendSuccess(res, "Successfully deleted the post category");
  } catch (err) {
    console.log(err);
    return sendError(res, "Unable to delete the post category");
  }
};

const fetchAllPostCategories = async (req, res) => {
  const { ...others } = req.query;
  try {
    const postCategories = await ContentCategory.find({
      ...others,
    }).limit(req.query.limit);
    return sendSuccess(
      res,
      "Succesfully fetched post categories",
      postCategories
    );
  } catch (error) {
    return sendError(res, "Unable to fetch the post categories data");
  }
};

const fetchSinglePostCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const postCategory = await ContentCategory.findById(id);
    if (!postCategory) {
      return sendError(res, "post category does not exist");
    }
    return sendSuccess(res, "Succesfully fetched post category", postCategory);
  } catch (error) {
    console.log(error);
    return sendError(res, "Unable to fetch the post category");
  }
};

module.exports = {
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
};
