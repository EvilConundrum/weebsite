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

  window.history.replaceState(null, "", window.location.origin);

  if (id) {
    window.location.href = `/${page}/${id}`;
  } else {
    window.location.href = `/${page}`;
  }
}

window.switchPage = switchPage;

async function getPostData() {
  const author = localStorage.getItem('username'); // Retrieve the logged-in user's name
  if (!author) {
    alert('You must be logged in to create a post.');
    return;
  }

  const formData = new FormData();
  formData.append("title", document.getElementById("title").value);
  formData.append("description", document.getElementById("description").value);
  formData.append("tags", document.getElementById("tags").value);
  formData.append("author", author); // Use dynamic author value

  const image = document.getElementById("image-upload").files[0];
  if (image) formData.append("image", image);

  try {
    const response = await fetch("/create-post", {
      method: "POST",
      body: formData,
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
    alert("Error connecting to the server: " + error.message);
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
      const result = await response.json();
      
      // Store username in localStorage
      localStorage.setItem('username', result.username);
      
      alert("User signed up successfully!");
      switchPage('home'); // Redirect to home after signup
    } else {
      const errorData = await response.json();
      alert("Failed to sign up: " + errorData.error);
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
