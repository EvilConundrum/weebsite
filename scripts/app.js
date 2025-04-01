const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcrypt");

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

// home for guests
// app.get("/home", async (req, res) => {
//   try {
//     const posts = await Post.find().lean();

//     // Get all unique author usernames from posts
//     const usernames = [...new Set(posts.map((post) => post.author))];

//     // Fetch profile pictures for all authors

//     const profilePictureMap = users.reduce((acc, user) => {
//       acc[user.username] = user.profilePicture || "/images/anonymous.png"; // Fallback
//       return acc;
//     }, {});

//     // Attach profile pictures to posts
//     const postsWithProfilePictures = posts.map((post) => ({
//       ...post,
//       authorProfilePicture: profilePictureMap[post.author],
//     }));

//     res.render("index", {
//       posts: postsWithProfilePictures, // Pass enriched posts
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Server error");
//   }
// });

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
    const user = await User.findOne({ username: username });

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      req.session.user = user;
      res.redirect("/home");
    } else {
      res.redirect("/login?error=invalid_credentials"); // Redirect with error flag
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
  try {
    const { action, oppaction, postId } = req.body;
    console.log(req.session.user._id);
    const userId = req.session.user._id;

    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    // console.log("Action:", action);
    // console.log("Opposite Action:", oppaction);

    let update = {}; // Track vote count changes

    // SAVE USER AND POST RELATED DATA
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.upvoteList.includes(postId)) {
      update.upvotes = action === "add" ? 1 : -1; // Upvote action

      await User.findByIdAndUpdate(userId, {
        $addToSet: { upvoteList: postId },
      });

      await Post.findByIdAndUpdate(
        req.params.id,
        { $inc: { upvotes: 1 } },
        { new: true }
      );

      if (user.downvoteList.includes(postId)) {
        update.downvotes = -1; // Remove downvote if switching vote
        await User.findByIdAndUpdate(userId, {
          $pull: { downvoteList: postId },
        });
        await Post.findByIdAndUpdate(
          req.params.id,
          { $inc: { downvotes: -1 } },
          { new: true }
        );
      }
    } else {
      await Post.findByIdAndUpdate(
        req.params.id,
        { $inc: { upvotes: -1 } },
        { new: true }
      );
      await User.findByIdAndUpdate(userId, { $pull: { upvoteList: postId } });
    }

    const post = await Post.findById(req.params.id).lean();

    console.log("Upvotes:", post.upvotes);
    console.log("Downvotes:", post.downvotes);

    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    console.error("Error in upvote:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.put("/downvote/:id", async (req, res) => {
  try {
    const { action, oppaction, postId } = req.body;
    const userId = req.session.user._id;

    if (!userId) return res.status(401).json({ error: "Not authenticated" });

    // console.log("Downvote Action:", action);
    // console.log("Opposite Action:", oppaction);

    let update = {}; // Track vote count changes

    // SAVE USER AND POST RELATED DATA

    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.downvoteList.includes(postId)) {
      update.downvotes = action === "add" ? 1 : -1; // Downvote action

      await User.findByIdAndUpdate(userId, {
        $addToSet: { downvoteList: postId },
      });

      await Post.findByIdAndUpdate(
        req.params.id,
        { $inc: { downvotes: 1 } },
        { new: true }
      );

      if (user.upvoteList.includes(postId)) {
        update.upvotes = -1; // Remove upvote if switching vote
        await User.findByIdAndUpdate(userId, { $pull: { upvoteList: postId } });

        await Post.findByIdAndUpdate(
          req.params.id,
          { $inc: { upvotes: -1 } },
          { new: true }
        );
      }
    } else {
      await Post.findByIdAndUpdate(
        req.params.id,
        { $inc: { downvotes: -1 } },
        { new: true }
      );
      await User.findByIdAndUpdate(userId, { $pull: { downvoteList: postId } });
    }

    const post = await Post.findById(req.params.id).lean();

    console.log("Upvotes:", post.upvotes);
    console.log("Downvotes:", post.downvotes);

    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    console.error("Error in downvote:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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

app.put("/follow-community", isAuthenticated, async (req, res) => {
  try {
    const { communityName } = req.body;

    const comm = await Community.findOne({ name: communityName }).lean();
    const commID = comm._id;

    const follow = await User.findByIdAndUpdate(
      req.session.user._id,
      { $addToSet: { communityList: commID } },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Community followed successfully", updatedUser });
  } catch (error) {
    console.error(error);
  }
});

app.put("/unfollow-community", isAuthenticated, async (req, res) => {
  try {
    const { communityName } = req.body;

    const comm = await Community.findOne({ name: communityName }).lean();
    const commID = comm._id;

    const follow = await User.findByIdAndUpdate(
      req.session.user._id,
      { $pull: { communityList: commID } },
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Community unfollowed successfully", updatedUser });
  } catch (error) {
    console.error(error);
  }
});

app.get("/user-votes", isAuthenticated, async (req, res) => {
  const selectedUser = await User.findById(req.session.user._id)
    .select("upvoteList downvoteList")
    .lean();

  res.json(selectedUser);
});
