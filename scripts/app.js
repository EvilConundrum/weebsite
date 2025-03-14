const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");
const mongoose = require("mongoose");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const session = require("express-session");

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

mongoose.connect("mongodb://127.0.0.1:27017/weebsiteDB")
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
const { User } = require("./db.js");
const { createUser } = require("./data.js");

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

app.get("/home", (req, res) => {
  res.render(path.join(__dirname, "../views/index.hbs"));
});

app.get("/post/:id", (req, res) => {
  res.render(path.join(__dirname, "../views/postView.hbs"));
});

app.get("/profile/:id", (req, res) => {
  res.render(path.join(__dirname, "../views/profile.hbs"));
});

app.get("/create-post", (req, res) => {
  res.render(path.join(__dirname, "../views/createPost.hbs"));
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
