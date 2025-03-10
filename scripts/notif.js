
//Change how the function is activated
document.getElementById("addPostBtn").addEventListener("click", function () {
    let newPost = document.createElement("div");
    newPost.innerHTML = `
        <div class="notification-line">
          <div id="subject">subject |</div>
          <div id="topic">topic</div>
        </div>
        <hr />
    `;
    
    // Clear existing notifications
    document.querySelector(".notification-content").appendChild(newPost);
  });

