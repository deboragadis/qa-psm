import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

// =========================================================================
// FIREBASE AUTH + ROLE-BASED ACCESS CONTROL (RBAC) SECURITY GUARD
// =========================================================================

let currentUserRole = "guest";
let currentUserUid = null;

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

// ✅ 1. LISTEN TO FIREBASE AUTH STATE
onAuthStateChanged(auth, async (user) => {
  const currentPage = window.location.pathname.split("/").pop() || "dashboard.html";

  if (!user) {
    // ❌ User tidak login
    console.log("User tidak login, redirect ke login...");
    
    // Hanya redirect jika bukan login page
    if (currentPage !== "index.html" && currentPage !== "login.html") {
      window.location.href = "index.html";
    }
    return;
  }

  // ✅ User sudah login
  console.log("User logged in:", user.email);
  currentUserUid = user.uid;

  try {
    // ✅ 2. AMBIL ROLE DARI FIRESTORE
    const userDoc = await getDoc(doc(db, "users", user.uid));
    
    if (!userDoc.exists()) {
      console.error("User data tidak ditemukan di Firestore!");
      alert("Data user tidak valid. Silakan login ulang.");
      await signOut(auth);
      window.location.href = "index.html";
      return;
    }

    const userData = userDoc.data();
    currentUserRole = userData.role || "guest";

    // Simpan di localStorage (untuk quick access)
    localStorage.setItem("active_user_role", currentUserRole);
    localStorage.setItem("loggedInUser", userData.username || user.email);
    localStorage.setItem("user_uid", user.uid);

    console.log("User role:", currentUserRole);

    // ✅ 3. VALIDASI AKSES HALAMAN (URL GUARD)
    const allowedPages = permissions[currentUserRole] || [];

    if (currentPage !== "index.html" && !allowedPages.includes(currentPage)) {
      console.warn(`Access denied for ${currentUserRole} to ${currentPage}`);
      alert("Akses ditolak! Anda tidak memiliki izin untuk mengakses halaman ini.");
      window.location.href = "dashboard.html";
      return;
    }

    // ✅ 4. FILTER MENU SIDEBAR BERDASARKAN ROLE
    filterMenuByRole(currentUserRole, allowedPages);

    // ✅ 5. TAMPILKAN HALAMAN DENGAN MULUS
    document.documentElement.style.visibility = "visible";
    document.body.style.opacity = "1";

  } catch (error) {
    console.error("Error checking user role:", error);
    alert("Terjadi kesalahan. Silakan login ulang.");
    await signOut(auth);
    window.location.href = "index.html";
  }
});

// ✅ FILTER MENU SIDEBAR
function filterMenuByRole(role, allowedPages) {
  const menuItems = document.querySelectorAll(".sidebar-menu li");
  
  menuItems.forEach(item => {
    const onclickAttr = item.getAttribute("onclick");
    
    if (onclickAttr) {
      // Extract page name dari onclick attribute
      const match = onclickAttr.match(/['"]([^'"]+)['"]/);
      
      if (match && match[1]) {
        const targetPage = match[1];
        
        // Sembunyikan menu jika user tidak punya akses
        if (!allowedPages.includes(targetPage)) {
          item.style.display = "none";
        } else {
          item.style.display = ""; // Tampilkan menu
        }
      }
    }
  });
}

// ✅ LOGOUT FUNCTION (bisa dipanggil dari dashboard)
export async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.clear();
    window.location.href = "index.html";
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// ✅ GET CURRENT USER INFO
export function getCurrentUserRole() {
  return currentUserRole;
}

export function getCurrentUserUid() {
  return currentUserUid;
}

// ✅ CHECK IF USER HAS PERMISSION (untuk dynamic checks)
export function hasPermission(pageName) {
  const allowedPages = permissions[currentUserRole] || [];
  return allowedPages.includes(pageName);
}
