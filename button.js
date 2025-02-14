window.onload = function () {
    console.log("button.js loaded")
    console.log("Window loaded, searching for buttons...");
    const buttons = document.querySelectorAll(".sidebarButton");
    console.log("Buttons found:", buttons.length);

    buttons.forEach((btn) => {
        const currentPage = window.location.pathname.split("/").pop();

        console.log("Found button with data-page:", btn.dataset.page);
        if (btn.getAttribute("data-page") === currentPage) {
            btn.classList.add("active");
        }

        btn.addEventListener("click", function () {
            console.log("Button clicked:", btn.dataset.page);
            window.location.href = btn.dataset.page || "phase1.html";
        });
    });
};



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