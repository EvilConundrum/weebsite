const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongoose = require('mongoose');
const fileUpload = require('express-fileupload');
const path = require('path');
const hbs = require('hbs');

const app = express();

// Set up Handlebars as the view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost/weebsiteDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const Post = require('./models/Post');
const User = require('./models/User');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('weebsite')); // Serve static files from the 'weebsite' folder
app.use(fileUpload());
app.use(cookieParser());
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
  })
);

// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};

// Create test users if they don't exist
const createTestUsers = async () => {
  const testUsers = [
    { username: "admin", password: "admin", name: "Art", quote: "Hello! I'm Art!", userID: 1 },
    { username: "charlie", password: "charlie", name: "Charlie", quote: "Arf! Arf! Woof! Woof!", userID: 2 },
    { username: "test", password: "test", name: "Test User", quote: "This is a test account!", userID: 3 },
  ];

  for (const userData of testUsers) {
    let user = await User.findOne({ username: userData.username });
    if (!user) {
      user = new User(userData);
      await user.save();
      console.log(`Created test user: ${userData.username}`);
    }
  }
};

// Call the function to create test users when the server starts
createTestUsers();

// Root route - Show home page with guest or authenticated user context
app.get("/", (req, res) => {
  const userData = req.session.user ? req.session.user : null;
  res.render('index', {
    user: userData,
    isGuest: !req.session.user // Pass a flag to indicate guest status
  });
});

// Login route (GET)
app.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/profile");
  } else {
    res.render("login-pop-up");
  }
});

// Login route (POST)
app.post("/login", express.urlencoded({ extended: true }), async (req, res) => {
  const { username, password } = req.body;

  // Check if username or password is empty
  if (!username || !password) {
    return res.send("Username and password are required. <a href='/login'>Try again.</a>");
  }

  try {
    // Find the user in the database
    const user = await User.findOne({ username });

    // Check if the user exists and the password matches
    if (user && user.password === password) {
      req.session.user = user; // Store user in session
      res.redirect("/profile"); // Redirect to profile after login
    } else {
      res.send("Invalid credentials. <a href='/login'>Please try again.</a>");
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("An error occurred. Please try again.");
  }
});

// Profile route (protected by isAuthenticated)
app.get("/profile", isAuthenticated, (req, res) => {
  const userData = req.session.user;
  res.render('profile', { user: userData });
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect("/profile");
    }
    res.clearCookie("connect.sid"); // Clear the session cookie
    res.redirect("/");
  });
});

// Share route (GET)
app.get("/share", isAuthenticated, (req, res) => {
  const userData = req.session.user;
  res.render('share', { user: userData });
});

// Submit post route (POST)
app.post("/submit-post", isAuthenticated, (req, res) => {
  const userData = req.session.user;
  const { image } = req.files;
  image.mv(path.resolve(__dirname, 'weebsite/images', image.name), (error) => {
    if (error) {
      console.log("Error!");
    } else {
      Post.create({
        ...req.body,
        image: '/images/' + image.name,
        userID: userData.userID
      });
      res.redirect('/view-post');
    }
  });
});

// View posts route
app.get('/view-post', isAuthenticated, async (req, res) => {
  const userData = req.session.user;
  const posts = await Post.find({ userID: userData.userID });
  res.render('content', { posts, user: userData });
});

// Edit profile route (GET)
app.get("/edit-profile", isAuthenticated, (req, res) => {
  const userData = req.session.user;
  res.render('edit-profile', { user: userData });
});

// Update profile route (POST)
app.post("/update-profile", isAuthenticated, async (req, res) => {
  const userData = req.session.user;
  const { bio } = req.body;

  if (req.files?.profileImage) {
    const image = req.files.profileImage;
    const imagePath = '/images/' + image.name;
    await image.mv(path.resolve(__dirname, 'weebsite', imagePath));
    userData.profileImage = imagePath;
  }

  await User.updateOne({ userID: userData.userID }, {
    $set: {
      bio,
      profileImage: userData.profileImage,
    }
  });

  // Update session data
  req.session.user = userData;

  res.redirect("/profile");
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});