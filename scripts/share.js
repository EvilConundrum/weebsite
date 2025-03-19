console.log("share.js loaded!");

const dropArea = document.getElementById("drop-area");
const imageInput = document.getElementById("image-upload");
const preview = document.getElementById("preview");
const label = dropArea.querySelector("p"); // Target the label text

document.getElementById("post-form").addEventListener("submit", async (e) => {
  e.preventDefault(); // Prevents page reload on form submission
  getPostData();
});

dropArea.addEventListener("click", () => imageInput.click());

imageInput.addEventListener("change", handleFile);

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropArea.classList.add("highlight");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    dropArea.classList.remove("highlight");
  });
});

dropArea.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) handleFile({ target: { files: [file] } });
});

function handleFile(event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = "block";
      label.style.display = "none";
    };

    reader.readAsDataURL(file);
  }
}

async function getComment(postId) {
  window.location.reload();
  const comment = document.querySelector(".commentBar").value;
  const formData = new FormData();

  console.log(postId);

  formData.append("author", "cleevayang");
  formData.append("content", comment);
  formData.append("postId", postId);

  const res = await fetch("/create-comment", {
    method: "POST",
    body: formData,
  });

  if (res.ok) {
    const result = await res.json();
    alert("Comment created successfully!");
  } else {
    const errorText = await res.text();
    console.error("Failed to create comment:", errorText);
    alert("Failed to create comment: " + errorText);
  }
}

async function editComment(commentId) {
  const editField = document.querySelector(
    `#editComment-${commentId} .commentBar`
  );
  const displayComment = document.getElementById(
    `commentSectionText-${commentId}`
  );

  if (!editField) {
    console.error(`Edit field not found for comment ${commentId}`);
    return;
  }

  const updatedContent = editField.value.trim();

  if (!updatedContent) {
    alert("Edited comment cannot be empty!");
    return;
  }

  const body = {
    id: commentId,
    content: updatedContent,
  };

  const res = await fetch("/edit-comment", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  displayComment.innerHTML = `<p>${updatedContent}</p>`;

  document.getElementById(`editComment-${commentId}`).style.display = "none";
  displayComment.style.display = "block";
}

async function deleteComment(commentId) {
  if (!confirm("Are you sure you want to delete this comment?")) return;

  const res = await fetch(`/delete-comment/${commentId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  window.location.reload();

  document.getElementById(`comment-${commentId}`).remove();
}

async function editPost(postId) {
  const dropdown = document.querySelector(".dropdown-post-content-post");
  const postContent = document.querySelector(".innerContent");
  const displayContent = document.querySelector(".hideBody");
  const editButton = document.querySelector(".hiddenEdit");

  const isEditing = postContent.classList.toggle("editing");
  editButton.style.display = isEditing ? "block" : "none";
  dropdown.style.display = "none";
  displayContent.style.display = isEditing ? "none" : "block";

  if (isEditing) {
    postContent.value = displayContent.textContent.trim();
  }
}

async function confirmEditPost(postId) {
  const displayContent = document.querySelector(".hideBody");
  const editContent = document.querySelector(".hiddenEdit");
  const postContent = document.querySelector(".innerContent").value;

  const body = {
    id: postId,
    content: postContent,
  };

  const res = await fetch("/edit-post", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  displayContent.innerHTML = `<p class="hideBody">${postContent}</p>`;
  displayContent.style.display = "block";
  editContent.style.display = "none";
}

async function deletePost(postId) {
  if (!confirm("Are you sure you want to delete this comment?")) return;

  const res = await fetch(`/delete-post/${postId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText);
  }

  switchPage("home");
}
