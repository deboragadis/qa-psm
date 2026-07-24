// =========================================================================
// 0. INISIALISASI FIREBASE & SDK
// =========================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const COLLECTION_NAME = "dataSitraq"; // Nama koleksi di Firebase Firestore

// =========================================================================
// 1. AMBIL DATA USER LOGIN DARI STORAGE
// =========================================================================
const currentUser = localStorage.getItem("loggedInUser") || "Guest";

function tampilkanNamaUser(username) {
  const elemenNama = document.getElementById("nama-user");
  if (elemenNama) {
    const namaFormat = username.charAt(0).toUpperCase() + username.slice(1);
    elemenNama.innerText = namaFormat;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  tampilkanNamaUser(currentUser);
  window.renderTabelTracking(); // Ambil data awal dari Cloud
});

// =========================================================================
// 2. MANAJEMEN TAB SIDEBAR & TOGGLE RESPONSIF
// =========================================================================
window.showTab = function(tabId) {
  const contents = document.querySelectorAll(".tab-content");
  contents.forEach((content) => {
    content.classList.remove("active");
  });

  const menuItems = document.querySelectorAll(".sidebar-menu li");
  menuItems.forEach((item) => {
    item.classList.remove("active");
  });

  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.add("active");
  }

  const activeMenu = Array.from(menuItems).find((item) => {
    const onclickAttr = item.getAttribute("onclick");
    return onclickAttr && onclickAttr.includes(tabId);
  });
  
  if (activeMenu) {
    activeMenu.classList.add("active");
  }

  // KHUSUS HP: Otomatis tutup sidebar setelah menu diklik agar tidak menutupi layar
  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.classList.remove("mobile-show");
    }
  }
};

// Fungsi Toggle Sidebar untuk Desktop & HP
window.toggleSidebar = function() {
  const sidebar = document.querySelector(".sidebar");
  if (window.innerWidth <= 768) {
    // Di HP, gunakan animasi drawer melayang (mobile-show)
    sidebar.classList.toggle("mobile-show");
  } else {
    // Di Desktop, gunakan geser sembunyi biasa
    sidebar.classList.toggle("sembunyi");
  }
};

// =========================================================================
// 3. LOGIKA LOGOUT
// =========================================================================
window.logoutUser = function() {
  const konfirmasi = confirm("Apakah Anda yakin ingin keluar?");
  if (konfirmasi) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("active_user_role");
    window.location.href = "index.html";
  }
};

// =========================================================================
// 4. LOGIKA DATABASE CLOUD (FIREBASE), CRUD & CHARTS
// =========================================================================
let dbSistem = [];

let barChartInstance = null;
let donutChartInstance = null;

// Fungsi untuk menyimpan data baru ke Cloud Firestore
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

    // Reset form input
    document.getElementById("input-sn").value = "";
    if (document.getElementById("input-po")) document.getElementById("input-po").value = "";
    if (document.getElementById("input-date1")) document.getElementById("input-date1").value = "";
    if (document.getElementById("input-date2")) document.getElementById("input-date2").value = "";

    window.renderTabelTracking();
    window.showTab("tracking");
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    alert("Terjadi kesalahan saat menyimpan ke cloud.");
  }
};

// Fungsi untuk menghapus data dari Cloud Firestore berdasarkan ID dokumen
window.hapusData = async function(docId, sn) {
  const konfirmasi = confirm(`Apakah Anda yakin ingin menghapus data dengan SN: ${sn}?`);
  if (!konfirmasi) return;

  try {
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
    alert("Data berhasil dihapus dari Cloud!");
    window.renderTabelTracking();
  } catch (error) {
    console.error("Gagal menghapus data:", error);
    alert("Gagal menghapus data.");
  }
};

// Fungsi untuk memperbarui angka pada box ringkasan
function updateSummaryBoxes() {
  const totalRI = dbSistem.filter(item => item.product === "Rock Imager").length;
  const totalNT8 = dbSistem.filter(item => item.product === "NT8").length;
  const totalFormulator = dbSistem.filter(item => item.product === "Formulator").length;
  const totalQCSelesai = dbSistem.filter(item => item.progres === 100 || item.status === "Completed").length;
  const totalShipment = dbSistem.filter(item => item.status === "Shipped").length;

  const valueBoxes = document.querySelectorAll("#tracking .value-box p");
  if (valueBoxes.length >= 5) {
    valueBoxes[0].innerText = totalRI;
    valueBoxes[1].innerText = totalNT8;
    valueBoxes[2].innerText = totalFormulator;
    valueBoxes[3].innerText = totalQCSelesai;
    valueBoxes[4].innerText = totalShipment;
  }
}

