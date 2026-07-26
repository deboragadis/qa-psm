// =========================================================================
// INISIALISASI FIREBASE & RESUME EMAIL REPORT
// =========================================================================
import { db, COLLECTION_NAME } from "./firebase.js";
import { tampilkanNamaUser } from "./common.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let dbSistem = [];
let textForMailto = ""; // Variabel penyimpan versi teks biasa untuk mailto

async function fetchAllData() {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    dbSistem = [];
    querySnapshot.forEach((docSnap) => {
      dbSistem.push({ id: docSnap.id, ...docSnap.data() });
    });
    generatePreview();
  } catch (error) {
    console.error("Gagal mengambil data untuk email report:", error);
  }
}

function generatePreview() {
  const previewDiv = document.getElementById("email-preview-content");
  if (!previewDiv) return;

  if (dbSistem.length === 0) {
    previewDiv.innerHTML = "<p>Tidak ada data sistem yang tersedia untuk dibuat resumenya.</p>";
    textForMailto = "Tidak ada data sistem yang tersedia untuk dibuat resumenya.";
    return;
  }

  const totalRI = dbSistem.filter(item => item.product === "RI360" || item.product === "Rock Imager").length;
  const totalNT8 = dbSistem.filter(item => item.product === "NT8").length;
  const totalFormulator = dbSistem.filter(item => item.product === "Formulator").length;
  const totalSelesai = dbSistem.filter(item => item.progres === 100 || item.status === "Completed").length;
  const totalShipment = dbSistem.filter(item => item.status === "Shipped").length;
  const tanggalLaporan = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // === 1. BUAT VERSI HTML (TABEL SUPER RAPAT) UNTUK PREVIEW DI UI ===
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h3 style="text-align: center; color: #3b82f6; margin: 0 0 2px 0; font-size: 14px;">LAPORAN RESUME PROGRES QC INSTRUMENT (SITRAQ)</h3>
      <p style="text-align: center; margin: 0 0 8px 0; font-size: 12px;"><strong>Tanggal Laporan:</strong> ${tanggalLaporan}</p>

      <h4 style="margin: 0 0 2px 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; font-size: 13px;">RINGKASAN STOK & PROGRES</h4>
      <ul style="margin: 2px 0 8px 0; padding-left: 20px; font-size: 12px; line-height: 1.1;">
        <li>Total Sistem Terdaftar: <strong>${dbSistem.length}</strong></li>
        <li>RI360 / Rock Imager: <strong>${totalRI}</strong></li>
        <li>NT8: <strong>${totalNT8}</strong></li>
        <li>Formulator: <strong>${totalFormulator}</strong></li>
        <li>QC Selesai (100%): <strong>${totalSelesai}</strong></li>
        <li>Shipped: <strong>${totalShipment}</strong></li>
      </ul>

      <h4 style="margin: 0 0 2px 0; color: #1e293b; border-bottom: 1px solid #e2e8f0; font-size: 13px;">DETAIL DAFTAR SISTEM & PROGRES</h4>
      <table border="1" cellpadding="2" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; border-color: #cbd5e1;">
        <thead style="background-color: #f1f5f9; color: #334155;">
          <tr>
            <th style="padding: 3px;">No</th>
            <th style="padding: 3px;">Product</th>
            <th style="padding: 3px;">SN</th>
            <th style="padding: 3px;">Optional</th>
            <th style="padding: 3px; text-align: center;">Progres</th>
            <th style="padding: 3px;">Notes</th>
            <th style="padding: 3px;">Status</th>
          </tr>
        </thead>
        <tbody>
  `;

  // === 2. BUAT VERSI TEKS BIASA UNTUK TOMBOL MAILTO (FALLBACK) ===
  textForMailto = `=== LAPORAN RESUME PROGRES QC INSTRUMENT (SITRAQ) ===\n`;
  textForMailto += `Tanggal Laporan: ${tanggalLaporan}\n\n`;
  textForMailto += `--- RINGKASAN STOK & PROGRES ---\n`;
  textForMailto += `• Total Sistem Terdaftar: ${dbSistem.length}\n`;
  textForMailto += `• RI360 / Rock Imager: ${totalRI}\n`;
  textForMailto += `• NT8: ${totalNT8}\n`;
  textForMailto += `• Formulator: ${totalFormulator}\n`;
  textForMailto += `• QC Selesai (100%): ${totalSelesai}\n`;
  textForMailto += `• Shipped: ${totalShipment}\n\n`;
  textForMailto += `--- DETAIL DAFTAR SISTEM & PROGRES ---\n`;

  dbSistem.forEach((item, index) => {
    let catatanNote = "-";
    if (item.checklist) {
      let keys = Object.keys(item.checklist);
      let aktif = keys.filter(k => item.checklist[k] === true);
      if (aktif.length > 0) {
        catatanNote = aktif[aktif.length - 1].replace(/_/g, " ");
      }
    }

    // Tambah row tabel ke HTML (Rapat)
    htmlContent += `
      <tr>
        <td style="padding: 3px; text-align: center;">${index + 1}</td>
        <td style="padding: 3px;"><strong>${item.product}</strong></td>
        <td style="padding: 3px;">${item.sn}</td>
        <td style="padding: 3px;">${item.optional || '-'}</td>
        <td style="padding: 3px; color: #2563eb; font-weight: bold; text-align: center;">${item.progres}%</td>
        <td style="padding: 3px;">${catatanNote}</td>
        <td style="padding: 3px;">${item.status}</td>
      </tr>
    `;

    // Tambah baris ke versi teks biasa
    textForMailto += `${index + 1}. [${item.product}] SN: ${item.sn} | Optional: ${item.optional || '-'} | Progres: ${item.progres}% (${catatanNote}) | Status: ${item.status}\n`;
  });

  htmlContent += `
        </tbody>
      </table>
    </div>
  `;

  // Tampilkan format HTML ke dalam tag div preview
  previewDiv.innerHTML = htmlContent;
}

// Fungsi kirim email via mailto
window.kirimEmailReport = function() {
  const emailTo = document.getElementById("email-to").value;
  const subject = document.getElementById("email-subject").value;

  if (!emailTo) {
    alert("Email tujuan wajib diisi!");
    return;
  }

  const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textForMailto)}`;
  window.location.href = mailtoUrl;
};

// =========================================================================
// FUNGSI SALIN TABEL HTML UNTUK DI-PASTE KE GMAIL/OUTLOOK
// =========================================================================
window.salinTabelKeClipboard = function() {
  const previewDiv = document.getElementById("email-preview-content");
  if (!previewDiv) return;

  const range = document.createRange();
  range.selectNodeContents(previewDiv);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  try {
    document.execCommand('copy');
    alert("Tabel berhasil disalin! Silakan buka aplikasi Email Anda (Gmail/Outlook) lalu tekan Paste (Ctrl+V).");
  } catch (err) {
    console.error("Gagal menyalin:", err);
    alert("Gagal menyalin tabel.");
  }
  
  selection.removeAllRanges();
};

document.addEventListener("DOMContentLoaded", async () => {
  tampilkanNamaUser();
  await fetchAllData();
});

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
