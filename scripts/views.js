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
  const title = document.getElementById("title").value;
  const content = document.getElementById("description").value;
  const community = document.getElementById("tags").value;
  const author = "cleevayang";

  const response = await fetch("/create-post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, content, author, community }),
  });
  if (response.ok) {
    const result = await response.json();
    console.log("Post created successfully:", result);
    alert("Post created successfully!");
  } else {
    console.error("Failed to create post:", response.statusText);
  }
}

async function getUserData() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

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
      console.log("User signed up successfully:", result);
      alert("User signed up successfully!");
    } else {
      console.error("Failed to sign up:", response.statusText);
    }
  } catch (error) {
    console.error("Error connecting to the server:", error.message);
  }
}
