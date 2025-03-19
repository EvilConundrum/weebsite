console.log("views.js successfully loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "DOM is fully loaded and parsed, but not all resources are loaded."
  );
});

function viewPost(id) {
  window.location.href = `/post/${id}`;
}


function switchPage(page, id = null) {
  console.log(`Switching page to ${page}`);

  // Ensure absolute path by including the leading '/'
  const newPath = id ? `/${page}/${id}` : `/${page}`;

  // Replace the full URL with absolute path
  window.history.replaceState(null, "", newPath);
  window.location.href = newPath;
}

function goHome(){
  window.location.href = "/home"
}


window.switchPage = switchPage;

async function getPostData() {
  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("content", document.getElementById("description").value);
  formData.append("author", "cleevayang");
  formData.append("community", document.getElementById("tags").value);
  const image = document.getElementById("image-upload").files[0];
  if (image) {
    formData.append("images", image);
  }

  if (image) formData.append("image", image);

  try {
    const response = await fetch("/create-post", {
      method: "POST",
      body: formData, // No need for `Content-Type`, FormData sets it automatically
    });

    if (response.ok) {
      const result = await response.json();
      // console.log("Post created successfully:", result);
      alert("Post created successfully!");
      switchPage("home");
    } else {
      const errorText = await response.text();
      console.error("Failed to create post:", errorText);
      alert("Failed to create post: " + errorText);
    }
  } catch (error) {
    console.error("Error connecting to the server:", error.message);
  }
}

async function getUserData() {
  // Get form values directly from input elements
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  // Basic validation
  if (!username || !password) {
    alert("Username and password are required");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return;
  }

  console.log("Submitting user data:", username, password);

  try {
    const response = await fetch("/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username, password: password }),
    });

    if (response.ok) {
      const result = await response.text();
      console.log("User signed up successfully:", result);
      alert("User signed up successfully!");
      // Redirect to login page after successful signup
      switchPage("login");
    } else {
      const errorText = await response.text();
      console.error("Failed to sign up:", response.statusText, errorText);
      alert("Failed to sign up: " + response.statusText);
    }
  } catch (error) {
    console.error("Error connecting to the server:", error.message);
    alert("Error connecting to the server: " + error.message);
  }
}

async function upvotePost(postId) {
  const button = document.getElementById(`upvotes-${postId}`);
  const oppBtn = document.getElementById(`downvotes-${postId}`);
  const isActive = button.classList.contains("active");
  const isOppActive = oppBtn.classList.contains("active");

  const body = {};

  if (!isActive) {
    body.action = "add";
    if (isOppActive) {
      body.oppaction = "remove";
    }
  } else {
    body.action = "remove";
  }

  const res = await fetch(`/upvote/${postId}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  if (res.ok) {
    const data = await res.json();
    button.textContent = data.upvotes;
    oppBtn.textContent = data.downvotes;

    button.classList.toggle("active");
    oppBtn.classList.remove("active");
  }
}

async function downvotePost(postId) {
  const button = document.getElementById(`downvotes-${postId}`);
  const oppBtn = document.getElementById(`upvotes-${postId}`);
  const isActive = button.classList.contains("active");
  const isOppActive = oppBtn.classList.contains("active");

  const body = {};

  if (!isActive) {
    body.action = "add";
    if (isOppActive) {
      body.oppaction = "remove";
    }
  } else {
    body.action = "remove";
  }

  const res = await fetch(`/downvote/${postId}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  if (res.ok) {
    const data = await res.json();
    button.textContent = data.downvotes;
    oppBtn.textContent = data.upvotes;

    button.classList.toggle("active");
    oppBtn.classList.remove("active");
  }
}

