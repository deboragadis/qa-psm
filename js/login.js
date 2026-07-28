import { 
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const formLogin = document.getElementById("loginForm");
const alertBox = document.getElementById("alertBox");
const btnSubmit = document.getElementById("btnSubmit");

function showNotification(message, type) {
  alertBox.style.display = "block";
  alertBox.textContent = message;
  alertBox.className = type === "success" ? "alert-box alert-success" : "alert-box alert-error";
}

// ✅ CUSTOM LOGIN FUNCTION - SUPPORT USERNAME!
async function loginWithUsername(username, password) {
  try {
    // 1. Cari user di Firestore by username
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error("Username tidak ditemukan");
    }

    // 2. Ambil email dari hasil query
    const userData = snapshot.docs[0].data();
    const email = userData.email;

    // 3. Login ke Firebase dengan email
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 4. Ambil data user dari Firestore
    const userDoc = snapshot.docs[0];
    const userDataComplete = userDoc.data();

    // 5. Simpan ke localStorage
    localStorage.setItem("active_user_role", userDataComplete.role);
    localStorage.setItem("loggedInUser", userDataComplete.username);
    localStorage.setItem("user_uid", user.uid);

    return userCredential;
  } catch (error) {
    throw error;
  }
}

// ✅ EVENT LISTENER FORM
formLogin.addEventListener("submit", async (event) => {
  event.preventDefault();
  alertBox.style.display = "none";

  const inputUsername = document.getElementById("username").value.trim();
  const inputPassword = document.getElementById("password").value.trim();

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = "Memproses...";

  try {
    // ✅ GUNAKAN LOGIN DENGAN USERNAME!
    await loginWithUsername(inputUsername, inputPassword);

    showNotification("Berhasil masuk! Mengalihkan...", "success");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1200);

  } catch (error) {
    console.error("Login error:", error.code);

    let errorMessage = "Login gagal!";
    
    if (error.message.includes("Username tidak ditemukan")) {
      errorMessage = "Username tidak ditemukan";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Password salah";
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
