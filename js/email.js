// =========================================================================
// INISIALISASI FIREBASE & RESUME EMAIL REPORT
// =========================================================================
import { db, COLLECTION_NAME } from "./firebase.js";
import { tampilkanNamaUser } from "./common.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let dbSistem = [];

async function fetchAllData() {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    dbSistem = [];
    querySnapshot.forEach((docSnap) => {
      dbSistem.push({ id: docSnap.id, ...docSnap.data() });
    });
    generatePreview();
  } catch (error) {
    console.error("Gagal mengambil data untuk report:", error);
  }
}

function generatePreview() {
  const previewDiv = document.getElementById("email-preview-content");
  if (!previewDiv) return;

  if (dbSistem.length === 0) {
    previewDiv.innerText = "Tidak ada data sistem yang tersedia untuk dibuat resumenya.";
    return;
  }

  const totalRI = dbSistem.filter(item => item.product === "RI360" || item.product === "Rock Imager").length;
  const totalNT8 = dbSistem.filter(item => item.product === "NT8").length;
  const totalFormulator = dbSistem.filter(item => item.product === "Formulator").length;
  const totalSelesai = dbSistem.filter(item => item.progres === 100 || item.status === "Completed").length;
  const totalShipment = dbSistem.filter(item => item.status === "Shipped").length;

  let resumeText = `=== LAPORAN RESUME PROGRES QC INSTRUMENT (SITRAQ) ===\n`;
  resumeText += `Tanggal Laporan: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
  resumeText += `--- RINGKASAN STOK & PROGRES ---\n`;
  resumeText += `• Total Sistem Terdaftar: ${dbSistem.length}\n`;
  resumeText += `• Rock Imager / RI360: ${totalRI}\n`;
  resumeText += `• NT8: ${totalNT8}\n`;
  resumeText += `• Formulator: ${totalFormulator}\n`;
  resumeText += `• QC Selesai (100%): ${totalSelesai}\n`;
  resumeText += `• Shipped: ${totalShipment}\n\n`;
  resumeText += `--- DETAIL DAFTAR SISTEM & PROGRES ---\n`;

  dbSistem.forEach((item, index) => {
    resumeText += `${index + 1}. [${item.product}] SN: ${item.sn} | Optional: ${item.optional || '-'} | Progres: ${item.progres}% | Status: ${item.status}\n`;
  });

  previewDiv.innerText = resumeText;
}

document.addEventListener("DOMContentLoaded", async () => {
  tampilkanNamaUser();
  await fetchAllData();
});

window.kirimEmailReport = function() {
  const emailTo = document.getElementById("email-to").value;
  const subject = document.getElementById("email-subject").value;
  const previewDiv = document.getElementById("email-preview-content");

  if (!emailTo) {
    alert("Email tujuan wajib diisi!");
    return;
  }

  const bodyText = previewDiv ? previewDiv.innerText : "";
  const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

  window.location.href = mailtoUrl;
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
