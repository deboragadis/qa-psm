import { 
  signInWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const formLogin = document.getElementById("loginForm");
const alertBox = document.getElementById("alertBox");
const btnSubmit = document.getElementById("btnSubmit");

function showNotification(message, type) {
  alertBox.style.display = "block";
  alertBox.textContent = message;
  alertBox.className = type === "success" ? "alert-box alert-success" : "alert-box alert-error";
}

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault();
  alertBox.style.display = "none";

  const inputEmail = document.getElementById("username").value.trim();
  const inputPassword = document.getElementById("password").value.trim();

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = "Memproses...";

  try {
    // ✅ Firebase handle authentication di server (aman!)
    const userCredential = await signInWithEmailAndPassword(auth, inputEmail, inputPassword);
    const user = userCredential.user;

    // ✅ Ambil role dari Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    if (userData) {
      // Simpan di localStorage
      localStorage.setItem("active_user_role", userData.role);
      localStorage.setItem("loggedInUser", userData.username);
      localStorage.setItem("user_uid", user.uid);

      showNotification("Berhasil masuk! Mengalihkan...", "success");

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1200);
    } else {
      throw new Error("Data user tidak ditemukan di Firestore");
    }

  } catch (error) {
    console.error("Login error:", error.code);

    let errorMessage = "Login gagal!";
    
    if (error.code === "auth/user-not-found") {
      errorMessage = "Email tidak terdaftar";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Password salah";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Format email tidak valid";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "Terlalu banyak percobaan login, coba lagi nanti";
    }

    showNotification(errorMessage, "error");
    document.getElementById("password").value = "";
    document.getElementById("password").focus();
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = "Masuk";
  }
});
