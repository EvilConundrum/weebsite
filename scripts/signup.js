document.querySelector('.login-button').addEventListener('click', function(event) {
    event.preventDefault();  // Prevents page refresh

    const username = document.querySelector('.textField.username').value;
    const password = document.querySelector('.textField.password').value;
    const confirmPassword = document.querySelector('.confirm-password').value;

    if (username === "" || password === "" || confirmPassword === "") {
        alert("Please fill out all fields!");
        return;

    } 
    else if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }
    window.location.href = '/login';
});