// Fungsi untuk merender grafik Chart.js
function renderCharts() {
  const barCtx = document.getElementById('barChart');
  if (barCtx) {
    const labels = dbSistem.map(item => item.sn);
    const dataProgres = dbSistem.map(item => item.progres);

    if (barChartInstance) {
      barChartInstance.destroy();
    }

    barChartInstance = new Chart(barCtx, {
      type: 'bar',
      data: {
        labels: labels.length > 0 ? labels : ['Belum Ada Data'],
        datasets: [{
          label: 'Progres (%)',
          data: dataProgres.length > 0 ? dataProgres : [0],
          backgroundColor: '#3b82f6',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  const donutCtx = document.getElementById('donutChart');
  if (donutCtx) {
    const countRI = dbSistem.filter(item => item.product === 'Rock Imager').length;
    const countNT8 = dbSistem.filter(item => item.product === 'NT8').length;
    const countFormulator = dbSistem.filter(item => item.product === 'Formulator').length;

    if (donutChartInstance) {
      donutChartInstance.destroy();
    }

    donutChartInstance = new Chart(donutCtx, {
      type: 'doughnut',
      data: {
        labels: ['Rock Imager', 'NT8', 'Formulator'],
        datasets: [{
          data: [countRI, countNT8, countFormulator],
          backgroundColor: ['#3b82f6', '#f59e0b', '#10b981']
        }]
      },
      options: {
        responsive: true
      }
    });
  }
}

// Fungsi utama untuk menarik data dari Cloud Firestore dan menampilkannya ke Tabel
window.renderTabelTracking = async function() {
  const tbody = document.getElementById("tabel-tracking");
  if (!tbody) return; 

  tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">Memuat data dari Cloud...</td></tr>`;

  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    dbSistem = [];
    querySnapshot.forEach((docSnap) => {
      // Menyimpan ID unik Firestore agar bisa dipakai saat hapus data
      dbSistem.push({ id: docSnap.id, ...docSnap.data() });
    });

    tbody.innerHTML = "";

    if (dbSistem.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">Data kosong. Silakan Input Sistem Baru.</td></tr>`;
      updateSummaryBoxes();
      renderCharts();
      return;
    }

    dbSistem.forEach((item) => {
      const tr = document.createElement("tr");
      let statusWarna = item.progres === 100 ? "#10b981" : "#3b82f6";

      tr.innerHTML = `
        <td style="font-weight: 600;">${item.product}</td>
        <td>${item.sn}</td>
        <td style="color: #64748b;">${item.startDate} s/d ${item.endDate}</td>
        <td><strong>${item.progres}%</strong></td>
        <td><span style="background-color: ${statusWarna}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${item.status}</span></td>
        <td>
          <button onclick="hapusData('${item.id}', '${item.sn}')" style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
            <i class="fas fa-trash"></i> Hapus
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    updateSummaryBoxes();
    renderCharts();
  } catch (error) {
    console.error("Gagal mengambil data:", error);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #ef4444; padding: 20px;">Gagal memuat data dari Cloud.</td></tr>`;
  }
};

// =========================================================================
// 5. FITUR EXPORT CSV / EXCEL
// =========================================================================
window.exportToCSV = function() {
  if (!dbSistem || dbSistem.length === 0) {
    alert("Tidak ada data yang bisa diexport! Data masih kosong.");
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Product,Serial Number,PO Number,Start Date,End Date,Progres (%),Status\n";

  dbSistem.forEach(item => {
    let row = [
      `"${item.product || ''}"`,
      `"${item.sn || ''}"`,
      `"${item.po || ''}"`,
      `"${item.startDate || ''}"`,
      `"${item.endDate || ''}"`,
      `"${item.progres || 0}"`,
      `"${item.status || ''}"`
    ];
    csvContent += row.join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "data_sitraq_export.csv");
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
};

// =========================================================================
// 6. FITUR IMPORT CSV / EXCEL KE CLOUD
// =========================================================================
window.importFromCSV = async function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const text = e.target.result;
    const lines = text.split("\n");
    
    let successCount = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, '').trim());
      
      if (cols.length >= 2) {
        const [product, sn, po, startDate, endDate, progres, status] = cols;
        
        if (sn) {
          try {
            await addDoc(collection(db, COLLECTION_NAME), {
              product: product || "NT8",
              sn: sn,
              po: po || "-",
              startDate: startDate || "-",
              endDate: endDate || "-",
              progres: Number(progres) || 0,
              status: status || "New",
              createdAt: new Date()
            });
            successCount++;
          } catch (err) {
            console.error("Gagal import baris SN:", sn, err);
          }
        }
      }
    }

    alert(`Import selesai! Berhasil menambahkan ${successCount} data ke Cloud.`);
    event.target.value = ""; 
    window.renderTabelTracking(); 
  };
  
  reader.readAsText(file);
};
