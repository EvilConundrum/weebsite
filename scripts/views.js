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

  if (id) {
    window.location.href = `/${page}/${id}`;
  } else {
    window.location.href = `/${page}`;
  }
}

window.switchPage = switchPage;

async function getPostData() {

  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("tags", document.getElementById("tags").value);
  formData.append("author", "cleevayang");

  const image = document.getElementById("image-upload").files[0];
  if (image) formData.append("image", image);

  try {
    const response = await fetch("/create-post", {
      method: "POST",
      body: formData, // No need for `Content-Type`, FormData sets it automatically
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Post created successfully:", result);
      alert("Post created successfully!");
      switchPage('home');
    } else {
      const errorText = await response.text();
      console.error("Failed to create post:", errorText);
      alert("Failed to create post: " + errorText);
    }
  } catch (error) {
    console.error("Error connecting to the server:", error.message);
    res.status(500).json({ error: "Error connecting to the server: " + error.message });
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
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const result = await response.text();
      console.log("User signed up successfully:", result);
      alert("User signed up successfully!");
      // Redirect to login page after successful signup
      switchPage('login');
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