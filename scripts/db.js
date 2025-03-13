const { Schema, model } = require("mongoose");

const postSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String },
  author: { type: String, required: true },
  community: { type: String, required: true },
  upvotes: { type: Number, required: true },
  downvotes: { type: Number, required: true },
  images: [{ type: String }],
});

const commentSchema = new Schema({
  author: { type: String, required: true },
  content: { type: String, required: true },
  postID: { type: Schema.Types.ObjectId, ref: "Post", required: true },
});

const userSchema = new Schema({
  profilePicture: { type: String },
  username: { type: String, required: true },
  bio: { type: String, required: true },
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
  communityPfp: { type: String },
  bannerPfp: { type: String },
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

// Sample Data
createSampleData();
async function createSampleData() {
  const post = await Post.create({
    title: "[Interspecies Reviewers] Should I watch Interspecies Reviewers?",
    content: `My friend kept telling me about this show in school going all like "oh should watch it and then review it so that you get a double review" And it does look interesting, it has an interesting premise, but at the same time I heard that there's a lot of not-so-kid-friendly content within the show (yes you know what I'm talking about). Normally I don't watch a movie or TV show if THAT is front and center, but I have heard some good things about this anime and I'm willing to try it out, but I definitely would be uncomfortable if the only reason to watch it is for those scenes. Should I give it a go? Why do you think so?`,
    author: "u/ishigamiYu",
    community: "r/interspeciesReviewers",
    upvotes: 426960,
    downvotes: 6967,
    });
  console.log(post);
}

Post.create({
  title: "[Interspecies Reviewers] Should I watch Interspecies Reviewers?",
  author: "u/ishigamiYu",
  community: "r/interspeciesReviewers",
  upvotes: 426960,
  downvotes: 6960,
  image: ["interspeciesReviewers.jpg"],
});
