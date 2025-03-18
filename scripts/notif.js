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
      notifContainer.innerHTML += "<p>No notifications found.</p>";
      return;
    }

    notifications.forEach(notif => {
      const notifElement = document.createElement("div");
      notifElement.classList.add("notification-line");
      notifElement.innerHTML = `
        <div id="subject">${notif.type} |</div>
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
  const likeButtons = document.querySelectorAll(".like-button");

  likeButtons.forEach(button => {
    if (!button.hasEventListener) {
      button.addEventListener("click", async () => {
        const isLiked = button.getAttribute("data-liked") === "true"; // Check like state
        if (isLiked) return; // 🚫 Prevent sending duplicate 'Like' notifications

        const userID = 69;
        const content = "Your post has been liked!";
        const type = "Like";

        try {
          const response = await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userID, content, type }),
          });

          if (!response.ok) {
            console.error("Failed to create notification:", response.statusText);
          } else {
            console.log("Notification created successfully!");
            await loadNotification();

            // Mark the post as liked to prevent future POST requests
            button.setAttribute("data-liked", "true");
          }
        } catch (error) {
          console.error("Error creating notification:", error);
        }
      });

      button.hasEventListener = true;
    }
  });
});