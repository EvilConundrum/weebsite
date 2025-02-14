window.onload = function () {
  console.log("button.js loaded");
  console.log("Window loaded, searching for buttons...");

  const buttons = document.querySelectorAll(".sidebarButton");
  console.log("Buttons found:", buttons.length);

  function loadPage(page) {
    console.log("Loading page:", page);

    // Update the URL without refreshing
    history.pushState({ page }, "", page);

    // Fetch the new content and update only a specific section of the page
    fetch(page)
      .then((response) => response.text())
      .then((html) => {
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, "text/html");

        // Replace only the main content instead of the whole page
        let newContent = doc.querySelector("#mainContent");
        if (newContent) {
          document.querySelector("#mainContent").innerHTML =
            newContent.innerHTML;
        }

        // Update active button highlighting
        buttons.forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.page === page);
        });

        console.log("Page updated without refresh!");
      })
      .catch((error) => console.error("Error loading page:", error));
  }

  buttons.forEach((btn) => {
    const currentPage = window.location.pathname.split("/").pop();

    console.log("Found button with data-page:", btn.dataset.page);
    if (btn.getAttribute("data-page") === currentPage) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", function (event) {
      event.preventDefault(); // Prevent default refresh behavior
      console.log("Button clicked:", btn.dataset.page);

      if (btn.dataset.page) {
        loadPage(btn.dataset.page);
      } else {
        loadPage("phase1.html");
      }
    });
  });

  // Handle back/forward navigation without refresh
  window.onpopstate = function (event) {
    if (event.state && event.state.page) {
      loadPage(event.state.page);
    }
  };
};

function toggleCommentVisibility() {
  let div = document.getElementById("commentBox");
  if (div.style.display === "none" || div.style.display === "") {
    div.style.display = "block"; // Show div
  } else {
    div.style.display = "none"; // Hide div
  }
}

function toggleSidebarVisibility() {
  document.querySelectorAll(".dropdownSidebar").forEach((div) => {
    if (div.style.display === "none" || div.style.display === "") {
      div.style.display = "flex"; // Show div
    } else {
      div.style.display = "none"; // Hide div
    }
  });
}

function toggleDropdownVisibility() {
  document.querySelectorAll(".dropdown-content-post").forEach((div) => {
    if (div.style.display === "none" || div.style.display === "") {
      div.style.display = "flex"; // Show div
    } else {
      div.style.display = "none"; // Hide div
    }
  });

  document.querySelectorAll(".dropdown-line-post").forEach((div) => {
    if (div.style.display === "none" || div.style.display === "") {
      div.style.display = "flex"; // Show div
    } else {
      div.style.display = "none"; // Hide div
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  function updateUI(isLoggedIn) {
    let logoutBtn = document.getElementById("logoutToggle");
    let loginBtn = document.getElementById("loginToggle");
    let profileImage = document.querySelector(".pfp");

    if (logoutBtn && loginBtn) {
      if (isLoggedIn) {
        logoutBtn.style.display = "flex"; // Show Logout button
        loginBtn.style.display = "none"; // Hide Login button
        profileImage.src = "pics/pfp.png";
      } else {
        logoutBtn.style.display = "none"; // Hide Logout button
        loginBtn.style.display = "flex"; // Show Login button
        profileImage.src = "pics/question_mark.png";
      }
    }
  }

  function login(event) {
    if (event) event.preventDefault(); // Prevents default behavior
    console.log("Logging in...");
    localStorage.setItem("isLoggedIn", "true");
    updateUI(true);
  }

  function logout(event) {
    if (event) event.preventDefault(); // Prevents default behavior
    console.log("Logging out...");
    localStorage.setItem("isLoggedIn", "false");
    updateUI(false);
  }

  // Restore login state from localStorage
  let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  updateUI(isLoggedIn);

  // Event delegation to handle dynamic elements
  document.body.addEventListener("click", function (event) {
    if (event.target.closest("#logoutToggle")) {
      logout(event);
    } else if (event.target.closest("#loginToggle")) {
      login(event);
    }
  });

  // MutationObserver to detect dynamically added buttons
  const observer = new MutationObserver(() => {
    let logoutBtn = document.getElementById("logoutToggle");
    let loginBtn = document.getElementById("loginToggle");

    if (logoutBtn) logoutBtn.addEventListener("click", logout);
    if (loginBtn) loginBtn.addEventListener("click", login);
  });

  observer.observe(document.body, { childList: true, subtree: true });
});
