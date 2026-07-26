// =========================================================================
// 0. INISIALISASI FIREBASE & SDK
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
// 2. LOGIKA INPUT SISTEM BARU & PENGECEKAN DUPLIKAT SN
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

document.addEventListener("DOMContentLoaded", async () => {
  tampilkanNamaUser();
  await fetchAllData(); // Ambil data awal untuk validasi duplikat Serial Number
});

window.simpanDataBaru = async function() {
  const valProduct = document.getElementById("input-product").value;
  const valSN = document.getElementById("input-sn").value.trim();
  const valPO = document.getElementById("input-po") ? document.getElementById("input-po").value.trim() : "-";
  const valStartDate = document.getElementById("input-date1") ? document.getElementById("input-date1").value : "-";
  const valEndDate = document.getElementById("input-date2") ? document.getElementById("input-date2").value : "-";

  if (valSN === "") {
    alert("Peringatan: Serial Number harus diisi!");
    return;
  }

  const cekDuplikat = dbSistem.find((item) => item.sn === valSN);
  if (cekDuplikat) {
    alert(`Gagal! Serial Number ${valSN} sudah terdaftar di sistem.`);
    return;
  }

  try {
    const dataBaru = {
      product: valProduct,
      sn: valSN,
      po: valPO,
      startDate: valStartDate,
      endDate: valEndDate,
      progres: 0,
      status: "New",
      createdAt: new Date()
    };

    await addDoc(collection(db, COLLECTION_NAME), dataBaru);
    alert("Sukses! Data Sistem berhasil disimpan ke Cloud.");

    // Setelah sukses disimpan, arahkan kembali ke halaman dashboard
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    alert("Terjadi kesalahan saat menyimpan ke cloud.");
  }
};
