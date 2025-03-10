console.log("views.js successfully loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "DOM is fully loaded and parsed, but not all resources are loaded."
  );
});

function viewPost(id) {
  window.location.href = `/post/${id}`;
}

function switchPage(page, id = null) {
  console.log(`Switching page to ${page}`);

  if (id) {
    window.location.href = `/${page}/${id}`;
  } else {
    window.location.href = `/${page}`;
  }
}

window.switchPage = switchPage;
