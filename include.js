function loadComponent(id, file) {
    fetch(file)
        .then(response => response.text())
        .then(data => {
            document.getElementById(id).innerHTML = data;
        })
        .catch(error => console.error(`Error loading ${file}:`, error));
}

// Load components after the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
    loadComponent("layout-container", "layout.html");
});
