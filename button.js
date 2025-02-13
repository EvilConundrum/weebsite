const currentPage = window.location.pathname.split("/").pop();

document.querySelectorAll(".sidebarButton").forEach((btn) => {
    if (btn.getAttribute("data-page") === currentPage) {
        btn.classList.add("active");
    }
});
function toggleVisibility() {
    let div = document.getElementById("commentBox");
    if (div.style.display === "none") {
        div.style.display = "block"; // Show div
    } else {
        div.style.display = "none"; // Hide div
    }
}