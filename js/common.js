const currentUser = localStorage.getItem("loggedInUser") || "Guest";

export function tampilkanNamaUser() {
  const elemenNama = document.getElementById("nama-user");
  if (elemenNama) {
    const namaFormat = currentUser.charAt(0).toUpperCase() + currentUser.slice(1);
    elemenNama.innerText = namaFormat;
  }
}

// Fungsi Toggle Sidebar untuk Desktop & HP
window.toggleSidebar = function() {
  const sidebar = document.querySelector(".sidebar");
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("mobile-show");
  } else {
    sidebar.classList.toggle("sembunyi");
  }
};

// Fungsi Logout
window.logoutUser = function() {
  const konfirmasi = confirm("Apakah Anda yakin ingin keluar?");
  if (konfirmasi) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("active_user_role");
    window.location.href = "index.html";
  }
};