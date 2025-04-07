function loadComponent(id, file) {
  console.log("include.js loaded");
  fetch(file)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
    })
    .catch((error) => console.error(`Error loading ${file}:`, error));
}

// Load components after the DOM is fully loaded

// document.addEventListener("DOMContentLoaded", function () {
//   loadComponent("notification-container", "notification-pop-up.hbs");
// });
