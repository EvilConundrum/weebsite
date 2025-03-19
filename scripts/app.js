const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const multer = require("multer");
const fs = require('fs');

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


const { User, Post, Notification } = require("./db.js");
const { createUser, createPost, createNotification } = require("./data.js");

// Middleware
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(express.urlencoded({ extended: true }));
// Add JSON parsing middleware
app.use(express.json());
const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files

app.use("/images/profile-pictures", express.static(
  path.join(__dirname, "../weebsite/images/profile-pictures")
));

const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../weebsite/images/profile-pictures')); // Updated path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Unique filename
  }
});

const profileUpload = multer({ 
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});



// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};
app.use("/styles", express.static(path.join(__dirname, "../styles")));
app.use("/images", express.static(path.join(__dirname, "../images")));
app.use("/scripts", express.static(path.join(__dirname, "../scripts")));

app.listen(9000, "localhost", () => {
  console.log("Server is listening on port 9000");
});

app.engine("hbs", hbs.engine({
  extname: "hbs",
  defaultLayout: false,
  partialsDir: path.join(__dirname, "../views/partials"),
  helpers: {
    timestamp: () => Date.now() // Cache busting
    json: (context) => JSON.stringify(context)
  }
}));

app.get("/home", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    res.render("index", {
      userData: {
        profilePicture: user.profilePicture,
        username: user.username
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});


app.get("/post/:id", (req, res) => {
  res.render(path.join(__dirname, "../views/postView.hbs"));
});

app.get("/home", async (req, res) => {
  try {
    const posts = await Post.find().lean();
    // console.log("Posts fetched successfully:", posts);
    res.render(path.join(__dirname, "../views/index.hbs"), { posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/post/:id", async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id).lean();
  const comments = await Comment.find({ postId: id }).lean();
  console.log("Posts:", post);
  console.log("Comments:", comments);
  res.render(path.join(__dirname, "../views/postView.hbs"), { post, comments });
});

app.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const userData = await User.findById(req.session.user._id)
      .populate('posts')
      .populate('comments')
      .lean();

    res.render('profile', { 
      userData: {
        ...userData,
        username: userData.username,
        profilePicture: userData.profilePicture,
        bio: userData.bio
      }
    });
  } catch (error) {
    console.error('Profile load error:', error);
    res.status(500).send('Error loading profile');
  }
});

app.get("/edit-profile", isAuthenticated, (req, res) => {
  const userData = req.session.user;
  res.render('edit-profile', { userData });
});

app.get("/create-post", (req, res) => {
  res.render(path.join(__dirname, "../views/createPost.hbs"));
});


app.post("/create-post", upload.array("images", 5), async (req, res) => {
  console.log("Received request body:", req.body); // Debugging
  console.log("Received file:", req.files); // Debugging
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

app.get('/', (req, res) => {
  res.render('index', {
    userData: req.session.user || null // Pass null if no user is logged in
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

    if (user && user.password === password) {
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
  const { username, password } = req.body; // Destructure from req.body

  try {
    const newUser = await createUser(username, password);
    req.session.user = newUser;
    
    // Send JSON response with username
    res.status(201).json({ 
      success: true,
      username: newUser.username 
    });
    
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ 
      success: false,
      error: "Error creating user: " + error.message 
    });
  }
});

const upload = multer({ dest: "uploads/" }); // Temporary storage for uploaded files

app.post("/create-post", upload.single("image"), async (req, res) => {
  const { title, description, tags, author } = req.body;
  const image = req.file;

  try {
    await createPost(title, description, tags, author, images);
    res.status(201).json({ message: "Post created successfully!" }); // Send success response
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

app.post("/api/notifications", async (req, res) => {
  const { userID, content, type } = req.body;

  // Validate data
  if (!userID || !content || !type) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const notification = await createNotification(userID, content, type);
    console.log("hello");
    res.status(201).json({ message: "Notification created successfully!", notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Failed to create notification." });
  }
});

app.get("/api/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find();
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to load notifications." });
  }});

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
  console.log("Action:", action);
  console.log("Opp Action:", oppaction);

  let update = {};

  if (action === "add") {
    update.downvotes = 1;
  } else if (action === "remove") {
    update.downvotes = -1;
  }

  if (oppaction === "remove") {
    update.upvotes = -1;
  }

  const post = await Post.findByIdAndUpdate(
    req.params.id,
    { $inc: update },
    { new: true }
  );

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
});

app.post("/create-comment", upload.none(), async (req, res) => {
  const { author, content, postId } = req.body;

  // if (!author) {
  //   return res.status(400).json({ error: "Missing author fields" });
  // }
  // if (!content) {
  //   return res.status(400).json({ error: "Missing content fields" });
  // }
  // if (!postId) {
  //   return res.status(400).json({ error: "Missing post id fields" });
  // }

  // console.log("Author: ", author);
  // console.log("Content: ", content);
  // console.log("Post ID: ", postId);
  const newComment = await Comment.create({
    author,
    content,
    postId,
  });
});

// Profile update route
app.post('/update-profile', 
  isAuthenticated,
  profileUpload.single('profilePicture'), // Use profile-specific upload config
  async (req, res) => {
    try {
      const updateData = {
        bio: req.body.bio
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
      
      res.redirect('/profile');
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).send('Error updating profile');
    }
  }
);

app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Logout error');
    }
    res.redirect('/'); // Redirect to root after logout
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
