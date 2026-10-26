// document.getElementById('registerForm').addEventListener('submit', function(event) {
//     event.preventDefault(); // Prevents the form from submitting normally

//     const username = document.getElementById('username').value;
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;
//     const confirmPassword = document.getElementById('confirmPassword').value;
//     const messageElement = document.getElementById('message');

//     // 1. Check if passwords match
//     if (password !== confirmPassword) {
//         messageElement.textContent = "Passwords do not match.";
//         messageElement.className = "message error";
//         return;
//     }

//     // 2. Simple password length validation
//     if (password.length < 6) {
//         messageElement.textContent = "Password must be at least 6 characters long.";
//         messageElement.className = "message error";
//         return;
//     }

//     // If validations pass, show success
//     messageElement.textContent = "Registration successful! Redirecting to login...";
//     messageElement.className = "message success";

//         this.submit();

//     // // Simulate database saving delay before redirecting to login page
//     // setTimeout(() => {
//     //     window.location.href = "index.html"; 
//     // }, 2000);
// });
