const currentPage = window.location.pathname.split("/").pop();

document.querySelectorAll(".sidebarButton").forEach((btn) => {
    if (btn.getAttribute("data-page") === currentPage) {
        btn.classList.add("active");
    }
});

function toggleCommentVisibility() {
    let div = document.getElementById("commentBox");
    if (div.style.display === "none" || div.style.display === "") {
        div.style.display = "block"; // Show div
    } else {
        div.style.display = "none"; // Hide div
    }
}

function toggleSidebarVisibility(){
    document.querySelectorAll(".dropdownSidebar").forEach((div) => {
        if (div.style.display === "none" || div.style.display === "") {
            div.style.display = "flex"; // Show div
        } else {
            div.style.display = "none"; // Hide div
        }
    });
}