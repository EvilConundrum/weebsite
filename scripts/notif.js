async function loadNotification() {
  try {
    const response = await fetch("/api/notifications");
    if (!response.ok) throw new Error("Failed to fetch notifications");

    const notifications = await response.json();

    const notifContainer = document.querySelector(".notification-content");

    // Clear previous content
    notifContainer.innerHTML = `
      <div class="header">Notifications</div>
      <hr>
    `;

    if (notifications.length === 0) {
      notifContainer.innerHTML +=
        '<div class="header" style="font-size: var(--S);padding-top: 10px;margin: 0;">You are caught up 😊</div>';
      return;
    }

    notifications.forEach((notif) => {
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

async function sendNotification(userID, content, type, button) {
  try {
    const response = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userID, content, type }),
    });

    if (!response.ok) {
      console.error(
        `Failed to create ${type} notification:`,
        response.statusText
      );
    } else {
      console.log(`${type} notification created successfully!`);
      await loadNotification();

      // Mark the post as liked/disliked to prevent future POST requests
      button.setAttribute("data-liked", "true");
    }
  } catch (error) {
    console.error(`Error creating ${type} notification:`, error);
  }
}

// Auto-load notifications when the popup appears
window.addEventListener("load", loadNotification);

document.addEventListener("DOMContentLoaded", () => {
  const likeButtons = document.querySelectorAll(".like-button");
  const dislikeButtons = document.querySelectorAll(".dislike-button");

  likeButtons.forEach((button) => {
    if (!button.hasEventListener) {
      button.addEventListener("click", async () => {
        const isLiked = button.getAttribute("data-liked") === "true";
        if (isLiked) return; // 🚫 Prevent duplicate likes

        await sendNotification(69, "Your post has been liked!", "Like", button);
      });

      button.hasEventListener = true;
    }
  });

  dislikeButtons.forEach((button) => {
    if (!button.hasEventListener) {
      button.addEventListener("click", async () => {
        const isDisliked = button.getAttribute("data-liked") === "true";
        if (isDisliked) return; // 🚫 Prevent duplicate dislikes

        await sendNotification(
          69,
          "Your post has been disliked!",
          "Dislike",
          button
        );
      });

      button.hasEventListener = true;
    }
  });
});
