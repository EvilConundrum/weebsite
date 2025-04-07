function loadComponent(id, file) {
  console.log("include.js loaded");
  fetch(file)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
    })
    .catch((error) => console.error(`Error loading ${file}:`, error));
}
