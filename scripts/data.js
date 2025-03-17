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
  try {
    const user = new User({
      username: username,
      password: password,
    });
    
    // Save the user to the database
    await user.save();
    console.log("User saved successfully:", user);
    return user;
  } catch (err) {
    console.error("Error creating user:", err);
    throw err;
  }
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
