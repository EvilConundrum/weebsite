// Sample Data and Data Creation Functions
const { Post, Comment, User, Community, Notification } = require("./db.js");

const createPost = async (title, content, author, community) => {
  const newPost = await Post.create({
    title,
    content,
    author,
    community,
  });

  return newPost;
};

const createPost2 = async (title, content, author, community) => {
  const newPost = await Post.create({
    title,
    content,
    author,
    community,
  });

  return newPost;
};

const createComment = async (author, content, postID) => {
  const newComment = await Comment.create({
    author,
    content,
    postID,
  });

  return newComment;
};

const createUser = async (username, password) => {
  console.log(username + " " + password);
  const user = new User({
    username: username,
    password: password,
  });

  //   const newUser = await User.create({
  //     username: username,
  //     password: password,
  //   }).catch((err) => {
  //     console.log("ERR!!!!");
  //     console.log(err);
  //   });

  //   return newUser;
};

const createCommunity = async (
  name,
  members,
  onlineMembers,
  dateCreated,
  description,
  communityPfp,
  bannerPfp
) => {
  const newCommunity = await Community.create({
    name,
    members,
    onlineMembers,
    dateCreated,
    description,
    communityPfp,
    bannerPfp,
  });

  return newCommunity;
};

const createNotification = async (userID, content, type, read) => {
  const newNotification = await Notification.create({
    userID,
    content,
    type,
    read,
  });

  return newNotification;
};

// THIS IS ONLY HERE BECAUSE WE DONT HAVE THE GODDAMN FILE UPLOAD

const testPost = async (title, content, author, community) => {
  const newPost = await Post.create({
    title,
    content,
    author,
    community,
  });

  return newPost;
};

module.exports = {
  createPost,
  createPost2,
  createComment,
  createUser,
  createCommunity,
  createNotification,
  testPost,
};
