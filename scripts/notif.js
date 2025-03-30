async function loadNotification() {
  try {
    const response = await fetch("/api/notifications", {
      credentials: "include" // Include session cookies
    });  
    if (!response.ok) throw new Error("Failed to fetch notifications");

    const notifications = await response.json();

    const notifContainer = document.querySelector(".notification-content");

    // Clear previous content
    notifContainer.innerHTML = `
      <div class="header">Notifications</div>
      <hr>
    `;

    if (notifications.length === 0) {
      notifContainer.innerHTML += "<p>No notifications found.</p>";
      return;
    }

    notifications.forEach(notif => {
      const notifElement = document.createElement("div");
      notifElement.classList.add("notification-line");
      notifElement.innerHTML = `
        <div id="subject">${notif.type}</div>
        <div id="topic">${notif.content}</div>
      `;
      notifContainer.appendChild(notifElement);
    });

  } catch (error) {
    console.error("Error loading notifications:", error);
  }
}

// Auto-load notifications when the popup appears
window.addEventListener("load", loadNotification);

document.addEventListener("DOMContentLoaded", () => {
  const handleLike = async (button) => {
    const postId = button.dataset.postId;
    const postAuthor = button.dataset.author;
    const isLiked = button.getAttribute("data-liked") === "true";
    const voteCountElement = document.getElementById(`upvotes-${postId}`);
    if (button.disabled) return; // Prevent double clicks
  button.disabled = true;

    try {
      // Toggle like state immediately
      button.setAttribute("data-liked", (!isLiked).toString());

      // Update vote count optimistically
      const currentCount = parseInt(voteCountElement.textContent);
      voteCountElement.textContent = isLiked ? currentCount - 1 : currentCount + 1;

      // Send notification only for new likes
      if (!isLiked) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "Like",
            content: "Your post has been liked!",
            postId,
            postAuthor
          }),
          credentials: "include"
        });
      }

      // Update server state
      const response = await fetch(`/api/posts/${postId}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isLiked ? "unlike" : "like" }),
        credentials: "include"
      });

      if (!response.ok) throw new Error("Update failed");

      // Sync with actual server count
      const data = await response.json();
      voteCountElement.textContent = data.upvotes;

    } catch (error) {
      console.error("Error:", error);
      // Revert on error
      button.setAttribute("data-liked", isLiked.toString());
      voteCountElement.textContent = parseInt(voteCountElement.textContent) + (isLiked ? 1 : -1);
    }
    finally {
      button.disabled = false; // Re-enable after processing
    }
  };

  // Event delegation for like buttons
  document.body.addEventListener("click", (e) => {
    const button = e.target.closest(".like-button");
    if (button) handleLike(button);
  });


  const handleDislike = async (button) => {
    const postId = button.dataset.postId;
    const postAuthor = button.dataset.author;
    const isDisliked = button.getAttribute("data-disliked") === "true";
    const voteCountElement = document.getElementById(`downvotes-${postId}`);

    try {
      // Toggle dislike state immediately
      button.setAttribute("data-disliked", (!isDisliked).toString());

      // Update vote count optimistically
      const currentCount = parseInt(voteCountElement.textContent);
      voteCountElement.textContent = isDisliked ? currentCount - 1 : currentCount + 1;

      // Send notification only for new dislikes
      if (!isDisliked) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "Dislike",
            content: "Your post has been disliked.",
            postId,
            postAuthor
          }),
          credentials: "include"
        });
      }

      // Update server state
      const response = await fetch(`/api/posts/${postId}/downvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isDisliked ? "undislike" : "dislike" }),
        credentials: "include"
      });

      if (!response.ok) throw new Error("Update failed");

      // Sync with actual server count
      const data = await response.json();
      voteCountElement.textContent = data.downvotes;

    } catch (error) {
      console.error("Error:", error);
      // Revert on error
      button.setAttribute("data-disliked", isDisliked.toString());
      voteCountElement.textContent = parseInt(voteCountElement.textContent) + (isDisliked ? 1 : -1);
    }
  };

  // Event delegation for like and dislike buttons
  document.body.addEventListener("click", (e) => {
    const likeButton = e.target.closest(".like-button");
    if (likeButton) handleLike(likeButton);
    
    const dislikeButton = e.target.closest(".dislike-button");
    if (dislikeButton) handleDislike(dislikeButton);
  });






  
});