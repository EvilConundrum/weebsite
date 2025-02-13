const currentPage = window.location.pathname.split("/").pop();

document.querySelectorAll(".sidebarButton").forEach((btn) => {
    if (btn.getAttribute("data-page") === currentPage) {
        btn.classList.add("active");
    }
});