// Sample Data and Data Creation Functions
const { Post, Comment, User, Community, Notification } = require("./db.js");
const argon2 = require("argon2");

const createPost = async (title, content, author, community, images = []) => {
  try {
    const newPost = new Post({
      title,
      content,
      author,
      community,
      upvotes: 0, // Default values to ensure proper initialization
      downvotes: 0,
      images,
    });

    await newPost.save(); // Explicit save for flexibility
    console.log("Post created successfully:", newPost);

    return newPost;
  } catch (err) {
    console.error("Error creating post:", err);
    throw err; // Propagate the error for proper error handling
  }
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
  try {
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return null;
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
      saltLength: 16,
    });

    const user = new User({
      profilePicture: "/images/profile-pictures/default.gif",
      username: username,
      password: hashedPassword,
    });

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
  try {
    const newNotification = new Notification({
      userID,
      content,
      type,
      read: false, // should default be unread?
    });

    await newNotification.save();
    console.log(
      `Notification  for user ${userID} created successfully:`,
      newNotification
    );
    return newNotification;
  } catch (error) {
    console.log(
      `Error creating notification  for user ${userID}:`,
      newNotification
    );
    throw error;
  }
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
  createComment,
  createUser,
  createCommunity,
  createNotification,
  testPost,
};
