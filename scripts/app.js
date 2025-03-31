const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");

const app = express();

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "../views"));
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: false,
    partialsDir: path.join(__dirname, "../views/partials"),
  })
);

app.use(express.static("weebsite"));

mongoose
  .connect("mongodb://127.0.0.1:27017/weebsiteDB")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const { User, Post, Notification, Comment, Community } = require("./db.js");
const { createUser, createPost, createNotification } = require("./data.js");

// Middleware
// In app.js session config
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Ensure proper middleware order
app.use(cookieParser());
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Add JSON parsing middleware

const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files

app.use(
  "/images/profile-pictures",
  express.static(path.join(__dirname, "../weebsite/images/profile-pictures"))
);

const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../weebsite/images/profile-pictures")); // Updated path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Unique filename
  },
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    // For API routes, return JSON error
    if (req.originalUrl.startsWith("/api")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.redirect("/login");
  }
};
app.use("/styles", express.static(path.join(__dirname, "../styles")));
app.use("/images", express.static(path.join(__dirname, "../images")));
app.use("/scripts", express.static(path.join(__dirname, "../scripts")));

app.listen(9000, "localhost", () => {
  console.log("Server is listening on port 9000");
});

app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: false,
    partialsDir: path.join(__dirname, "../views/partials"),
    helpers: {
      // Add this helper
      includes: function (array, value, options) {
        if (array && array.includes(value)) {
          return options.fn(this);
        }
        return options.inverse(this);
      },
      timestamp: () => Date.now(),
    },
  })
);

app.get("/home", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const posts = await Post.find().lean();

    // Get all unique author usernames from posts
    const usernames = [...new Set(posts.map((post) => post.author))];

    // Fetch profile pictures for all authors
    const users = await User.find(
      { username: { $in: usernames } },
      "username profilePicture"
    ).lean();
    const profilePictureMap = users.reduce((acc, user) => {
      acc[user.username] = user.profilePicture || "/images/anonymous.png"; // Fallback
      return acc;
    }, {});

    // Attach profile pictures to posts
    const postsWithProfilePictures = posts.map((post) => ({
      ...post,
      authorProfilePicture: profilePictureMap[post.author],
    }));

    res.render("index", {
      userData: {
        profilePicture: user.profilePicture,
        username: user.username,
      },
      posts: postsWithProfilePictures, // Pass enriched posts
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// app.get("/home", async (req, res) => {
//   try {
//     const posts = await Post.find().lean();
//     console.log("Posts fetched successfully:", posts);
//     res.render(path.join(__dirname, "../views/index.hbs"), { posts });
//   } catch (error) {
//     console.error("Error fetching posts:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  try {
    let userData = null;
    if (req.session.user) {
      const user = await User.findById(req.session.user._id).lean();
      userData = {
        profilePicture: user.profilePicture || "/images/anonymous.png",
        username: user.username,
      };
    }

    const post = await Post.findById(id).lean();
    const authorUser = await User.findOne({ username: post.author }).lean();
    post.authorProfilePicture =
      authorUser?.profilePicture || "/images/anonymous.png";

    // Get comments with authors' profile pictures
    const comments = await Comment.find({ postId: id }).lean();
    const commentAuthors = [...new Set(comments.map((c) => c.author))];
    const commentUsers = await User.find(
      { username: { $in: commentAuthors } },
      "username profilePicture"
    ).lean();

    const commentProfileMap = commentUsers.reduce((acc, user) => {
      acc[user.username] = user.profilePicture || "/images/anonymous.png";
      return acc;
    }, {});

    const commentsWithPictures = comments.map((comment) => ({
      ...comment,
      authorProfilePicture: commentProfileMap[comment.author],
      isAuthor: userData && userData.username === comment.author,
    }));

    res.render("postView", {
      userData,
      post,
      comments: commentsWithPictures,
      isAuthor: userData && userData.username === post.author,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/profile/", isAuthenticated, async (req, res) => {
  try {
    const userData = await User.findById(req.session.user._id)
      .populate("posts")
      .populate("comments")
      .lean();

    res.render("profile", {
      userData: {
        ...userData,
        username: userData.username,
        profilePicture: userData.profilePicture,
        bio: userData.bio,
      },
    });
  } catch (error) {
    console.error("Profile load error:", error);
    res.status(500).send("Error loading profile");
  }
});

app.get("/edit-profile", isAuthenticated, (req, res) => {
  const userData = req.session.user;
  res.render("edit-profile", { userData });
});

app.get("/create-post", isAuthenticated, (req, res) => {
  res.render(path.join(__dirname, "../views/createPost.hbs"));
});

app.post("/create-post", upload.array("images", 5), async (req, res) => {
  // console.log("Received request body:", req.body); // Debugging
  // console.log("Received file:", req.files); // Debugging
  const { title, content, author, community } = req.body;
  const imagePath = req.files ? req.files.path : null;
  const newPost = await Post.create({
    title,
    content,
    author,
    community,
    images: imagePath,
  });
  console.log("Post saved successfully:", newPost);
});

app.get("/", (req, res) => {
  res.render("index", {
    userData: req.session.user || null, // Pass null if no user is logged in
  });
});

app.get("/login", (req, res) => {
  res.render(path.join(__dirname, "../views/login-pop-up.hbs"));
});

// Login route (POST)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (user && user.password === password) {
      // Store essential user data in session
      req.session.user = {
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
      };
      res.redirect("/home");
    } else {
      res.redirect("/login?error=invalid_credentials");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Internal server error.");
  }
});

