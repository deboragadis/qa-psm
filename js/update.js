// =========================================================================
// 0. INISIALISASI FIREBASE & SDK
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPhQiSUsMueMYkQ0i680epEKQ7pYDsT_I",
  authDomain: "sitraqfmlx.firebaseapp.com",
  projectId: "sitraqfmlx",
  storageBucket: "sitraqfmlx.firebasestorage.app",
  messagingSenderId: "716935536178",
  appId: "1:716935536178:web:079ce066b79988d261262b",
  measurementId: "G-MP4FT9HRRD"
};

// Inisialisasi Firebase & Firestore
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const COLLECTION_NAME = "dataSitraq";

// =========================================================================
// 1. AMBIL DATA USER & SIDEBAR (COMMON LOGIC)
// =========================================================================
const currentUser = localStorage.getItem("loggedInUser") || "Guest";

function tampilkanNamaUser() {
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

// =========================================================================
// 2. LOGIKA UPDATE PROGRES QC
// =========================================================================
let dbSistem = [];

async function fetchAllData() {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    dbSistem = [];
    querySnapshot.forEach((docSnap) => {
      dbSistem.push({ id: docSnap.id, ...docSnap.data() });
    });
  } catch (error) {
    console.error("Gagal mengambil data dari Cloud:", error);
  }
}

function populateUpdateDropdown() {
  const selectSN = document.getElementById("update-sn");
  if (!selectSN) return;

  selectSN.innerHTML = `<option value="">-- Pilih SN Sistem --</option>`;
  dbSistem.forEach(item => {
    const opt = document.createElement("option");
    opt.value = item.sn;
    opt.textContent = `${item.sn} (${item.product})`;
    selectSN.appendChild(opt);
  });
}

window.isiOtomatisUpdate = function() {
  const selectedSN = document.getElementById("update-sn").value;
  const targetItem = dbSistem.find(item => item.sn === selectedSN);

  if (targetItem) {
    document.getElementById("update-progres").value = targetItem.progres || 0;
    document.getElementById("update-status").value = targetItem.status || "New";
  } else {
    document.getElementById("update-progres").value = "";
    document.getElementById("update-status").value = "New";
  }
};

window.simpanUpdateProgres = async function() {
  const selectedSN = document.getElementById("update-sn").value;
  const newProgres = Number(document.getElementById("update-progres").value);
  const newStatus = document.getElementById("update-status").value;

  if (!selectedSN) {
    alert("Peringatan: Silakan pilih Serial Number terlebih dahulu!");
    return;
  }

  if (newProgres < 0 || newProgres > 100) {
    alert("Peringatan: Progres harus di antara 0 hingga 100!");
    return;
  }

  const targetItem = dbSistem.find(item => item.sn === selectedSN);
  if (!targetItem) {
    alert("Data tidak ditemukan!");
    return;
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, targetItem.id);
    await updateDoc(docRef, {
      progres: newProgres,
      status: newStatus
    });

    alert(`Sukses! Progres untuk SN ${selectedSN} berhasil diperbarui.`);
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Gagal mengupdate progres:", error);
    alert("Terjadi kesalahan saat memperbarui data di Cloud.");
  }
};

// Inisialisasi saat halaman update.html dimuat
document.addEventListener("DOMContentLoaded", async () => {
  tampilkanNamaUser();
  await fetchAllData();
  populateUpdateDropdown();
});
