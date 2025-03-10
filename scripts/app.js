const express = require("express");
const path = require("path");
const hbs = require("express-handlebars");

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

app.use("/styles", express.static(path.join(__dirname, "../styles")));
app.use("/images", express.static(path.join(__dirname, "../images")));
app.use("/scripts", express.static(path.join(__dirname, "../scripts")));

app.listen(9000, "localhost", () => {
  console.log("Server is listening on port 9000");
});

app.get("/home", (req, res) => {
  res.render(path.join(__dirname, "../views/index.hbs"));
});

app.get("/post", (req, res) => {
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

app.get("/signup", (req, res) => {
  res.render(path.join(__dirname, "../views/signup-pop-up.hbs"));
});