app.get("/signup", async (req, res) => {
  res.render(path.join(__dirname, "../views/signup-pop-up.hbs"));
});

app.post("/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  console.log(req.body);

  try {
    const newUser = await createUser(username, password);
    console.log("User created successfully:", newUser);

    // Set session user after successful signup
    req.session.user = newUser;

    // Respond with success message
    res.status(201).send(newUser.username + " has been created!");
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send("Error creating user: " + error.message);
  }
});

app.post(
  "/create-post",
  isAuthenticated,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { title, content, community } = req.body;
      const author = req.session.user.username; // Use username instead of _id

      const imagePaths = req.files ? req.files.map((file) => file.path) : [];

      const newPost = await Post.create({
        title,
        content,
        author, // Now stores the username string
        community,
        images: imagePaths,
      });

      res.redirect("/home");
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).send("Failed to create post");
    }
  }
);

app.get("/api/notifications", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const notifications = await Notification.find({
      user: req.session.user._id,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Notification route
// Update the notification route
app.post("/api/notifications", async (req, res) => {
  try {
    const { postId, postAuthor, type } = req.body; // Add 'type' to destructuring
    const likerId = req.session.user._id;

    const postOwner = await User.findOne({ username: postAuthor });
    if (!postOwner) return res.status(404).json({ error: "User not found" });

    const notification = await Notification.create({
      user: postOwner._id,
      type: type, // Use the type from request body
      content:
        type === "Like"
          ? "Your post has been liked!"
          : "Your post has been disliked.",
      postId,
      read: false,
    });

    res.status(201).json({ notification });
  } catch (error) {
    console.error("Notification error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/upvote/:id", async (req, res) => {
  const { action, oppaction } = req.body;
  console.log("Action:", action);
  console.log("Opp Action:", oppaction);

  let update = {};

  if (action === "add") {
    update.upvotes = 1;
  } else if (action === "remove") {
    update.upvotes = -1;
  }

  if (oppaction === "remove") {
    update.downvotes = -1;
  }

  if (Object.keys(update).length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid request. No valid action provided." });
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: update },
    { new: true }
  );

  res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
});

app.put("/downvote/:id", async (req, res) => {
  const { action, oppaction } = req.body;
  console.log("Downvote Action:", action);
  console.log("Opposite Action:", oppaction);

  let update = {};

  // Handle main downvote action
  if (action === "add") {
    update.downvotes = 1;
  } else if (action === "remove") {
    update.downvotes = -1;
  }

  // Handle opposite vote removal
  if (oppaction === "remove") {
    update.upvotes = -1;
  }

  if (Object.keys(update).length === 0) {
    return res
      .status(400)
      .json({ error: "Invalid request. No valid action provided." });
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: update },
    { new: true }
  );

  res.json({ downvotes: post.downvotes, upvotes: post.upvotes });
});

app.post(
  "/create-comment",
  isAuthenticated, // Add authentication check
  upload.none(),
  async (req, res) => {
    try {
      const { content, postId } = req.body;
      const author = req.session.user.username; // Get username from session

      const newComment = await Comment.create({
        author, // Use session username
        content,
        postId,
      });

      res.redirect(`/post/${postId}`); // Redirect back to the post
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).send("Failed to create comment");
    }
  }
);

// Profile update route
app.post(
  "/update-profile",
  isAuthenticated,
  profileUpload.single("profilePicture"), // Use profile-specific upload config
  async (req, res) => {
    try {
      const updateData = {
        bio: req.body.bio,
      };

      // Handle profile picture update
      if (req.file) {
        updateData.profilePicture = `/images/profile-pictures/${req.file.filename}`;
      }

      // Update user document
      const updatedUser = await User.findByIdAndUpdate(
        req.session.user._id,
        { $set: updateData },
        { new: true }
      );

      // Update session data
      req.session.user = updatedUser;

      res.redirect("/profile");
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).send("Error updating profile");
    }
  }
);

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("Logout error");
    }
    res.redirect("/"); // Redirect to root after logout
  });
});

