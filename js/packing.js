// =========================================================================
// INISIALISASI FIREBASE & SDK
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPhQiSUsMueMYkQ0i680epEKQ7pYDsT_I",
  authDomain: "sitraqfmlx.firebaseapp.com",
  projectId: "sitraqfmlx",
  storageBucket: "sitraqfmlx.firebasestorage.app",
  messagingSenderId: "716935536178",
  appId: "1:716935536178:web:079ce066b79988d261262b",
  measurementId: "G-MP4FT9HRRD"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const COLLECTION_NAME = "dataSitraq";

const currentUser = localStorage.getItem("loggedInUser") || "Guest";

function tampilkanNamaUser() {
  const elemenNama = document.getElementById("nama-user");
  if (elemenNama) {
    const namaFormat = currentUser.charAt(0).toUpperCase() + currentUser.slice(1);
    elemenNama.innerText = namaFormat;
  }
}

// Global data list
let dbSistem = [];
let activeEditingId = null;

document.addEventListener("DOMContentLoaded", async () => {
  tampilkanNamaUser();
  await loadPackingData();
});

// Fungsi untuk menarik data yang progresnya sudah 100%
async function loadPackingData() {
  const tbody = document.getElementById("tabel-packing");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="15" style="text-align: center; color: #64748b; padding: 20px;">Memuat data 100% dari Cloud...</td></tr>`;

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    dbSistem = [];
    querySnapshot.forEach((docSnap) => {
      dbSistem.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Filter hanya yang progres === 100 atau status Completed
    const completedItems = dbSistem.filter(item => Number(item.progres) === 100 || item.status === "Completed");

    tbody.innerHTML = "";

    if (completedItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="15" style="text-align: center; color: #64748b; padding: 20px;">Belum ada data sistem dengan progres 100%.</td></tr>`;
      return;
    }

    completedItems.forEach((item) => {
      const tr = document.createElement("tr");
      tr.style.cursor = "pointer";
      tr.title = "Klik untuk edit data packing";

      tr.onclick = () => bukaFormEditor(item.id);

      tr.innerHTML = `
        <td style="font-weight: 600;">${item.product || "-"}</td>
        <td>${item.sn || "-"}</td>
        <td>${item.optional || "-"}</td>
        <td>${item.customer || "-"}</td>
        <td>${item.asalNegara || "-"}</td>
        <td>${item.rincianPo || item.po || "-"}</td>
        <td>${item.picQc || "-"}</td>
        <td>${item.planShipped || "-"}</td>
        <td>${item.packingDate || "-"}</td>
        <td>${item.woId || "-"}</td>
        <td>${item.woShipping || "-"}</td>
        <td>${item.woIntercompany || "-"}</td>
        <td>${item.statusCreate || "Ready"}</td>
        <td>${item.statusInstrument || "Progress pack"}</td>
        <td>${item.statusShipping || "Ready to shipped"}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Gagal memuat data packing:", error);
    tbody.innerHTML = `<tr><td colspan="15" style="text-align: center; color: #ef4444; padding: 20px;">Gagal mengambil data dari Cloud.</td></tr>`;
  }
}

// Buka Form Editor saat baris tabel diklik
window.bukaFormEditor = function(docId) {
  const item = dbSistem.find(d => d.id === docId);
  if (!item) return;

  activeEditingId = docId;
  document.getElementById("edit-doc-id").value = docId;
  document.getElementById("form-header-title").innerText = `🔥 Form Editor Packing Manual - SN: ${item.sn}`;

  // Isi form fields dengan data yang ada (atau kosong jika belum diisi)
  document.getElementById("pack-customer").value = item.customer || "";
  document.getElementById("pack-negara").value = item.asalNegara || "";
  document.getElementById("pack-rincian-po").value = item.rincianPo || item.po || "";
  document.getElementById("pack-pic").value = item.picQc || "";
  document.getElementById("pack-plan-shipped").value = item.planShipped || "";
  document.getElementById("pack-packing-date").value = item.packingDate || "";
  document.getElementById("pack-wo-id").value = item.woId || "";
  document.getElementById("pack-wo-shipping").value = item.woShipping || "";
  document.getElementById("pack-wo-intercompany").value = item.woIntercompany || "";
  
  document.getElementById("pack-status-create").value = item.statusCreate || "Ready";
  document.getElementById("pack-status-instrument").value = item.statusInstrument || "Progress pack";
  document.getElementById("pack-status-shipping").value = item.statusShipping || "Ready to shipped";

  // Render Matrix Table Rows
  const matrixTbody = document.getElementById("matrix-tbody");
  matrixTbody.innerHTML = "";
  
  if (item.packingMatrix && item.packingMatrix.length > 0) {
    item.packingMatrix.forEach(row => {
      tambahBarisMatrix(row.part, row.desc, row.qty);
    });
  } else {
    tambahBarisMatrix("", "", "");
  }

  // Toggle View
  document.getElementById("view-tabel").style.display = "none";
  document.getElementById("view-form").style.display = "block";
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Kembali ke tabel daftar
window.kembaliKeTabel = function() {
  document.getElementById("view-form").style.display = "none";
  document.getElementById("view-tabel").style.display = "block";
  activeEditingId = null;
  loadPackingData();
};

// Tambah Baris Matrix Item
window.tambahBarisMatrix = function(part = "", desc = "", qty = "") {
  const tbody = document.getElementById("matrix-tbody");
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="mat-part" value="${part}" placeholder="ex: 100-2401-01" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
    <td><input type="text" class="mat-desc" value="${desc}" placeholder="ex: Additional Cable" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
    <td><input type="text" class="mat-qty" value="${qty}" placeholder="ex: 2 Pcs" style="width: 100%; padding: 6px; border: 1px solid #cbd5e1; border-radius: 4px;"></td>
  `;
  tbody.appendChild(tr);
};

// Hapus Baris Terakhir Matrix Item
window.hapusBarisMatrix = function() {
  const tbody = document.getElementById("matrix-tbody");
  if (tbody.rows.length > 1) {
    tbody.deleteRow(tbody.rows.length - 1);
  } else {
    alert("Minimal harus ada 1 baris item!");
  }
};

// Simpan perubahan form packing manual ke Firestore
window.simpanPerubahanPacking = async function() {
  if (!activeEditingId) return;

  const customer = document.getElementById("pack-customer").value.trim();
  const asalNegara = document.getElementById("pack-negara").value.trim();
  const rincianPo = document.getElementById("pack-rincian-po").value.trim();
  const picQc = document.getElementById("pack-pic").value.trim();
  const planShipped = document.getElementById("pack-plan-shipped").value;
  const packingDate = document.getElementById("pack-packing-date").value;
  const woId = document.getElementById("pack-wo-id").value.trim();
  const woShipping = document.getElementById("pack-wo-shipping").value.trim();
  const woIntercompany = document.getElementById("pack-wo-intercompany").value.trim();
  
  const statusCreate = document.getElementById("pack-status-create").value;
  const statusInstrument = document.getElementById("pack-status-instrument").value;
  const statusShipping = document.getElementById("pack-status-shipping").value;

  // Kumpulkan data dari Dynamic Matrix Table
  const matrixRows = document.querySelectorAll("#matrix-tbody tr");
  let packingMatrix = [];
  matrixRows.forEach(tr => {
    const part = tr.querySelector(".mat-part").value.trim();
    const desc = tr.querySelector(".mat-desc").value.trim();
    const qty = tr.querySelector(".mat-qty").value.trim();
    if (part || desc || qty) {
      packingMatrix.push({ part, desc, qty });
    }
  });

  try {
    const docRef = doc(db, COLLECTION_NAME, activeEditingId);
    await updateDoc(docRef, {
      customer,
      asalNegara,
      rincianPo,
      picQc,
      planShipped,
      packingDate,
      woId,
      woShipping,
      woIntercompany,
      statusCreate,
      statusInstrument,
      statusShipping,
      packingMatrix
    });

    alert("Sukses! Data packing manual berhasil disimpan ke Cloud.");
    kembaliKeTabel();
  } catch (error) {
    console.error("Gagal menyimpan data packing:", error);
    alert("Terjadi kesalahan saat menyimpan perubahan ke database.");
  }
};

// Toggle sidebar & Logout (mengikuti fungsi universal common/script)
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
