const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const multer = require("multer");
const fs = require("fs");
const argon2 = require("argon2");
const MongoStore = require("connect-mongo");

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

app.use(express.static(path.join(__dirname, "..")));
app.use("/styles", express.static(path.join(__dirname, "../styles")));
app.use("/scripts", express.static(path.join(__dirname, "../scripts")));
app.use("/images", express.static(path.join(__dirname, "../images")));

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://weebsite-admin:sirartismygoat@weebsite-cluster.1kjr1.mongodb.net/";

if (!MONGO_URI) {
    console.error("MONGO_URI is missing. Check your environment variables.");
    process.exit(1);
}

mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000, 
})
.then(() => console.log('MongoDB Connected'))
.catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
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
    store: MongoStore.create({
      mongoUrl: MONGO_URI, // Use the same URI as mongoose connection
      ttl: 24 * 60 * 60, // Session TTL (optional)
    }),
    secret: "0930bf6414bf7b802c18a165a151eeca015a4edf7a945aa75b365c716b99ecfd", // Use a strong secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: false,
    partialsDir: path.join(__dirname, "../views/partials"),
    helpers: {
      // Add the json helper here
      json: (context) => {
        return JSON.stringify(context).replace(/</g, "\\u003c");
      },
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

app.get("/post/:id", isAuthenticated, async (req, res) => {
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
    const { tabName: tabName } = req.query;
    const userData = await User.findById(req.session.user._id)
      .populate("posts")
      .populate("comments")
      .lean();

    let data = {};
    let isPostsTab = false;
    let isSharedPostsTab = false;
    let isUpvotesTab = false;
    let isDownvotesTab = false;

    switch (tabName) {
      case "posts":
        console.log("Tab Name:", tabName);
        data.posts = await Post.find({ _id: { $in: userData.posts } }).lean();
        isPostsTab = true;
        break;
      case "shared-posts":
        console.log("Tab Name:", tabName);
        data.sharedPosts = await Post.find({
          _id: { $in: userData.sharedPosts },
        }).lean();
        isSharedPostsTab = true;
        break;
      case "upvotes":
        console.log("Tab Name:", tabName);
        data.upvotedPosts = await Post.find({
          _id: { $in: userData.upvoteList },
        }).lean();
        isUpvotesTab = true;
        break;
      case "downvotes":
        console.log("Tab Name:", tabName);
        data.downvotedPosts = await Post.find({
          _id: { $in: userData.downvoteList },
        }).lean();
        isDownvotesTab = true;
        break;
      default:
        return res.status(400).send("Invalid tab");
    }

    res.render("profile", {
      userData, // No need to manually destructure
      ...data, // This spreads posts, upvotedPosts, etc.
      isPostsTab,
      isSharedPostsTab,
      isUpvotesTab,
      isDownvotesTab,
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

app.get("/", async (req, res) => {
  try {
    let userData = null;
    if (req.session.user) {
      const user = await User.findById(req.session.user._id).lean();
      userData = {
        profilePicture: user.profilePicture,
        username: user.username,
      };
    }

    const posts = await Post.find().lean();
    const usernames = [...new Set(posts.map((post) => post.author))];
    const users = await User.find(
      { username: { $in: usernames } },
      "username profilePicture"
    ).lean();

    const profilePictureMap = users.reduce((acc, user) => {
      acc[user.username] = user.profilePicture || "/images/anonymous.png";
      return acc;
    }, {});

    const postsWithProfilePictures = posts.map((post) => ({
      ...post,
      authorProfilePicture: profilePictureMap[post.author],
    }));

    res.render("index", {
      userData: userData, // Pass null for guests
      posts: postsWithProfilePictures,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

app.get("/login", (req, res) => {
  res.render(path.join(__dirname, "../views/login-pop-up.hbs"));
});

// Login route (POST)
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.redirect("/login?error=invalid_credentials");
    }

    console.log(user.password);
    console.log(password);

    // const isMatch = await argon2.verify(user.password, password);
    const isMatch = user.password === password; // Use plain password for now 
    
    if (isMatch) {
      req.session.user = user;
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

    // Respond with success messageabout:blank#blocked
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
      // Debug log the entire request body
      console.log("Full request body:", req.body);

      if (!req.body.title || !req.body.community) {
        return res.status(400).json({
          error: "Title and community are required",
          message: "Please fill in all required fields.",
        });
      }

      // First check if community exists before proceeding
      const existingCommunity = await Community.findOne({
        name: req.body.community,
      }).lean();

      if (!existingCommunity) {
        return res.status(404).json({
          error: "Community not found",
          message:
            "This community does not exist. Please select a valid community.",
        });
      }

      // Only proceed with post creation if community exists
      const postData = {
        title: req.body.title.trim(),
        content: req.body.content ? req.body.content.trim() : "",
        community: req.body.community,
        author: req.session.user.username,
        images: req.files ? req.files.map((file) => file.path) : [],
      };

      // Create the post
      const newPost = await Post.create(postData);
      console.log("Created post:", newPost);

      // Update user's posts array
      await User.findByIdAndUpdate(req.session.user._id, {
        $addToSet: { posts: newPost._id },
      });

      // Find followers and create notifications
      const followers = await User.find({
        communityList: existingCommunity._id,
      });
      if (followers?.length > 0) {
        const notifications = followers.map((follower) => ({
          user: follower._id,
          content: `${postData.community}: ${postData.title}`,
          type: "New Post",
          postId: newPost._id,
          read: false,
          createdAt: new Date(),
        }));

        await Notification.insertMany(notifications);
        console.log(
          "Created notifications for:",
          followers.length,
          "followers"
        );
      }

      res.redirect("/home");
    } catch (error) {
      console.error("Error creating post:", error);
      console.error("Error details:", error.stack);
      res.status(500).send("Failed to create post");
    }
  }
);

app.get("/api/notifications", isAuthenticated, async (req, res) => {
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
app.post("/api/notifications", isAuthenticated, async (req, res) => {
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

app.put("/upvote/:id", isAuthenticated, async (req, res) => {
  const { action, oppaction, postId } = req.body;
  console.log("Action:", action);
  console.log("Opp Action:", oppaction);

  if (!req.session.user._id)
    return res.status(401).json({ error: "Not authenticated" });

  // console.log("Action:", action);
  // console.log("Opposite Action:", oppaction);

  let update = {}; // Track vote count changes

  // SAVE USER AND POST RELATED DATA
  const user = await User.findById(req.session.user._id);

  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.upvoteList.includes(postId)) {
    update.upvotes = action === "add" ? 1 : -1; // Upvote action

    await User.findByIdAndUpdate(req.session.user._id, {
      $addToSet: { upvoteList: postId },
    });

    await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );

    if (user.downvoteList.includes(postId)) {
      update.downvotes = -1; // Remove downvote if switching vote
      await User.findByIdAndUpdate(req.session.user._id, {
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
    await User.findByIdAndUpdate(req.session.user._id, {
      $pull: { upvoteList: postId },
    });
  }

  const post = await Post.findById(req.params.id).lean();

  console.log("Upvotes:", post.upvotes);
  console.log("Downvotes:", post.downvotes);

  res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
});

app.put("/downvote/:id", isAuthenticated, async (req, res) => {
  const { action, oppaction, postId } = req.body;
  console.log("Downvote Action:", action);
  console.log("Opposite Action:", oppaction);

  if (!req.session.user._id)
    return res.status(401).json({ error: "Not authenticated" });

  // console.log("Downvote Action:", action);
  // console.log("Opposite Action:", oppaction);

  let update = {}; // Track vote count changes

  // SAVE USER AND POST RELATED DATA

  const user = await User.findById(req.session.user._id);

  if (!user) return res.status(404).json({ error: "User not found" });

  if (!user.downvoteList.includes(postId)) {
    update.downvotes = action === "add" ? 1 : -1; // Downvote action

    await User.findByIdAndUpdate(req.session.user._id, {
      $addToSet: { downvoteList: postId },
    });

    await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { downvotes: 1 } },
      { new: true }
    );

    if (user.upvoteList.includes(postId)) {
      update.upvotes = -1; // Remove upvote if switching vote
      await User.findByIdAndUpdate(req.session.user._id, {
        $pull: { upvoteList: postId },
      });

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
    await User.findByIdAndUpdate(req.session.user._id, {
      $pull: { downvoteList: postId },
    });
  }

  const post = await Post.findById(req.params.id).lean();

  console.log("Upvotes:", post.upvotes);
  console.log("Downvotes:", post.downvotes);

  res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
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

      await User.findByIdAndUpdate(req.session.user._id, {
        $addToSet: { comments: newComment._id },
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

app.get("/community/:name", isAuthenticated, async (req, res) => {
  // Add isAuthenticated middleware
  const { name } = req.params;

  try {
    // Fetch the latest user data from the database
    const user = await User.findById(req.session.user._id).lean();
    const userData = {
      profilePicture: user.profilePicture || "/images/anonymous.png",
      username: user.username,
    };

    const community = await Community.findOne({ name }).lean();
    if (!community) return res.status(404).send("Community not found");

    const posts = await Post.find({ community: name }).lean();

    // Attach author and community profile pictures
    const usernames = [...new Set(posts.map((post) => post.author))];
    const users = await User.find(
      { username: { $in: usernames } },
      "username profilePicture"
    ).lean();

    const profilePictureMap = users.reduce((acc, user) => {
      acc[user.username] = user.profilePicture || "/images/anonymous.png";
      return acc;
    }, {});

    const postsWithPictures = posts.map((post) => ({
      ...post,
      authorProfilePicture: profilePictureMap[post.author],
      communityPfp: community.communityPfp,
    }));

    res.render("community", {
      userData, // Pass updated user data
      community,
      posts: postsWithPictures,
    });
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

    res.status(200).json({ message: "Community followed successfully" });
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

    res.status(200).json({ message: "Community unfollowed successfully" });
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

app.put("/share-post", isAuthenticated, async (req, res) => {
  const { postId } = req.body;

  try {
    // Find the post and include author information
    const postToShare = await Post.findById(postId).lean();
    if (!postToShare) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Find the original post author
    const postAuthor = await User.findOne({ username: postToShare.author });
    if (!postAuthor) {
      return res.status(404).json({ error: "Post author not found" });
    }

    // Update the user's shared posts list
    await User.findByIdAndUpdate(req.session.user._id, {
      $addToSet: { sharedPosts: postToShare._id },
    });

    // Create notification for original post author
    await Notification.create({
      user: postAuthor._id,
      content: `${req.session.user.username} shared your post.`,
      type: "Share",
      postId: postToShare._id,
      read: false,
      createdAt: new Date(),
    });

    console.log(`Created share notification for user: ${postAuthor.username}`);
    res.status(201).json({ message: "Post shared successfully!" });
  } catch (error) {
    console.error("Error sharing post:", error);
    res.status(500).json({ error: "Failed to share post" });
  }
});

app.get("/search", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const { query } = req.query;

    if (!query) {
      return res.redirect("/home"); // Redirect to home if no query is provided
    }

    // Fetch posts from the database
    const posts = await Post.find({
      $or: [
        { title: { $regex: query, $options: "i" } }, // Case-insensitive search in title
        { content: { $regex: query, $options: "i" } }, // Case-insensitive search in content
      ],
    }).lean();

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

    res.render("search", {
      userData: {
        profilePicture: user.profilePicture,
        username: user.username,
      },
      query,
      posts: postsWithProfilePictures,
    });
  } catch (error) {
    console.error("Error in /search route:", error);
    res.status(500).send("Internal Server Error");
  }
});