app.put("/edit-comment", upload.none(), async (req, res) => {
  const { content, id } = req.body;

  if (!id || !content || content === "") {
    return res
      .status(400)
      .json({ error: "Content is required and cannot be empty." });
  }

  console.log(content);
  console.log(id);

  const editComment = await Comment.findByIdAndUpdate(
    id,
    { content },
    { new: true }
  );

  res.json({ success: true, content });
});

app.delete("/delete-comment/:id", async (req, res) => {
  const { id } = req.params;

  const deletedComment = await Comment.findByIdAndDelete(id);

  if (!deletedComment) {
    return res.status(404).json({ error: "Comment not found." });
  }

  res.json({ success: true, message: "Comment deleted successfully." });
});

app.put("/edit-post", upload.none(), async (req, res) => {
  const { content, id } = req.body;

  if (!id || !content || content === "") {
    return res
      .status(400)
      .json({ error: "Content is required and cannot be empty." });
  }

  console.log(content);
  console.log(id);

  const editComment = await Post.findByIdAndUpdate(
    id,
    { content },
    { new: true }
  );

  res.json({ success: true, content });
});

app.delete("/delete-post/:id", async (req, res) => {
  const { id } = req.params;

  const deletedPost = await Post.findByIdAndDelete(id);
  const commentsPost = await Comment.deleteMany({ postId: id });

  if (!deletedPost) {
    return res.status(404).json({ error: "Post not found." });
  }

  res.json({ success: true, message: "Post deleted successfully." });
});

// app.post("/create-post", upload.single("image"), async (req, res) => {
//   const { title, description, tags, author } = req.body;
//   const image = req.file;

//   const images = image ? [image.filename] : [];

//   try {
//     await createPost(title, description, tags, author, images);
//     res.status(201).json({ message: "Post created successfully!" }); // Send success response
//   } catch (error) {
//     console.error("Error creating post:", error);
//     res.status(500).json({ error: "Failed to create post" });
//   }
// });

app.get("/community/:name", async (req, res) => {
  const { name } = req.params;

  try {
    const community = await Community.findOne({ name }).lean();
    if (!community) {
      return res.status(404).send("Community not found");
    }

    const posts = await Post.find({ community: name }).lean();
    res.render("community", { community, posts });
  } catch (error) {
    console.error("Error loading community:", error);
    res.status(500).send("Error loading community");
  }
});

app.get("/popular", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const sortedPosts = await Post.find().sort({ upvotes: -1 }).lean();

    res.render(path.join(__dirname, "../views/popular.hbs"), {
      userData: {
        profilePicture: user.profilePicture,
        username: user.username,
      },
      sortedPosts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/explore", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const communities = await Community.find().lean();

    res.render(path.join(__dirname, "../views/explore.hbs"), {
      userData: {
        profilePicture: user.profilePicture,
        username: user.username,
      },
      communities,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});
