const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const multer = require("multer");

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

mongoose
  .connect("mongodb://127.0.0.1:27017/weebsiteDB")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

const { User, Post } = require("./db.js");
const { createUser, createPost } = require("./data.js");

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
  const post = await Post.findById(req.params.id);
  res.render(path.join(__dirname, "../views/postView.hbs"), { post });
});

app.get("/profile/:id", (req, res) => {
  res.render(path.join(__dirname, "../views/profile.hbs"));
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

// TODO: Add post for creating posts

app.get("/", (req, res) => {
  res.render(path.join(__dirname, "../views/logout.hbs"));
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
