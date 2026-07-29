// =========================================================================
// DATABASE AKUN LOKAL
// =========================================================================
const registeredAccounts = [
  { username: "admin", password: "0000", role: "superadmin" },
  { username: "gadis", password: "adminkeren123", role: "superadmin" },
  { username: "insanu", password: "adminkeren123", role: "superadmin" },
  { username: "andi", password: "0000", role: "manager" },
  { username: "ari", password: "0000", role: "manager" },
  { username: "taufan", password: "0000", role: "manager" },
  { username: "yanuar", password: "12345", role: "staff" },
  { username: "febbry", password: "12345", role: "staff" },
  { username: "debora", password: "12345", role: "staff" },
  { username: "bima", password: "12345", role: "staff" }
];

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const inputUsername = document.getElementById("username").value.trim();
    const inputPassword = document.getElementById("password").value.trim();
    const alertBox = document.getElementById("alertBox");

    if (alertBox) alertBox.style.display = "none";

    const akunDitemukan = registeredAccounts.find(
      acc => acc.username === inputUsername && acc.password === inputPassword
    );

    if (akunDitemukan) {
      localStorage.setItem("loggedInUser", akunDitemukan.username);
      localStorage.setItem("active_user_role", akunDitemukan.role);

      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.textContent = "Login berhasil! Mengalihkan...";
        alertBox.className = "alert-box alert-success";
      }

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
    } else {
      if (alertBox) {
        alertBox.style.display = "block";
        alertBox.textContent = "Username atau Password salah!";
        alertBox.className = "alert-box alert-error";
      } else {
        alert("Username atau Password salah!");
      }
      
      document.getElementById("password").value = "";
      document.getElementById("password").focus();
    }
  });
});
