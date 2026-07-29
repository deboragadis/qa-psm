// =========================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) SECURITY GUARD (LOCAL)
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("active_user_role") || "guest";
  const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";

  // Definisi hak akses halaman berdasarkan role
  const permissions = {
    superadmin: [
      "dashboard.html",
      "monitoring.html",
      "input_sistem.html",
      "update.html",
      "packing.html",
      "email.html",
      "audit.html"
    ],
    manager: [
      "dashboard.html",
      "monitoring.html",
      "packing.html",
      "email.html"
    ],
    staff: [
      "dashboard.html",
      "input_sistem.html",
      "update.html",
      "packing.html"
    ]
  };

  const allowedPages = permissions[role] || [];

  // 1. Validasi Akses Halaman (URL Guard)
  if (currentPage !== "index.html" && !allowedPages.includes(currentPage)) {
    alert("Akses ditolak! Anda tidak memiliki izin untuk mengakses halaman ini.");
    window.location.href = "dashboard.html";
    return;
  }

  // 2. Filter Menu Sidebar secara Otomatis
  const menuItems = document.querySelectorAll(".sidebar-menu li");
  menuItems.forEach(item => {
    const onclickAttr = item.getAttribute("onclick");
    if (onclickAttr) {
      const match = onclickAttr.match(/['"]([^'"]+)['"]/);
      if (match && match[1]) {
        const targetPage = match[1];
        if (!allowedPages.includes(targetPage)) {
          item.style.display = "none";
        }
      }
    }
  });

  // 3. Munculkan kembali halaman setelah filter selesai
  document.documentElement.style.visibility = "visible";
});

window.logoutUser = function() {
  const konfirmasi = confirm("Apakah Anda yakin ingin keluar?");
  if (konfirmasi) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("active_user_role");
    window.location.href = "index.html";
  }
};
