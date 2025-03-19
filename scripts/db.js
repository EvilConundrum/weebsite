const { Schema, model } = require("mongoose");

const postSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String },
  author: { type: String, required: true },
  community: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 },
  images: [{ type: String }], // Image file names
});

const commentSchema = new Schema({
  author: { type: String, required: true },
  content: { type: String, required: true },
  postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
});

const userSchema = new Schema({
  profilePicture: { type: String },
  username: { type: String, required: true },
  bio: { type: String },
  password: { type: String, required: true },
  posts: { type: Schema.Types.ObjectId, ref: "Post" },
  comments: { type: Schema.Types.ObjectId, ref: "Comment" },
  upvoteList: { type: Schema.Types.ObjectId, ref: "Post" },
  downvoteList: { type: Schema.Types.ObjectId, ref: "Post" },
});

const communitySchema = new Schema({
  name: { type: String, required: true },
  members: { type: Number, required: true },
  onlineMembers: { type: Number, required: true },
  dateCreated: { type: Date, required: true },
  description: { type: String, required: true },
  communityPfp: { type: String, required: true },
  bannerPfp: { type: String, required: true },
  posts: { type: Schema.Types.ObjectId, ref: "Post" },
});

const notificationSchema = new Schema({
  userID: { type: Number, required: true },
  content: { type: String, required: true },
  type: { type: String, required: true },
  read: { type: Boolean, required: true },
});

const Post = model("Post", postSchema);
const Comment = model("Comment", commentSchema);
const User = model("User", userSchema);
const Community = model("Community", communitySchema);
const Notification = model("Notification", notificationSchema);

module.exports = { Post, Comment, User, Community, Notification };

// How to Use:
// const { Post, Comment, User, Community, Notification } = require("./db.js");
// Note that this file path probably won't work. Because I'm bad at file paths.
