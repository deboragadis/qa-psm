// =========================================================================
// INISIALISASI FIREBASE & SDK
// =========================================================================
import { db, COLLECTION_NAME } from "./firebase.js";
import { tampilkanNamaUser } from "./common.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let dbSistem = [];

// Tarik data dari Cloud Firestore untuk validasi duplikat Serial Number
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

// Logika Interaktif: Jika Status PO "Belum ada PO", kunci field Customer & Nomor PO
window.toggleStatusPO = function() {
  const statusPO = document.getElementById("input-status-po").value;
  const inputPO = document.getElementById("input-po");
  const inputCustomer = document.getElementById("input-customer");

  if (statusPO === "Belum ada PO") {
    inputPO.value = "Belum ada PO";
    inputPO.disabled = true;
    inputPO.style.backgroundColor = "#f1f5f9";
    inputPO.style.color = "#64748b";

    inputCustomer.value = "Belum ada PO";
    inputCustomer.disabled = true;
    inputCustomer.style.backgroundColor = "#f1f5f9";
    inputCustomer.style.color = "#64748b";
  } else {
    inputPO.value = "";
    inputPO.disabled = false;
    inputPO.style.backgroundColor = "#ffffff";
    inputPO.style.color = "#000000";

    inputCustomer.value = "";
    inputCustomer.disabled = false;
    inputCustomer.style.backgroundColor = "#ffffff";
    inputCustomer.style.color = "#000000";
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  tampilkanNamaUser();
  await fetchAllData();
  
  // Set tanggal default hari ini ke Start Date QC dan Plan Shipped
  const today = new Date().toISOString().split('T')[0];
  if (document.getElementById("input-date1")) document.getElementById("input-date1").value = today;
  if (document.getElementById("input-plan-shipped")) document.getElementById("input-plan-shipped").value = today;

  // Otomatis pilih PIC QC berdasarkan user yang sedang login dan kunci (disabled)
  const loggedInUser = localStorage.getItem("loggedInUser");
  const selectPic = document.getElementById("input-pic");
  if (loggedInUser && selectPic) {
    const formattedUser = loggedInUser.charAt(0).toUpperCase() + loggedInUser.slice(1).toLowerCase();
    
    for (let option of selectPic.options) {
      if (option.value === formattedUser) {
        selectPic.value = formattedUser;
        break;
      }
    }
    
    // Mengunci dropdown agar tidak bisa diubah-ubah
    selectPic.disabled = true;
    selectPic.style.backgroundColor = "#f1f5f9";
    selectPic.style.color = "#64748b";
    selectPic.style.cursor = "not-allowed";
  }
});

// Simpan Data Baru ke Cloud Firestore
window.simpanDataBaru = async function() {
  const product = document.getElementById("input-product").value;
  const sn = document.getElementById("input-sn").value.trim();
  const optional = document.getElementById("input-optional").value;
  const customer = document.getElementById("input-customer").value.trim();
  const statusPo = document.getElementById("input-status-po").value;
  const po = document.getElementById("input-po").value.trim();
  
  // Mengambil nilai PIC QC meskipun elemennya berstatus disabled
  const selectPic = document.getElementById("input-pic");
  const picQc = selectPic ? selectPic.value : "Guest";
  
  const planShipped = document.getElementById("input-plan-shipped").value || "-";
  const startDate = document.getElementById("input-date1").value || "-";
  const endDate = "-"; // End Date non-aktif karena progres awal masih 0%

  if (sn === "") {
    alert("Peringatan: Serial Number harus diisi!");
    return;
  }

  const cekDuplikat = dbSistem.find((item) => item.sn === sn);
  if (cekDuplikat) {
    alert(`Gagal! Serial Number ${sn} sudah terdaftar di sistem.`);
    return;
  }

  try {
    const dataBaru = {
      product,
      sn,
      optional,
      customer,
      statusPo,
      po,
      picQc,
      planShipped,
      startDate,
      endDate,
      progres: 0, // Progres awal 0%
      status: "New",
      createdAt: new Date()
    };

    await addDoc(collection(db, COLLECTION_NAME), dataBaru);
    alert("Sukses! Data Sistem berhasil disimpan ke Cloud.");

    window.location.href = "dashboard.html";
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    alert("Terjadi kesalahan saat menyimpan ke cloud.");
  }
};

window.toggleSidebar = function() {
  const sidebar = document.querySelector(".sidebar");
  if (window.innerWidth <= 768) {
    sidebar.classList.toggle("mobile-show");
  } else {
    sidebar.classList.toggle("sembunyi");
  }
};

window.logoutUser = function() {
  const konfirmasi = confirm("Apakah Anda yakin ingin keluar?");
  if (konfirmasi) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("active_user_role");
    window.location.href = "index.html";
  }
};
