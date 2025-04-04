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

  location.reload();
}

window.switchPage = switchPage;

async function getPostData(event) {
  // Prevent default form submission
  event.preventDefault();

  // Get form data
  const formData = new FormData(event.target);

  try {
    // Add debug log for FormData
    console.log("Sending form data:", {
      title: formData.get("title"),
      content: formData.get("content"),
      community: formData.get("community"),
    });

    const response = await fetch("/create-post", {
      method: "POST",
      body: formData,
    });

    // Debug log raw response
    console.log("Raw response status:", response.status);

    // Try to parse response
    const responseText = await response.text();
    console.log("Response text:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log("Parsed response data:", data);
    } catch (e) {
      console.log("Response is not JSON:", responseText);
      data = { message: responseText };
    }

    // Handle response based on status
    if (response.status === 201 || response.status === 200) {
      alert("Post created successfully!");
      window.location.href = "/home";
    } else if (response.status === 404) {
      alert(
        data.message || "Community not found. Please select a valid community."
      );
    } else if (response.status === 400) {
      alert(data.message || "Please fill in all required fields.");
    } else {
      throw new Error(data.message || "Server error");
    }
  } catch (error) {
    console.error("Error details:", error);
    alert(error.message || "Error creating post. Please try again.");
  }
}

// Make function globally available
window.getPostData = getPostData;

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
  const isActive = button.classList.contains("activeLike");
  const isOppActive = oppBtn.classList.contains("activeDislike");

  const body = {
    postId,
  };

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
    // console.log(data);
    setTimeout(() => {
      button.textContent = data.upvotes;
      oppBtn.textContent = data.downvotes;
    }, 10);
    // console.log(button.textContent);
    // console.log(oppBtn.textContent);

    button.classList.toggle("active");
    oppBtn.classList.remove("active");
  }
}

async function downvotePost(postId) {
  const button = document.getElementById(`downvotes-${postId}`);
  const oppBtn = document.getElementById(`upvotes-${postId}`);
  const isActive = button.classList.contains("activeDislike");
  const isOppActive = oppBtn.classList.contains("activeLike");

  const body = {
    postId,
  };

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
    // console.log(data);
    setTimeout(() => {
      button.textContent = data.downvotes;
      oppBtn.textContent = data.upvotes;
    }, 10);

    button.classList.toggle("active");
    oppBtn.classList.remove("active");
  }
}

async function switchProfileTab(tabName) {
  try {
    const response = await fetch(`/profile?tabName=${tabName}`);
    if (!response.ok) throw new Error("Failed to load data");
    window.location.href = "profile?tabName=" + tabName;

    await response.json();
  } catch (error) {
    console.error("Error loading tab:", error);
  }
}

async function upvoteComment(commentId) {
  const button = document.getElementById(`upvotes-${commentId}`);
  const oppBtn = document.getElementById(`downvotes-${commentId}`);
  const isActive = button.classList.contains("activeLike");
  const isOppActive = oppBtn.classList.contains("activeDislike");

  const body = {
    commentId,
  };

  if (!isActive) {
    body.action = "add";
    if (isOppActive) {
      body.oppaction = "remove";
    }
  } else {
    body.action = "remove";
  }

  const res = await fetch(`/upvote-comment/${commentId}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  if (res.ok) {
    const data = await res.json();
    // console.log(data);
    setTimeout(() => {
      button.textContent = data.upvotes;
      oppBtn.textContent = data.downvotes;
    }, 10);
    // console.log(button.textContent);
    // console.log(oppBtn.textContent);
  }

  button.classList.toggle("activeLike");
  oppBtn.classList.remove("activeDislike");
}

async function downvoteComment(commentId) {
  const button = document.getElementById(`downvotes-${commentId}`);
  const oppBtn = document.getElementById(`upvotes-${commentId}`);
  const isActive = button.classList.contains("activeDislike");
  const isOppActive = oppBtn.classList.contains("activeLike");

  const body = {
    commentId,
  };

  if (!isActive) {
    body.action = "add";
    if (isOppActive) {
      body.oppaction = "remove";
    }
  } else {
    body.action = "remove";
  }

  const res = await fetch(`/downvote-comment/${commentId}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  if (res.ok) {
    const data = await res.json();
    // console.log(data);
    setTimeout(() => {
      button.textContent = data.downvotes;
      oppBtn.textContent = data.upvotes;
    }, 10);
    // console.log(button.textContent);
    // console.log(oppBtn.textContent);
  }

  button.classList.toggle("activeDisLike");
  oppBtn.classList.remove("activeLike");
}
